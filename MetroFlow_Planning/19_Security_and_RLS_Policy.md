# MetroFlow — Security & RLS Policy Document

**Document 19** · Phase 1 Architecture
**Status:** Design artifact — policies illustrative, **not applied**. Aligns with Doc 08 (tables) and Doc 09 (auth flow).

---

## 1. Security model overview

Defense in depth, three layers:
1. **Supabase Auth** — identity, JWT issuance, password/email verification.
2. **Postgres RLS** — every table denies by default; policies grant per role/network. Enforced even if the API is bypassed.
3. **FastAPI guards** — `require_auth/operator/admin` dependencies + input validation + rate limiting + audit.

Roles: **`admin`** (full, all networks, config) · **`operator`** (monitoring + alerts for `assigned_network`, read-only on config).

---

## 2. Auth policies
- Email/password via Supabase; email verification required before dashboard access.
- Passwords hashed by Supabase (bcrypt/scrypt); never stored by us.
- JWT: short-lived access token + refresh; FastAPI checks signature, `aud`, `exp`, leeway.
- New signup → `profiles` row via trigger, default `role='operator'`, `assigned_network=null` until an admin assigns; **admin role only by admin promotion/invite** (never self-serve).
- Session handling in web via Supabase SSR helpers; route middleware guards `(dashboard)` and admin-only pages.

---

## 3. Row-Level Security (illustrative policies — NOT executed)

```sql
-- helper: current profile
create or replace function auth_role() returns text language sql stable as
$$ select role::text from public.profiles where id = auth.uid() $$;
create or replace function auth_network() returns text language sql stable as
$$ select assigned_network from public.profiles where id = auth.uid() $$;

-- profiles: self read; admin all; self update limited
alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select
  using ( id = auth.uid() or auth_role() = 'admin' );
create policy profiles_self_update on public.profiles for update
  using ( id = auth.uid() ) with check ( id = auth.uid() and role = (select role from public.profiles where id = auth.uid()) );
create policy profiles_admin_all on public.profiles for all
  using ( auth_role() = 'admin' ) with check ( auth_role() = 'admin' );

-- monitoring/dataset tables: authenticated read, network-scoped for operators
alter table public.metro_stations enable row level security;
create policy stations_read on public.metro_stations for select
  using ( auth_role() = 'admin' or metro_name = auth_network() or auth_network() is null );
-- (same pattern applied to passenger_flow/occupancy/operations via station join or denormalized metro_name)

-- alerts: read by network; operators ack (own network); admins all; only admin insert emergency
alter table public.alerts enable row level security;
create policy alerts_read on public.alerts for select
  using ( auth_role() = 'admin'
          or exists (select 1 from public.metro_stations s
                     where s.station_id = alerts.station_id and s.metro_name = auth_network()) );
create policy alerts_ack on public.alerts for update
  using ( auth_role() in ('admin','operator') )
  with check ( status in ('acknowledged','resolved') );          -- cannot re-open/spoof
create policy alerts_admin_insert on public.alerts for insert
  with check ( auth_role() = 'admin' );

-- schedule_recommendations: read all authed; only admin can apply/dismiss (update)
alter table public.schedule_recommendations enable row level security;
create policy reco_read on public.schedule_recommendations for select using ( true );
create policy reco_decide on public.schedule_recommendations for update
  using ( auth_role() = 'admin' );

-- audit_log: insert-only from app; admin read; nobody updates/deletes
alter table public.audit_log enable row level security;
create policy audit_admin_read on public.audit_log for select using ( auth_role() = 'admin' );
create policy audit_insert on public.audit_log for insert with check ( true );

-- notifications: user reads/updates only their own
alter table public.notifications enable row level security;
create policy notif_own on public.notifications for all
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- model_metadata: read operator+; write admin only
alter table public.model_metadata enable row level security;
create policy model_read on public.model_metadata for select using ( auth_role() in ('admin','operator') );
create policy model_write on public.model_metadata for all using ( auth_role() = 'admin' ) with check ( auth_role() = 'admin' );
```

> Dataset fact tables (`passenger_flow`, `ticket_transactions`, `train_operations`, `train_occupancy`) enable RLS with an authenticated-read policy, network-scoped for operators via a join/denormalized `metro_name`. Server-side jobs use the **service role key** (bypasses RLS) for loading/replay/aggregation only.

---

## 4. RLS ↔ role matrix

| Table | Operator | Admin |
|---|---|---|
| profiles | self r/w (not role), read same-network | full |
| metro_stations / flow / occupancy / operations | read (assigned_network) | read all |
| alerts | read+ack+resolve (network) | +insert/broadcast, all |
| schedule_recommendations | read | +apply/dismiss |
| model_metadata | read | full |
| audit_log | — | read |
| notifications | own | own (+system) |

---

## 5. Application-layer controls
- **Input validation:** Pydantic everywhere; reject unknown fields; bound sizes/pagination.
- **Rate limiting:** Redis token-bucket per user/IP; stricter on auth + broadcast.
- **CORS:** allowlist web origins only.
- **Headers:** HSTS, CSP, X-Content-Type-Options, Referrer-Policy, no-sniff (via Next.js + API middleware).
- **Secrets:** Doc 17 rules; service role key server-only.
- **Audit:** all mutating/admin actions → `audit_log` (actor, action, entity, payload, ts).
- **Least privilege:** operators cannot apply schedules, broadcast, manage users, or control replay.
- **PII:** minimal — profiles + synthetic operational data; **no CCTV/biometrics** (brand + privacy stance). Ticket data has no personal identity fields.

---

## 6. Data protection & compliance posture
- TLS in transit; Supabase encryption at rest.
- Backups: Supabase managed PITR; `audit_log` retained per policy.
- Government-grade traceability: immutable audit trail, model-version provenance on every prediction (`prediction_history.model_id`).
- Incident response: emergency broadcast + alert workflow; admin-only.

---

## 7. Threats & mitigations (STRIDE-lite)
| Threat | Mitigation |
|---|---|
| Spoofing | Supabase JWT verify (aud/exp/sig) |
| Tampering | RLS + audit + validation; ack cannot re-open |
| Repudiation | audit_log immutable |
| Info disclosure | RLS network scoping; no service key in web |
| DoS | rate limiting, caching, pagination caps |
| Elevation of privilege | role checks in DB (RLS) + API; admin promotion admin-only |
