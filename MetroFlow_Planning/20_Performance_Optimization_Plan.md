# MetroFlow — Performance Optimization Plan

**Document 20** · Status: **Design artifact.**

> Scope: This document defines the performance engineering strategy for the MetroFlow AI metro crowd-management and scheduling platform. It is a planning artifact — no implementation. It establishes targets, tactics, and measurement methods across the frontend, backend, database, cache, AI inference, realtime, and scaling layers.

Related documents: [08_Database_Schema.md](./08_Database_Schema.md) · [09_Backend_Architecture.md](./09_Backend_Architecture.md) · [10_AI_ML_Architecture.md](./10_AI_ML_Architecture.md) · [18_Testing_Strategy.md](./18_Testing_Strategy.md)

---

## 1. Context & workload profile

MetroFlow ingests and serves high-volume time-series operational data for a 725-station network. Performance work is dominated by two access patterns: **time-series reads** (passenger flow / occupancy over date+time windows) and **heatmap aggregations** (hour × station / line congestion grids), plus **low-latency realtime fan-out** to operator dashboards during live monitoring and replay.

| Dataset | Rows | Notes |
| --- | --- | --- |
| `passenger_flow` | 224,010 | Primary time-series; heaviest read path |
| `metro_ai_training_data` | 224,010 | Offline feature source; never in request path |
| `ticket_transactions` | 65,000 | Revenue / demand signals |
| `train_operations` | 44,333 | Delay / schedule adherence |
| Stations | 725 | Drives heatmap grid cardinality |

Stack under test: **Next.js** frontend, **FastAPI** backend, **Supabase PostgreSQL**, **Redis** (cache / pub-sub / rate-limit / live-state), **services/ai** (XGBoost / RandomForest models loaded once at startup), **WebSocket `/ws/live`**, and the **replay engine**.

The dataset is modest in absolute terms; the engineering emphasis is therefore on **predictable low latency**, **cache-first serving of aggregates**, and **efficient realtime fan-out** rather than raw big-data scale-out.

---

## 2. Performance targets

| Metric | Target | Measurement method |
| --- | --- | --- |
| API response — cached read | **< 300 ms** p95 | Server timing middleware; k6/locust p95; APM span |
| API response — on-demand inference | **< 1 s** p95 | Endpoint timing on `/predict*`; excludes offline training |
| Realtime end-to-end latency | **< 2 s** event→client render | Timestamp at emit vs. client receive; WS lag gauge |
| Concurrent operator sessions | **Dozens** (design for ≥ 50) | Load test with sustained WS + polling sessions |
| DB query — time-series window | **< 150 ms** p95 | `pg_stat_statements`; EXPLAIN ANALYZE |
| DB query — heatmap aggregate | **Served from cache**; < 250 ms on miss | Cache hit ratio + MV read timing |
| Cache hit ratio (analytics/heatmap) | **> 90%** steady state | Redis `keyspace_hits/misses`; app counters |
| Frontend LCP | **< 2.5 s** | Lighthouse CI + field Web Vitals (RUM) |
| Frontend CLS | **< 0.1** | Lighthouse CI + RUM |
| Frontend INP | **< 200 ms** | Web Vitals field data |
| Crowd / demand / congestion accuracy | Per model SLOs in Doc 10 | Backtest + live scoring dashboards |
| Delay reduction (business KPI) | Tracked vs. baseline | Replay A/B and operational reporting |

Targets are the contract; the sections below are the tactics that satisfy them.

---

## 3. Frontend performance (Next.js)

- **SSR + streaming.** Render dashboard shells server-side and stream (React Server Components / Suspense boundaries) so operators see structure before heavy widgets hydrate. Time-to-first-byte for the monitoring shell should not block on chart data.
- **Per-route code-splitting.** Each route (monitoring, analytics, replay, admin) ships its own bundle. No cross-route JS leakage; shared vendor chunks deduplicated.
- **Lazy-load charts & map.** Charting libraries and the station map are dynamically imported (`next/dynamic`, `ssr: false` where DOM-bound) and mounted only when in viewport / route-active. These are the largest client dependencies and must never sit in the initial critical path.
- **Memoization.** `React.memo`, `useMemo`, `useCallback` on chart-feeding selectors and derived series to prevent re-render storms during high-frequency `crowd.update` streams.
- **Virtualized long tables.** Station lists (725 rows), alert logs, and transaction tables use windowed rendering (e.g. virtualized list) so DOM node count stays bounded regardless of dataset size.
- **Image optimization.** `next/image` for any user-provided assets (station imagery, uploaded maps, operator avatars) — automatic resizing, modern formats, lazy loading.
- **Bundle budget.** Initial route JS budget **≤ 250 KB gzipped**; total per-route interactive payload **≤ 400 KB gzipped**. Enforced in CI (section 10).
- **Web Vitals targets.** LCP **< 2.5 s**, CLS **< 0.1**, INP **< 200 ms**, validated via Lighthouse CI budgets and real-user monitoring.

