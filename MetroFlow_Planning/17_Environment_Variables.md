# MetroFlow — Environment Variables Specification

**Document 17** · Phase 1 Architecture
**Status:** Design artifact. Secrets are placeholders — **never commit real values**; use `.env` (gitignored) + platform secret stores. Ship `.env.example` with keys only.

Legend: 🔓 public/exposed (safe in browser) · 🔒 secret (server only) · scope = which service reads it.

---

## 1. `apps/web` (Next.js) — `.env.local`
| Var | 🔓/🔒 | Example | Purpose |
|---|:--:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 🔓 | `https://xxxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔓 | `eyJhbGci...` | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_API_BASE_URL` | 🔓 | `http://localhost:8000/api/v1` | FastAPI base |
| `NEXT_PUBLIC_WS_URL` | 🔓 | `ws://localhost:8000/ws/live` | realtime socket |
| `NEXT_PUBLIC_SITE_URL` | 🔓 | `http://localhost:3000` | canonical site (OG, auth redirects) |
| `NEXT_PUBLIC_ENV` | 🔓 | `development` | env banner/flags |

> Only `NEXT_PUBLIC_*` reach the browser. The **service role key is never** placed in the web app.

---

## 2. `apps/api` (FastAPI) — `.env`
| Var | 🔓/🔒 | Example | Purpose |
|---|:--:|---|---|
| `APP_ENV` | 🔒 | `development` | env |
| `API_V1_PREFIX` | 🔒 | `/api/v1` | route prefix |
| `CORS_ORIGINS` | 🔒 | `http://localhost:3000` | allowed origins (csv) |
| `SUPABASE_URL` | 🔒 | `https://xxxx.supabase.co` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 | `eyJhbGci...` | privileged server ops (bypasses RLS — guard carefully) |
| `SUPABASE_JWT_SECRET` | 🔒 | `super-secret` | verify incoming JWTs |
| `SUPABASE_JWT_AUD` | 🔒 | `authenticated` | expected audience |
| `DATABASE_URL` | 🔒 | `postgresql+psycopg://...:5432/postgres` | SQLAlchemy (Supabase Postgres) |
| `REDIS_URL` | 🔒 | `redis://localhost:6379/0` | cache/pubsub/rate-limit |
| `MODEL_DIR` | 🔒 | `/app/artifacts` | model artifacts path |
| `MODEL_STORAGE_BUCKET` | 🔒 | `models` | Supabase Storage bucket for artifacts |
| `REPLAY_DEFAULT_SPEED` | 🔒 | `3600` | sim-seconds per real-second |
| `REPLAY_START_AT` | 🔒 | `2024-10-01T05:00:00Z` | replay clock origin |
| `REPLAY_TICK_SECONDS` | 🔒 | `2` | real seconds per tick |
| `CROWD_CRITICAL_THRESHOLD` | 🔒 | `0.75` | congestion_prob → alert |
| `RATE_LIMIT_PER_MIN` | 🔒 | `120` | throttle |
| `LOG_LEVEL` | 🔒 | `INFO` | logging |
| `JWT_LEEWAY_SECONDS` | 🔒 | `30` | clock skew tolerance |

---

## 3. `services/ai` — `.env`
| Var | 🔓/🔒 | Example | Purpose |
|---|:--:|---|---|
| `DATA_DIR` | 🔒 | `/data/MetroFlow_Dataset` | dataset location |
| `TRAINING_TABLE` | 🔒 | `metro_ai_training_data.csv` | training source |
| `ARTIFACT_DIR` | 🔒 | `/app/artifacts` | output models/encoders |
| `RANDOM_SEED` | 🔒 | `42` | reproducibility |
| `TEST_SPLIT_FROM` | 🔒 | `2024-12-15` | time-based split boundary |
| `DATABASE_URL` | 🔒 | (as api) | register `model_metadata` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | 🔒 | … | upload artifacts to Storage |

---

## 4. Infra / deploy
| Var | Purpose |
|---|---|
| `POSTGRES_*` (local compose) | local Postgres if not using hosted Supabase in dev |
| `REDIS_PASSWORD` | prod Redis auth |
| `SENTRY_DSN` (opt) | error monitoring |
| `AWS_*` / `AZURE_*` | deploy credentials (CI/secret store only) |
| `DOCKER_REGISTRY` | image registry |

---

## 5. Handling rules
- `.env.example` committed with **keys + dummy values only**; real `.env*` gitignored.
- Secrets in **platform secret managers** (GitHub Actions secrets, AWS SM / Azure Key Vault) for CI/prod.
- **Service role key** used only in trusted server code paths; most DB access goes through user-JWT + RLS.
- Each service validates required env at startup (typed settings) and fails fast if missing.
- Rotate keys on exposure; never log secret values.
