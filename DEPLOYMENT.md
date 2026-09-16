# MetroFlow — Deployment Guide

Deploy the **API on Render** and the **web app on Vercel**. Supabase is already
cloud-hosted. No secrets live in this file — copy the real values from your local
gitignored `.env` files (`metroflow/apps/api/.env`, `metroflow/apps/web/.env.local`).

```
  Browser ──► Vercel (Next.js: pages + /api/proxy + /api/token)
                 │  server-side, attaches Supabase token
                 ▼
              Render (FastAPI: REST + /ws/live)  ──►  Supabase Postgres
                 │                                     (auth + data)
                 └──► Groq (LLM chatbot)
```

---

## 1) Backend → Render

**Option A — Blueprint (easiest):**
1. Render Dashboard → **New → Blueprint** → connect this GitHub repo. Render reads
   [`render.yaml`](render.yaml) and creates the `metroflow-api` web service.
2. Fill the secret env vars it prompts for (values from `metroflow/apps/api/.env`):

| Env var | Value |
|---|---|
| `SUPABASE_URL` | `https://uqxspidvtqncqwuriuts.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(service_role key from your .env)* |
| `SUPABASE_JWKS_URL` | `https://uqxspidvtqncqwuriuts.supabase.co/auth/v1/.well-known/jwks.json` |
| `DATABASE_URL` | **Session Pooler** URI — see ⚠️ below |
| `GROQ_API_KEY` | *(your Groq key)* |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://metroflow.vercel.app` |

**Option B — Manual:** New → **Web Service** → this repo →
Root Directory `metroflow/apps/api`, Runtime **Python 3.11**,
Build `pip install -r requirements.txt`,
Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
Health check `/api/v1/health`, then add the env vars above.

> ⚠️ **DATABASE_URL on Render:** use the **Session Pooler** connection string
> (Supabase → Settings → Database → Connection string → **Session pooler**), which
> is **IPv4**. The direct `db.<ref>.supabase.co` host is IPv6-only and Render
> can't reach it. It looks like:
> `postgresql://postgres.uqxspidvtqncqwuriuts:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`
> URL-encode `@` in the password as `%40`. Append `?sslmode=require`.

After it deploys you'll get an API URL like `https://metroflow-api.onrender.com`.
Verify: open `https://metroflow-api.onrender.com/api/v1/health` → should return `{"status":"ok", ...}`.

---

## 2) Frontend → Vercel

1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory:** `metroflow/apps/web` (Framework auto-detects **Next.js**).
3. Add Environment Variables (values from `metroflow/apps/web/.env.local`, plus the Render URL):

| Env var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uqxspidvtqncqwuriuts.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(anon key from your .env.local)* |
| `NEXT_PUBLIC_API_BASE_URL` | `https://metroflow-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://metroflow-api.onrender.com/ws/live` |

4. **Deploy.** You'll get a URL like `https://metroflow.vercel.app`.

---

## 3) Wire the two together

1. Back on **Render**, set `CORS_ORIGINS` to your Vercel URL (e.g.
   `https://metroflow.vercel.app`) and save → it redeploys.
2. In **Supabase → Authentication → URL Configuration**, add your Vercel URL to
   **Site URL** / **Redirect URLs** (for password-reset links).

---

## 4) Post-deploy checklist

- [ ] `GET /api/v1/health` on the Render URL returns `db: supabase`, `model_loaded: true`
- [ ] Vercel site loads; **/login** works with `admin@metroflow.app` / `Metro@12345`
- [ ] Dashboard KPIs, charts, stations (all 725) load
- [ ] Passenger chart 1H/1D/1W/1M switches data
- [ ] Alerts: acknowledge + emergency broadcast (admin)
- [ ] Scheduling: apply a recommendation
- [ ] Prediction: change station/hour (live model)
- [ ] MetroBot chatbot answers a data question
- [ ] Topbar shows the pulsing **Live** pill (WebSocket)

---

## Notes & gotchas

- **Render free tier sleeps** after ~15 min idle and cold-starts in ~50s — the first
  request after idle may be slow or time out. For always-on, use Render's paid
  instance ($7/mo) or ping `/api/v1/health` on a schedule (e.g. a cron/UptimeRobot).
- **Memory:** the API lazily loads the passenger-flow CSV; the free 512 MB tier is
  usually fine but can spike under heavy analytics. Upgrade the instance if needed.
- **Model:** the trained artifacts are committed under
  `metroflow/services/ai/artifacts/`, so predictions work without retraining.
- **Secrets:** rotate the Supabase service_role key, DB password and Groq key
  periodically — set the new values in Render/Vercel env, not in the repo.