---

## 4. Backend / API performance (FastAPI)

- **Fully async.** All I/O-bound handlers are `async`; DB and Redis calls use async drivers so a single worker multiplexes many concurrent operator requests without thread starvation.
- **Connection pooling.** SQLAlchemy async engine with a bounded pool (e.g. `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`, sane `pool_recycle`) sized against Supabase connection limits. Pool metrics exported.
- **Pagination caps.** List endpoints enforce a **default page size of 50** and a **hard maximum of 200**; cursor/keyset pagination on time-ordered data to avoid deep-offset scans. No unbounded result sets.
- **Response compression.** gzip/brotli on JSON responses above a size threshold; especially impactful on heatmap grids and time-series arrays.
- **ETag / Cache-Control.** Aggregate and reference endpoints emit `ETag` and `Cache-Control` (short `max-age` + `stale-while-revalidate` semantics) so browsers and any edge layer serve 304s for unchanged rollups.
- **N+1 avoidance.** Data access goes through **repositories** that batch/join explicitly (eager loading, `IN` batching); no per-row lazy fetches in loops. Reviewed against query counts in tests.
- **Rate limiting.** Token-bucket limiter (Redis-backed, section 7) protects inference and heavy-aggregate endpoints; per-session and per-IP buckets with clear `429` + `Retry-After`.

---

## 5. Database performance (Supabase PostgreSQL)

### Indexing
- **Composite `(station_id, date, time)`** on `passenger_flow` and occupancy tables — the canonical access order for time-series windows and per-station lookups.
- **Partial index on `alerts(status) WHERE status = 'open'`** — keeps the hot "open alerts" query scanning a tiny index regardless of historical alert volume.
- **All FKs indexed** to keep joins and referential checks cheap.
- **BRIN on `passenger_flow(date)`** under consideration — for large, naturally date-ordered scans a BRIN index is a low-overhead complement to the composite B-tree; evaluate via EXPLAIN before committing.

### Rollups via materialized views
Aggregates are precomputed, not recomputed per request:
- `mv_station_daily` — per-station daily rollups.
- `mv_line_hourly_congestion` — hour × line congestion grid (the heatmap source).
- `mv_analytics_summary` — dashboard headline metrics.

Refresh policy: **nightly** and **on replay checkpoint** (concurrent refresh to avoid read locks). Cache invalidation is keyed to these refresh events (section 7).

### Query patterns
- **Time-series:** always constrain by `station_id` + a bounded `date`/`time` range so the composite index drives the scan; select only needed columns.
- **Heatmap:** serve from `mv_line_hourly_congestion` / cache; never aggregate 224 K raw rows in the request path.
- **Avoid full scans:** every hot query must be index-supported; flag any sequential scan on `passenger_flow` in review.

### Tuning & loading
- **EXPLAIN-driven tuning.** All hot queries validated with `EXPLAIN (ANALYZE, BUFFERS)`; `pg_stat_statements` surfaces slow queries continuously.
- **Partitioning consideration.** If `passenger_flow` grows materially, range-partition by `date`; BRIN + partition pruning together bound scan cost. Documented as a growth lever, not required at current volume.
- **Bulk load via `COPY`.** Dataset ingestion and replay reloads use `COPY` (not row-by-row `INSERT`) for order-of-magnitude faster loads; indexes rebuilt/analyzed post-load.

---

## 6. Caching strategy (Redis)

Cache-first for all aggregates; Redis is also the live-state store and rate-limit backend.

| Key pattern | Contents | TTL | Invalidation |
| --- | --- | --- | --- |
| `analytics:summary:{scope}` | `mv_analytics_summary` payload | 300 s | On replay checkpoint + MV refresh |
| `heatmap:{line|network}:{date}:{granularity}` | hour × station/line grid | 300 s | On replay checkpoint + MV refresh |
| `stations:list:{network}` | station reference list | 3600 s | On station config change |
| `livestate:{network}` | current occupancy / crowd snapshot | rolling / short (≤ 15 s) | Overwritten each replay tick |
| `ratelimit:{bucket}` | token-bucket counters | window-scoped | Automatic expiry |

- **Invalidation on replay checkpoint.** The replay engine emits a checkpoint event that triggers targeted key deletion (analytics + heatmap namespaces) so operators never see stale aggregates after a checkpoint. Prefer explicit invalidation over long TTL guesswork.
- **Live-state store.** Current network state lives in Redis so any stateless API replica can answer snapshot requests and hydrate new WebSocket connections without hitting Postgres.
- **Token-bucket rate limiting.** Counters in Redis enable consistent limits across all API replicas (shared state), protecting inference and heavy-aggregate paths.

