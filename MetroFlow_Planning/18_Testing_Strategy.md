# MetroFlow — Testing Strategy

**Document 18**
**Status:** Design artifact.

---

## 1. Purpose & Scope

This document defines the testing strategy for **MetroFlow**, the AI-driven metro crowd management and scheduling platform. It specifies how each layer of the stack is verified, the tooling per layer, coverage and quality gates, and the CI enforcement model. It is a design artifact — no test code is written here; it establishes the contract that test suites must satisfy.

The strategy is grounded in the system's architecture: a layered FastAPI backend (`routes → services → repositories → db`), a Next.js/TypeScript frontend, an ML subsystem in `services/ai`, Redis + Supabase Postgres for state, and a realtime plane over `/ws/live`. Security is enforced by two independent mechanisms — Postgres RLS and FastAPI guards — and both must be tested (see `19_Security_and_RLS_Policy.md`).

**Related documents:**
- `08_Database_Schema.md` — tables, `metro_ai_training_data`, RLS anchors.
- `09_Backend_Architecture.md` — layering, repository pattern, dependency injection.
- `10_AI_ML_Architecture.md` — model design, features, metrics.
- `11_API_Documentation.md` — REST `/api/v1` contract, error envelope.
- `19_Security_and_RLS_Policy.md` — RBAC, RLS, JWT verification.
- `20_Performance_Optimization_Plan.md` — latency budgets, caching, load targets.

---

## 2. Test Pyramid

MetroFlow follows a classic weighted pyramid: many fast, isolated unit tests; a solid band of integration tests exercising real Postgres/Redis and the API contract; a thin, high-value E2E layer covering critical user journeys; and a cross-cutting specialized band (AI/ML, realtime, non-functional).

```
                 /\
                /E2E\          ~10%   Playwright — critical journeys
               /------\
              /  Integ  \      ~20%   TestClient + test Postgres/Redis
             /------------\
            /     Unit      \  ~60%   Vitest/RTL (FE) + pytest (BE/AI)
           /------------------\
   [ Specialized band — AI/ML metrics, WebSocket, perf, a11y, security ~10% ]
```

**Target proportions (by test count):** Unit ~60% · Integration ~20% · E2E ~10% · Specialized ~10%.

| Layer | Tooling | Runs against | Speed target |
|---|---|---|---|
| Frontend unit/component | Vitest / Jest + React Testing Library | jsdom, mocked fetch/WS | < 5 ms/test |
| Backend unit | pytest | mocked repositories | < 10 ms/test |
| Backend integration | pytest + httpx `TestClient` | seeded test Postgres + Redis | < 200 ms/test |
| AI/ML | pytest | fixed-seed synthetic dataset | deterministic |
| Realtime | pytest + WS client | test app + Redis pub/sub | < 500 ms/test |
| E2E | Playwright | full stack, replay fast mode | < 30 s/journey |

---

## 3. Frontend Unit & Component Tests (Vitest + RTL)

Component tests render in jsdom, query by accessible role/text, and assert on user-visible behavior — never on internal state. Network and WebSocket boundaries are mocked.

**Components**
- `KpiCard` — renders label, value, and trend delta; applies the correct status color **and** icon (color is never the sole signal — see a11y in §9); handles loading/empty/error states.
- `Heatmap` — maps a station×time density matrix to cells; verifies bucket-to-color mapping, tooltip content on hover/focus, and that an empty matrix renders an empty-state rather than throwing.
- `AlertRail` — renders the ordered alert list, surfaces severity via badge + icon, exposes an **Ack** control only when the alert is un-acknowledged, and reflects acked state after the mutation resolves.

**Hooks**
- `useAuth` — parses the Supabase JWT, exposes `{ user, session, isAuthenticated }`, and transitions correctly on token expiry/refresh.
- `useRole` — derives `admin` vs `operator` from claims; drives gating helpers (`canApplySchedule`, `canBroadcast`, `canManageUsers`) that must all be `false` for operators.

**Utilities**
- Token utils — extract/validate JWT claims, detect expiry, guard against malformed tokens.
- Format utils — number/percent formatting for KPIs, timezone-correct time formatting, crowd-level label mapping. Deterministic given fixed inputs.

---

## 4. Backend Unit Tests (pytest)

Unit tests target the **services** layer in isolation. Because the architecture uses the repository pattern (`09_Backend_Architecture.md`), repositories are replaced with mocks/fakes — no database is touched. This keeps unit tests fast and focused on business logic.

