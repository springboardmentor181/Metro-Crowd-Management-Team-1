# MetroFlow

AI-Powered Metro Crowd Management & Smart Scheduling Platform.
Monorepo. Planning docs live in `../MetroFlow_Planning/`.

## Structure
```
metroflow/
├── apps/
│   └── web/          # Next.js 16 + TypeScript + Tailwind v4 (public site + auth + dashboard)
├── apps/api/         # FastAPI backend            (next milestone)
├── services/ai/      # XGBoost/RF training + inference (next milestone)
└── infra/            # Docker, compose, deploy    (next milestone)
```

## Run the web app
```bash
cd apps/web
npm install
cp .env.example .env.local     # demo mode by default (no backend needed)
npm run dev                    # http://localhost:3000
```

### Demo auth
Supabase isn't wired yet, so the app runs in **demo mode**: on `/login`, any
email/password works and you pick a role (Operator / Admin). Emails containing
"admin" default to the Admin role. Add Supabase keys to `.env.local` to switch
to real authentication.

- Public website: `/`, `/features`, `/ai`, `/contact`
- Auth: `/login`, `/signup`, `/reset`
- Dashboard (protected): `/dashboard` → Overview, Crowd, Scheduling, AI
  Prediction, Alerts, Analytics, Users (admin), Settings

## Status
- ✅ **Milestone 1 (frontend):** design system, public website (real assets),
  auth + route guards, dashboard shell + all 8 module screens. Build green,
  e2e smoke test passing.
- ⏳ **Next:** FastAPI backend + Supabase schema (Doc 08), AI model training
  (Doc 10), replay engine + WebSocket live data, Docker.

Data shown in the dashboard is currently derived from the real dataset's
`analytics_report.json`; it will be replaced by live FastAPI responses (Doc 11)
once the backend is running.

## Tech
Next.js · TypeScript · Tailwind v4 · Framer Motion · Recharts · lucide-react ·
Supabase (auth/db/realtime/storage) · next-themes.
```
