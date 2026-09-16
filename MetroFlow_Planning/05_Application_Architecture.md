# MetroFlow — Application Architecture

**Document 5 of 7**
**Status:** Draft for approval — architecture only, nothing built, no tables created

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  MetroFlow                                                                 │
│                                                                            │
│  ┌───────────────────────┐        ┌──────────────────────────────────┐    │
│  │ PART 1 — Public Website│  ───▶  │ Authentication (Supabase Auth)   │    │
│  │ Next.js marketing site │        │  login / signup / roles / JWT    │    │
│  └───────────────────────┘        └───────────────┬──────────────────┘    │
│                                                    │ authorized session    │
│                                                    ▼                        │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ PART 2 — AI Operations Dashboard (Next.js, role-scoped)           │     │
│  │  Crowd Monitoring · Scheduling · AI Prediction · Alerts · Analytics│    │
│  └──────────┬───────────────────────────────────────────┬───────────┘     │
│             │ CRUD / realtime / auth / storage            │ AI + heavy      │
│             ▼                                             ▼ analytics       │
│  ┌────────────────────────────┐            ┌──────────────────────────────┐│
│  │ Supabase                   │            │ FastAPI (Python) Services     ││
│  │  • Auth (JWT, RLS)         │◀── reads ──│  • AI inference (XGBoost/RF)  ││
│  │  • PostgreSQL (data spine) │            │  • Forecasting / scheduling   ││
│  │  • Realtime (subscriptions)│            │  • Analytics aggregation      ││
│  │  • Storage (assets/exports)│            │  • Realtime replay engine     ││
│  └──────────┬─────────────────┘            └───────────────┬──────────────┘│
│             │                                              │                │
│             ▼                                              ▼                │
│  ┌────────────────────────────┐            ┌──────────────────────────────┐│
│  │ Redis (cache, live state,  │            │ ML artifacts (models +        ││
│  │  pub/sub, rate-limit)      │            │  fitted encoders, versioned)  ││
│  └────────────────────────────┘            └──────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Responsibility split (approval decision) ⭐
The PRD lists **both** Supabase (auth/db/realtime/storage) **and** FastAPI + AI stack. **Recommended hybrid:**

- **Supabase** owns: authentication, the PostgreSQL data spine, Row-Level Security, Realtime subscriptions (live crowd/alerts to the UI), and Storage (avatars, report exports, asset library).
- **FastAPI** owns: **all AI/ML** (model serving, forecasting, scheduling optimization), heavy analytical aggregations, and the **realtime replay engine** that streams the historical dataset on a simulated clock.
- **Frontend** talks to **Supabase directly** for auth, realtime, and simple CRUD; and to **FastAPI** for predictions and analytics.

*Alternative:* pure-Supabase BaaS (Edge Functions instead of FastAPI). **Rejected** because the PRD mandates FastAPI + Python ML (TensorFlow/Scikit-learn) which belong in a Python service. → Confirm split at approval.

---

## 2. Module → Feature → Data Map

| Module | Key features | Backed by (Doc 3) | AI |
|---|---|---|---|
| **1. User Management** | Login, signup, RBAC (Admin/Operator), profile | Supabase Auth + `profiles` | — |
| **2. Crowd Monitoring** | Density, station congestion, heatmaps, inflow/outflow | `passenger_flow`, `train_occupancy`, `metro_stations` | crowd classifier |
| **3. Scheduling** | Schedules, frequency optimization, delay mgmt | `train_schedule`, `train_operations` | freq recommender, delay model |
| **4. AI Prediction** | Crowd prediction, demand forecast, traffic analysis, recommendations | `metro_ai_training_data` | XGBoost/RF/LSTM(opt) |
| **5. Alerts** | Overcrowding, delay, emergency, realtime updates | derived + Realtime | thresholds on predictions |
| **6. Analytics** | Reports, performance metrics, operational insights | all + precomputed `analytics_report.json` | — |

---

## 3. Proposed Logical Data Model (PostgreSQL / Supabase)

> **Not created.** This is a proposed logical schema for approval. Tables mirror the 8 CSVs plus app-specific tables. DDL/migrations execute only after approval.

**Reference (from dataset):**
- `metro_stations` (PK `station_id`) — station master.
- `passenger_flow` (PK `record_id`, FK `station_id`).
- `ticket_transactions` (PK `transaction_id`, FK `station_id`).
- `train_operations` (FK `station_id`).
- `train_occupancy` (FK `station_id`).
- `external_factors` (PK `city`+`date`).
- `train_schedule` (PK `schedule_id`).
- `metro_ai_training_data` (FK `station_id`) — for offline training; not necessarily hot in the app DB.

**Application tables (new):**
- `profiles` — `id` (→ auth.users), `full_name`, `role` (`admin`|`operator`), `avatar_url`, `assigned_network`, `created_at`.
- `alerts` — `id`, `type` (overcrowding|delay|emergency), `severity` (low..critical|emergency), `station_id`, `line_name`, `message`, `status` (open|ack|resolved), `acknowledged_by`, `created_at`.
- `predictions` — `id`, `station_id`, `target_hour`, `crowd_level`, `passenger_count`, `congestion_probability`, `model_version`, `confidence`, `created_at` (cache of model outputs).
- `schedule_recommendations` — `id`, `line_name`, `time_slot`, `current_frequency`, `recommended_frequency`, `optimization_score`, `status` (proposed|applied|dismissed), `decided_by`.
- `audit_log` — `id`, `actor`, `action`, `entity`, `payload`, `created_at` (government-grade traceability).