**Services (mocked repositories)**
- Alert lifecycle service — ack transitions (`open → acknowledged`), idempotent re-ack, rejection of ack on already-closed alerts, and enrichment logic.
- Scheduling/recommendation service — recommendation generation and the apply path, asserting the apply path is unreachable for operator identities.
- Prediction orchestration service — assembles feature rows, calls the model adapter (mocked), and shapes the response envelope.

**Security primitives**
- JWT verification — valid signature/issuer/audience accepted; expired, tampered, wrong-issuer, and missing tokens rejected with the correct error.
- Role dependencies — FastAPI guards (`require_admin`, `require_role`) allow/deny correctly; the guard denies before any handler side effect executes.

**Schema validation**
- Pydantic request/response models — reject missing/extra/mistyped fields, enforce enum domains (e.g., `crowd_level`), and confirm response models serialize to the documented shape in `11_API_Documentation.md`.

---

## 5. Backend Integration Tests (pytest + TestClient + test Postgres/Redis)

Integration tests wire the full request path (`routes → services → repositories → db`) against an ephemeral, seeded test Postgres and a test Redis. They assert on the HTTP contract and on real database behavior including RLS.

- **Endpoint contract** — every endpoint in `11_API_Documentation.md` is exercised for happy path plus representative failures; response bodies match the documented schema and status codes.
- **RLS behavior** — requests carrying an operator identity see only rows within their `assigned_network`; cross-network reads/writes return empty sets or `403`, proving RLS enforces isolation independently of the FastAPI guard (defense in depth per `19_Security_and_RLS_Policy.md`).
- **Alert ack** — POST ack flips state in the DB, is idempotent, and rejects unauthorized acks; the audit fields (`acked_by`, `acked_at`) are populated.
- **Pagination** — list endpoints honor `limit`/`cursor` (or `offset`), return stable ordering, and expose correct `next`/`total` metadata.
- **Error envelope & codes** — all failures return the canonical error envelope (consistent `code`, `message`, `details`) with the correct HTTP status, matching `11_API_Documentation.md`.

---

## 6. AI/ML Tests (pytest)

The ML subsystem in `services/ai` uses **XGBoost + Random Forest** models trained on targets in `metro_ai_training_data` (`10_AI_ML_Architecture.md`). Determinism is a first-class requirement: a **fixed seed (42)** and a **time-based train/test split** (chronological, no random shuffle) are enforced to keep the dataset reproducible and to avoid temporal leakage.

**Preprocessing & data integrity**
- **Determinism** — running preprocessing twice on seed 42 yields byte-identical feature frames and split boundaries.
- **No leakage** — assert that no `future_*` column (and no post-target-time signal) ever appears in the training feature set; assert the split is chronological, not shuffled.
- **Encoder round-trip** — categorical encoders (station, line, day-part) `transform → inverse_transform` recover the original labels; unseen categories are handled per policy, not by silent failure.

**Model quality gates (per target)**
- **Crowd classification** — Macro-F1 **≥ baseline** and per-class recall reported, with explicit attention to the **Critical** class (~1.2%, imbalanced); the gate fails if Critical recall drops below the agreed floor.
- **Demand** — MAE / MAPE within threshold.
- **Congestion** — ROC-AUC ≥ threshold.
- **Class-imbalance handling** — verify the imbalance strategy (class weights / resampling) is active and that the minority Critical class is not collapsed away; evaluation uses macro/per-class metrics rather than raw accuracy.

**Inference contract**
- The inference interface returns the full documented shape — `crowd_level`, `count`, `prob` (per-class probabilities), and `confidence` — with values in valid domains and probabilities summing to 1.

---

## 7. Realtime / WebSocket Tests

The realtime plane (`/ws/live`) is tested with a programmatic WS client against the test app and Redis pub/sub.

- **Authenticated connect** — connection requires a valid Supabase JWT; unauthenticated or expired tokens are rejected at handshake.
- **Room scoping** — a client is subscribed only to its `assigned_network` room; it must **not** receive events for other networks (mirrors RLS isolation).
- **Event delivery** — clients receive `crowd.update` and `alert.new` payloads with the documented schema and correct routing.
- **Replay tick emission** — with the replay engine driving live updates, each replay tick emits the expected `crowd.update` cadence; fast mode compresses wall-clock time while preserving event ordering and payload correctness.

---

## 8. End-to-End Tests (Playwright)

