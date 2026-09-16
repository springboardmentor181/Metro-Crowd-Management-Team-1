# MetroFlow API

FastAPI backend — serves the trained crowd/demand models plus stations, flow,
congestion, analytics, scheduling and alerts. Runs in **CSV-backed dev mode**
until Supabase env vars are set (Planning Docs 09, 11).

## Run locally

```bash
cd metroflow/apps/api
python -m venv .venv
.venv/Scripts/activate           # Windows  (source .venv/bin/activate on *nix)
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger): http://localhost:8000/api/v1/docs
- Health: http://localhost:8000/api/v1/health

> Model serving needs the trained artifacts. Generate them once with
> `cd ../../services/ai && python train.py` (creates `services/ai/artifacts/*.joblib`).

## Connect Supabase (when ready)

1. Fill `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_JWT_SECRET` (or `SUPABASE_JWKS_URL`) and `DATABASE_URL`.
2. Run the schema + policies (Supabase SQL editor, or psql):
   ```bash
   psql "$DATABASE_URL" -f migrations/001_schema.sql
   psql "$DATABASE_URL" -f migrations/002_rls.sql
   ```
3. Seed the dataset:
   ```bash
   DATABASE_URL="postgresql://..." python seed/load_csvs.py
   ```
4. Restart the API — `/health` will report `"db": "supabase"` and
   `"auth_enabled": true`, and JWTs from the frontend are verified.

## Docker

From `metroflow/`:

```bash
docker compose up --build
# web  -> http://localhost:3000
# api  -> http://localhost:8000/api/v1/docs
```

## Endpoints (v1)

`/health` · `/stations` · `/stations/{id}` · `/flow` · `/congestion/heatmap` ·
`/ai/predict/crowd` · `/ai/predict/demand` · `/analytics/summary` ·
`/analytics/reports/{report}` · `/schedules` · `/schedules/recommendations` ·
`/alerts`