**Indexing plan:** btree on all FKs; composite `(station_id, date, time)` on `passenger_flow`; `(station_id, target_hour)` on `predictions`; partial index on `alerts(status) where status='open'`.

**Security:** Supabase **Row-Level Security** — operators read monitoring/alerts for their `assigned_network`; admins full access; writes to config/schedule gated to admin. All mutations write `audit_log`.

---

## 4. AI/ML Pipeline

```
Offline (training, Milestone 2)                 Online (serving)
─────────────────────────────────              ─────────────────────────────
metro_ai_training_data.csv                     request (station, hour, context)
   │ preprocess (Doc 3 §7)                          │
   │ time-based split                               ▼
   ▼                                          FastAPI /predict
train XGBoost + RandomForest                       │ load versioned model + encoders
   ├─ crowd classifier (4-class, weighted)          │ transform features
   ├─ demand regressor (future_passenger_count)     ▼
   ├─ congestion regressor (probability)       {crowd_level, passenger_count,
   └─ frequency recommender                     congestion_prob, confidence}
   │ evaluate (macro-F1 / MAE / AUC)                │ cache in Redis + predictions table
   ▼                                                ▼
persist model artifacts + encoders (versioned) → Realtime push if threshold → alerts
   │ (optional) LSTM/Prophet depth
```

- **Serving:** models loaded once at FastAPI startup; inference behind `/api/ai/*`.
- **Thresholding:** predicted `Critical`/high `congestion_probability` auto-creates an `alert` and pushes via Realtime.
- **Versioning:** every model artifact tagged `model_version`; predictions store which version produced them (auditability).

---

## 5. Realtime Strategy (approval decision) ⭐

The dataset is historical (ends 2024-12-29). Two options for "real-time monitoring":

1. **Replay engine (recommended)** — a FastAPI worker streams `passenger_flow`/`train_occupancy` on a **simulated clock** (configurable speed), writing "current" state to Redis + Supabase, which pushes to the UI via Supabase Realtime. Deterministic, demoable, grader-friendly.
2. **Synthetic live generator** — reuse `scripts/generate_metroflow.py` to emit fresh rows continuously. More "live," less reproducible.

**Transport to UI:** Supabase Realtime (Postgres change subscriptions) for alerts/state; optional Socket.IO channel from FastAPI for high-frequency streams (PRD lists Socket.IO). Redis pub/sub bridges FastAPI → clients.

---

## 6. Tech Stack (confirmed from PRD)

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS + Framer Motion + Recharts + a map lib + Socket.IO client |
| Auth | Supabase Auth (JWT) |
| Backend (AI/analytics) | FastAPI + Python + Pydantic + SQLAlchemy + WebSockets |
| Data spine | Supabase PostgreSQL |
| Realtime | Supabase Realtime (+ optional Socket.IO/Redis pub-sub) |
| Cache / live state | Redis |
| Storage | Supabase Storage |
| ML | Scikit-learn + XGBoost (primary), Pandas, NumPy; TensorFlow (optional LSTM) |
| DevOps | Docker + Docker Compose; deploy AWS/Azure; Postman for API testing |

**Charting/map library note (decision):** PRD says Recharts. Recharts covers KPI sparklines, bar/area/line, distribution bars. The **congestion heatmap** and **network map** need either Recharts custom cells + a lightweight map (e.g. `react-leaflet` / `maplibre-gl`) or a D3 layer — flagged for a small decision in Doc 6.

---

## 7. API Surface (proposed, high-level — not implemented)

```
Auth (Supabase)         signInWithPassword, signUp, session, RLS
FastAPI
  GET  /api/health
  GET  /api/stations                 list/filter master
  GET  /api/flow?station&from&to     passenger flow series
  GET  /api/occupancy?...            train occupancy
  GET  /api/congestion/heatmap?...   hour×station grid
  POST /api/ai/predict/crowd         crowd level + confidence
  POST /api/ai/predict/demand        demand forecast
  GET  /api/ai/schedule/recommend    frequency recommendations + score
  GET  /api/analytics/summary        KPIs (cached)
  GET  /api/analytics/reports/*      top/bottom footfall, city/line breakdowns
  GET  /api/alerts  POST /api/alerts/:id/ack
  WS   /ws/live                      realtime state stream
```

---

## 8. Deployment Topology

```
docker-compose:
  frontend  (Next.js)        :3000
  api       (FastAPI+ML)     :8000
  redis     (cache/pubsub)   :6379
  replay    (FastAPI worker)         # simulated realtime
  # Supabase = managed (cloud project): Postgres + Auth + Realtime + Storage
Cloud: AWS/Azure (containers), Supabase managed project, CDN for static/site.
```

Environments: local (compose) → staging → production. Secrets via env; model artifacts baked into the `api` image or pulled from Storage at boot.

---

## 9. Non-Functional Targets (from PRD Performance Metrics)
- API response < ~300ms cached / < ~1s for on-demand inference.
- Realtime update latency < ~2s end to end.
- Concurrent operator sessions: design for dozens; Redis-cached hot state.
- Crowd classifier macro-F1 and demand MAPE reported per Doc 1 §3.6.

---

## 10. Architecture Decisions Needing Approval
1. **Supabase + FastAPI hybrid split** (recommended) vs pure Supabase BaaS.
2. **Realtime via replay engine** (recommended) vs synthetic live generator.
3. **Map/heatmap libraries** — Recharts + react-leaflet/maplibre (recommended) vs D3.
4. **Interpretable rules+regression scheduler** (recommended) vs RL optimizer.
5. Which dataset tables are **loaded hot** into Supabase vs kept for **offline training only** (recommend: master + flow + occupancy + ops + schedule + alerts/predictions hot; `metro_ai_training_data` offline).
