# MetroFlow — FastAPI Backend Architecture

**Document 09** · Phase 1 Architecture
**Status:** Design artifact — not implemented. Names align with Doc 08 (schema), Doc 11 (API), Doc 12 (folders).

---

## 1. Responsibilities

FastAPI is the **AI + heavy-analytics + realtime** service (Doc 5 hybrid split). It does **not** own auth issuance (Supabase does) — it **verifies** Supabase JWTs and enforces role/RLS context. It owns: prediction serving, analytics aggregation, alerts logic, scheduling recommendations, the replay engine, WebSocket streaming, and background jobs.

```
Client (Next.js) ──JWT──► FastAPI ──► services ──► repositories ──► Supabase Postgres
                                   └──► ai_client ──► services/ai (models)
                                   └──► Redis (cache, pubsub, rate-limit, live state)
                                   └──► WebSocket / Socket.IO ──► clients
Supabase Realtime ───────────────────────────────────────────► clients (DB change events)
```

---

## 2. Layered architecture (request lifecycle)

```
HTTP → Middleware (CORS, request-id, logging, rate-limit)
     → Auth dependency (verify JWT, load profile+role, set RLS context)
     → Route (app/api/v1/routes/*)         # thin: validate + delegate
     → Service (app/services/*)            # business logic, orchestration
     → Repository (app/repositories/*)     # DB queries (SQLAlchemy), no logic
     → DB / Redis / ai_client
     ← Pydantic response schema → envelope → client
```

**Rules:** routes never touch the DB directly; services never build SQL strings (repositories do); repositories never contain business rules. This keeps units testable (Doc 18).

---

## 3. Module map

| Concern | Route | Service | Repository / dep |
|---|---|---|---|
| Stations/flow/occupancy | stations, flow, occupancy | monitoring_service | flow_repo, station_repo |
| Congestion heatmap | congestion | congestion_service | flow_repo (+ Redis cache) |
| Scheduling | schedules, operations | scheduling_service | schedule_repo, ops_repo, ai_client |
| AI prediction | ai, models | prediction_service | ai_client, model_repo, prediction_repo |
| Alerts | alerts | alert_service | alert_repo, audit, realtime |
| Analytics | analytics | analytics_service | mv repos (+ Redis cache) |
| Replay | replay | replay_service | replay_engine, Redis |
| Users | users, me | user_service | profile_repo, audit |

---

## 4. Authentication & authorization flow

1. Frontend authenticates via **Supabase Auth**, receives JWT.
2. Every API call sends `Authorization: Bearer <jwt>`.
3. `core/security.py` **verifies** the JWT (Supabase JWT secret / JWKS, checks `aud`, `exp`), extracts `sub` (user id).
4. Loads `profiles` row → `role`, `assigned_network`; attaches to `request.state`.
5. **Role dependencies:** `require_auth`, `require_operator`, `require_admin` guard routes (Doc 11 role column).
6. **RLS context:** for DB access, the repository sets the Postgres session role/claims so Supabase RLS (Doc 19) applies defense-in-depth (app guard + DB policy).
7. Mutations call `audit.record(actor, action, entity, payload)`.

---

## 5. Service layer & repository pattern

- **Services** are stateless classes/functions receiving a DB session + deps; they orchestrate repositories, cache, and `ai_client`, and emit realtime/audit side-effects.
- **Repositories** wrap SQLAlchemy queries against Doc 08 tables/materialized views; return domain dicts/models, not ORM rows leaking upward.
- **ai_client** is the boundary to `services/ai` (Doc 10) — loads the active model via `model_metadata`, transforms features, returns predictions; abstracts whether inference is in-process or a separate service.

---

## 6. Realtime architecture

- **WebSocket manager** (`app/realtime/`) maintains connections grouped into **rooms** by `assigned_network`/line. Events per Doc 11 §4.
- **Redis pub/sub** is the fan-out bus: replay engine + alert service publish to channels (`crowd`, `alerts`, `schedule`); the WS manager subscribes and pushes to matching rooms → horizontal scale (any API replica can serve any socket).
- **Supabase Realtime** runs in parallel for DB-change events (new `alerts`, `schedule_recommendations`) so the UI updates even without the WS layer.
- **Socket.IO** (PRD) optional wrapper over the same event names on namespace `/live`.

---

## 7. Replay engine architecture

The "real-time" driver (Doc 5 decision = replay).

```
ReplayEngine (background worker in app/replay/)
  state in Redis: { running, speed, clock }
  loop:
    advance clock by (tick_interval * speed)     # e.g. 1 sim-hour per real N sec
    fetch passenger_flow + train_occupancy rows for clock window
    compute crowd/occupancy state → write Redis 'live_state'
    run threshold check → auto-create alerts (Critical / high congestion_prob)
    publish crowd.update / occupancy.update / replay.tick to Redis pubsub
    optionally call prediction_service for next-hour forecast
```

- Controlled via admin endpoints (`/replay/start|pause|seek|status`, Doc 11 §2.7).
- Deterministic: same start + speed → same stream (dataset is fixed-seed).
- Decouples "wall clock" from "sim clock" so demos run fast or paused.

---

## 8. Background jobs

| Job | Trigger | Work |
|---|---|---|
| `refresh_materialized_views` | schedule (nightly / on replay checkpoint) | refresh `mv_*` (Doc 08) |
| `threshold_to_alerts` | on replay tick / new prediction | create alerts when crowd=Critical or congestion_prob≥τ |
| `train_model` | manual/CLI | invoke `services/ai` training, register `model_metadata` |
| `expire_cache` | TTL | Redis housekeeping |
| `cleanup_audit` | schedule | retention policy |

Runner: FastAPI background tasks for light work; a separate worker process (or APScheduler/Celery-lite) for scheduled/long jobs. Kept simple for the project scope.

---

## 9. Cross-cutting concerns

- **Config:** `pydantic-settings` typed object from env (Doc 17).
- **Errors:** central handlers → Doc 11 error envelope + codes; never leak stack traces.
- **Logging:** structured JSON logs w/ `request_id`; log level via env.
- **Rate limiting:** Redis token-bucket middleware.
- **Caching:** Redis for analytics/heatmap (short TTL) + live state.
- **Validation:** Pydantic on every request/response (the contract).
- **OpenAPI:** auto-served (`/api/v1/docs`), used to codegen web types.
- **Health:** `/health` checks DB, Redis, active models.

---

## 10. Scalability & deployment notes
- Stateless API replicas behind a load balancer; sockets fan-out via Redis, so any replica serves any client.
- Models loaded at startup (or lazily) and shared; heavy training runs offline, not in the request path.
- Replay engine runs as a **single** worker (leader) writing shared Redis state; API replicas read it.
- Containerized (Doc 16); scales on AWS/Azure.