E2E is deliberately thin and journey-oriented, running the full stack with the replay engine in **fast mode** and a seeded database.

1. **Visitor → login → dashboard** — unauthenticated visitor logs in via Supabase, lands on the dashboard, and sees live KPIs/heatmap populate from replay-driven updates.
2. **Operator acks an alert** — operator opens `AlertRail`, acknowledges an alert, and the acked state persists across reload.
3. **Admin applies a recommendation** — admin reviews a schedule recommendation and applies it; the applied state is reflected in the UI and persisted.
4. **Role-based access denial** — operator is blocked from the Users area (no navigation entry, and direct URL access is denied), confirming end-to-end RBAC.

---

## 9. RBAC & Security Test Matrix

Every row is asserted at **both** the API layer (FastAPI guard) and the data layer (RLS), and — where user-facing — in E2E. Admin has full authority; operators are read/operate-limited and are explicitly barred from applying schedules, broadcasting, and managing users.

| Action | Admin | Operator | Notes |
|---|---|---|---|
| View monitoring (dashboards, live) | Allow | Allow (own `assigned_network`) | Operator scoped by RLS/room |
| Acknowledge alert | Allow | Allow (own network) | Ack lifecycle audited |
| Broadcast emergency | Allow | **Deny** | Operator blocked at guard + UI |
| Apply recommendation / schedule | Allow | **Deny** | Apply path unreachable for operator |
| Manage users | Allow | **Deny** | Users area hidden + direct access 403 |
| Control replay engine | Allow | **Deny** | Replay control is admin-only |

Each **Deny** must be verified to fail closed with the canonical `403` error envelope, and to produce no side effect (no DB write, no broadcast, no state change).

---

## 10. Non-Functional Testing

Targets reference the budgets in `20_Performance_Optimization_Plan.md`.

**Performance / load (locust or k6)**
- Cached REST reads on `/api/v1` meet **< 300 ms** at target concurrency.
- Realtime propagation (event produced → client receives) meets **< 2 s** end to end.
- Load profiles ramp to expected peak-hour concurrency; assert p95 latency and error rate remain within budget; verify Redis-cache hit paths under sustained load.

**Accessibility (axe + manual)**
- Automated axe scan on key pages with zero critical violations.
- Status is conveyed by **color + icon/text**, never color alone.
- Full keyboard navigation and focus order for dashboard, `AlertRail`, and modals; visible focus states.

**Security**
- Authorization — negative tests confirm every restricted action denies for operators (aligned with §9).
- Rate limiting — abusive request volumes are throttled with the correct status/headers.
- Input validation — malformed payloads, injection strings, and oversized inputs are rejected by schema validation before reaching services.

---

## 11. Test Data & Environments

- **Synthetic dataset (seed 42)** — the deterministic, fixed-seed dataset underpins AI tests and seeds the application test DB, guaranteeing reproducible runs.
- **Seeded test Postgres** — provisioned per run with RLS policies applied and known fixtures (users spanning admin/operator across networks, alerts in varied states, prediction inputs).
- **Test Redis** — isolated instance for cache and pub/sub assertions.
- **Replay in fast mode** — the replay engine drives realtime and E2E flows on a compressed clock for deterministic, fast journeys.
- **Isolation** — each integration/E2E run gets a clean, migrated, seeded database; no shared mutable state between tests.

---

## 12. Coverage Targets & CI Gates

**Coverage targets**
- Backend **services ≥ 80%** line/branch coverage; security primitives (JWT verify, role guards) at **100%** of decision branches.
- Frontend — components, hooks, and utils covered; critical components (`KpiCard`, `Heatmap`, `AlertRail`) and auth/role hooks required.
- AI/ML — preprocessing, no-leakage, encoder, and inference-contract tests required; metric gates enforced.

**CI gates**
- **On PR:** unit + integration suites run; lint, type-check, schema validation; coverage thresholds enforced (build fails below target).
- **On main:** full **E2E (Playwright)** critical-path suite must be green.
- **AI metric gates:** crowd **Macro-F1 ≥ baseline** and Critical-class recall floor; demand MAE/MAPE and congestion ROC-AUC within threshold — a regression blocks merge/deploy.
- **Determinism gate:** preprocessing on seed 42 and the time-based split must reproduce identically; any nondeterminism fails the build.

A change merges only when: unit + integration green, coverage at/above target, critical-path E2E green, and all AI metric/determinism gates pass.
