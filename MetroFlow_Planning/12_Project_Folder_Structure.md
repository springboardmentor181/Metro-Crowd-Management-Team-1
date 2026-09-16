# MetroFlow — Project Folder Structure

**Document 12** · Phase 1 Architecture
**Status:** Design artifact — no folders/files created yet.

Monorepo with three deployables (`web`, `api`, `ai`) + `infra` + `data`. Package manager: `pnpm` (web), `uv`/`pip` (python). Root orchestration via Docker Compose.

---

## 1. Top level

```
metroflow/
├── apps/
│   ├── web/                      # Next.js (public site + dashboard)
│   └── api/                      # FastAPI (gateway, CRUD, analytics, realtime, replay)
├── services/
│   └── ai/                       # Python AI/ML (training + inference lib, shared by api)
├── packages/                     # shared TS (optional): ui, types, config
├── infra/                        # docker, compose, deploy, ci
├── data/                         # dataset + loaders (NOT app data at runtime)
├── docs/                         # the MetroFlow_Planning docs live here
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
├── Makefile
└── README.md
```

---

## 2. `apps/web` — Next.js (App Router, TS, Tailwind)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (marketing)/                 # PUBLIC WEBSITE (Part 1)
│   │   │   ├── page.tsx                  # W1 Home
│   │   │   ├── features/page.tsx         # W2
│   │   │   ├── ai/page.tsx               # W3
│   │   │   ├── contact/page.tsx          # W4
│   │   │   └── layout.tsx                # navbar + footer
│   │   ├── (auth)/                       # AUTH (Part 2)
│   │   │   ├── login/page.tsx            # A1
│   │   │   ├── signup/page.tsx           # A2
│   │   │   └── reset/page.tsx            # A3
│   │   ├── (dashboard)/                  # AI DASHBOARD (Part 3)
│   │   │   ├── layout.tsx                # sidebar + topbar shell (D0)
│   │   │   ├── overview/page.tsx         # D1
│   │   │   ├── crowd/page.tsx            # D2 (+ [stationId] drill-in)
│   │   │   ├── scheduling/page.tsx       # D3
│   │   │   ├── prediction/page.tsx       # D4
│   │   │   ├── alerts/page.tsx           # D5
│   │   │   ├── analytics/page.tsx        # D6
│   │   │   ├── users/page.tsx            # D7 (admin)
│   │   │   └── settings/page.tsx         # D8
│   │   ├── layout.tsx                    # root, theme provider
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                           # primitives (Button, Input, Card, Table, Badge…)
│   │   ├── charts/                       # KpiCard, AreaChart, BarChart, Heatmap, DonutGauge…
│   │   ├── dashboard/                    # Sidebar, Topbar, AlertRail, AiRecoCard, PeakHoursGrid
│   │   └── marketing/                    # Hero, FeatureCard, HexNav, StatsBand, Footer
│   ├── lib/
│   │   ├── supabase/                     # browser + server clients, auth helpers
│   │   ├── api/                          # typed fetchers for FastAPI (/api/v1)
│   │   ├── ws/                           # socket/realtime client
│   │   └── design/tokens.ts              # Doc 4 tokens
│   ├── hooks/                            # useAuth, useRole, useLiveState, useHeatmap…
│   ├── types/                            # shared TS types (mirror API schemas)
│   └── middleware.ts                     # route guards (auth + role)
├── public/assets/                        # USER-PROVIDED assets (Doc 7 naming)
├── tailwind.config.ts                    # design tokens wired
├── next.config.mjs
└── package.json
```

---

## 3. `apps/api` — FastAPI

```
apps/api/
├── app/
│   ├── main.py                    # app factory, middleware, router mount
│   ├── core/
│   │   ├── config.py              # pydantic-settings (Doc 17 env)
│   │   ├── security.py            # JWT verify, role deps, RLS context
│   │   ├── logging.py
│   │   └── errors.py              # error envelope + handlers
│   ├── api/v1/
│   │   ├── router.py              # aggregates routers
│   │   └── routes/
│   │       ├── health.py  me.py  stations.py  flow.py  occupancy.py
│   │       ├── congestion.py  schedules.py  operations.py
│   │       ├── ai.py  models.py  alerts.py  notifications.py
│   │       ├── analytics.py  replay.py  users.py
│   ├── schemas/                   # Pydantic request/response models (contract, Doc 11)
│   ├── services/                  # business logic (crowd, scheduling, analytics, alerts)
│   ├── repositories/              # DB access (SQLAlchemy) — repository pattern
│   ├── realtime/                  # ws manager, redis pubsub bridge, socketio (opt)
│   ├── replay/                    # replay engine worker + clock
│   ├── ai_client.py               # calls into services/ai inference
│   ├── db/                        # engine, session, models (SQLAlchemy)
│   └── workers/                   # background jobs (mv refresh, threshold->alerts)
├── migrations/                    # Supabase/Alembic migration SQL (Doc 08)
├── tests/                         # unit + integration (Doc 18)
├── pyproject.toml
└── Dockerfile
```

---

## 4. `services/ai` — ML

```
services/ai/
├── metroflow_ai/
│   ├── data/
│   │   ├── load.py                # read CSVs / db
│   │   ├── preprocess.py          # Doc 3 §7 pipeline
│   │   └── features.py            # feature engineering, encoders
│   ├── models/
│   │   ├── crowd.py               # XGBoost/RF classifier
│   │   ├── demand.py              # regressor
│   │   ├── congestion.py          # probability
│   │   ├── frequency.py           # scheduling recommender
│   │   └── lstm.py                # optional (TensorFlow)
│   ├── training/
│   │   ├── train.py               # CLI: train + evaluate + register
│   │   ├── evaluate.py            # metrics (macro-F1, MAE, AUC)
│   │   └── split.py               # time-based split
│   ├── inference/
│   │   ├── predictor.py           # load artifact + encoders, predict
│   │   └── registry.py            # model_metadata lookup / activation
│   └── config.py
├── artifacts/                     # saved models + encoders (or Supabase Storage)
├── notebooks/                     # EDA (optional)
├── tests/
├── pyproject.toml
└── Dockerfile
```

---

## 5. `infra`, `data`, CI

```
infra/
├── docker/                        # per-service Dockerfiles / base images
├── compose/                       # compose overrides (dev, prod)
├── deploy/                        # AWS/Azure IaC, k8s (opt), nginx
└── ci/                            # GitHub Actions workflows

data/
├── MetroFlow_Dataset/             # the 8 CSVs + json + pdf (existing)
├── loaders/                       # COPY/import scripts -> Supabase
└── scripts/                       # existing generator/validator scripts

.github/workflows/                 # lint, test, build, deploy
```

---

## 6. Conventions
- **API versioning:** all routes under `app/api/v1/`; bump folder for v2.
- **Layering:** route → service → repository → db (no DB calls in routes).
- **Schemas = contract:** `apps/api/app/schemas` mirrors Doc 11; `apps/web/src/types` mirrors it in TS (optionally codegen from OpenAPI).
- **Config:** every service reads env via a typed settings object (Doc 17); nothing hardcoded.
- **Tests colocated** per service under `tests/` (Doc 18).
- **Assets:** only under `apps/web/public/assets`, named per Doc 7.