---

## 7. AI inference performance (services/ai)

- **Load once at startup.** XGBoost / RandomForest artifacts are loaded into process memory at boot and reused for the process lifetime — no per-request model deserialization.
- **Feature-transform caching.** Deterministic feature transforms (encoders, scalers, station/line lookups) are cached; repeated station/time contexts reuse computed features rather than recomputing.
- **Batch pre-warm on replay ticks.** On each replay tick, predictions for the active network are computed in **batch** and pushed to cache/live-state, so operator requests hit warm results (< 300 ms cached) instead of triggering cold inference.
- **Training stays offline.** Model training/retraining runs entirely out-of-band (offline jobs over `metro_ai_training_data`); it is **never** in the request path. On-demand inference alone must meet the **< 1 s** target.
- **Lightweight artifacts.** Keep model files compact (pruned trees / bounded depth where accuracy permits) for fast load and small memory footprint per replica.

---

## 8. Realtime performance (`/ws/live`)

- **Redis pub/sub fan-out.** The replay/live worker publishes updates to Redis channels; every stateless API replica subscribes and relays to its connected sockets. This decouples socket ownership from event production — **any replica can serve any socket**, enabling horizontal scale without sticky per-event routing.
- **Room scoping by `assigned_network`.** Sockets join rooms keyed to the operator's `assigned_network`, so each client only receives events for its network — payloads stay small and irrelevant traffic is never serialized or sent.
- **Debounce / throttle high-frequency streams.** `crowd.update` bursts are throttled/coalesced server-side (e.g. one coalesced update per station per ~1 s) so clients receive bounded, render-friendly rates rather than raw tick storms.
- **Message size limits.** Per-message payload caps and delta-only updates (send changes, not full snapshots after the initial hydrate) keep bandwidth and client parse cost low, protecting the **< 2 s** end-to-end target.

---

## 9. Scalability

- **Horizontal stateless API replicas** behind a load balancer. No in-process session or live-state — all shared state lives in Redis and Postgres — so replicas scale out linearly for both HTTP and WebSocket load.
- **Single leader replay worker.** Exactly one replay/live worker is the authoritative event producer (leader-elected / singleton deployment); it publishes to Redis, and all API replicas fan out. This avoids duplicate event streams while keeping read/serve capacity elastic.
- **Redis as shared state.** Cache, pub/sub, live-state, and rate-limit counters are centralized in Redis, which is what makes API replicas interchangeable.
- **Capacity note.** Target design point is **dozens of concurrent operator sessions (≥ 50)**: each session ≈ 1 WebSocket subscription (network-scoped) + intermittent aggregate reads served from cache. At this scale a small replica count (2–3 API instances + 1 replay leader + Redis + Supabase) comfortably meets targets, with headroom to add replicas as sessions grow.

---

## 10. Monitoring & performance budgets

### What to measure
- **Latency:** p50 / p95 per endpoint (cached reads, inference, aggregates).
- **WS lag:** emit→deliver time and per-connection backlog depth.
- **Cache hit ratio:** Redis hits/misses and per-namespace app counters (target > 90% on analytics/heatmap).
- **DB slow queries:** `pg_stat_statements` top-N, sequential-scan alerts on `passenger_flow`, pool saturation.
- **Frontend:** field Web Vitals (LCP/CLS/INP) via RUM plus synthetic Lighthouse runs.

### Tools
- Structured request logs with timing fields; application metrics (counters/histograms/gauges) exported to a metrics backend with dashboards and alerts.
- **Load testing with k6 or locust** — scenarios for sustained concurrent operator sessions (mixed WS + aggregate reads) and inference bursts; run against staging on a schedule and before releases (see [18_Testing_Strategy.md](./18_Testing_Strategy.md)).

### Performance CI budgets
- **Bundle budget** enforced per route (≤ 250 KB initial / ≤ 400 KB interactive, gzipped); build fails on regression.
- **Lighthouse CI** budgets on LCP/CLS/INP block merges that regress Web Vitals.
- **API/DB regression gates:** representative k6 smoke asserting p95 targets; query-count assertions in repository tests to catch N+1 regressions.

---

*Cross-references: [08_Database_Schema.md](./08_Database_Schema.md) (indexes, materialized views, table definitions) · [09_Backend_Architecture.md](./09_Backend_Architecture.md) (async services, repositories, Redis usage) · [10_AI_ML_Architecture.md](./10_AI_ML_Architecture.md) (model artifacts, inference paths, accuracy SLOs) · [18_Testing_Strategy.md](./18_Testing_Strategy.md) (load testing, CI gates).*
