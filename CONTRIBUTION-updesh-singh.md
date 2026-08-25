# Crowd Monitoring & Scheduling — Contribution

**Contributor: Updesh Singh**
Module owner for **Crowd Monitoring** and **Smart Scheduling** in the MetroFlow
AI Metro Crowd Management platform (Team 1).

This branch (`updesh-singh`) contains my work on two of the platform's core
modules. Files preserve the shared `metroflow/apps/...` structure so they drop
straight into the team codebase.

---

## 1. Crowd Monitoring
Passenger-flow and station-congestion tracking from ticketing/operational data —
crowd density levels (Low / Medium / High / Critical), inflow vs. outflow, and a
station × hour congestion heatmap.

**Backend (FastAPI)**
- `metroflow/apps/api/app/api/v1/routes/flow.py` — passenger inflow/outflow & density time series
- `metroflow/apps/api/app/api/v1/routes/congestion.py` — station × hour congestion heatmap

**Frontend (Next.js + TypeScript)**
- `metroflow/apps/web/src/app/(dashboard)/dashboard/crowd/page.tsx` — Crowd Monitoring page
- `metroflow/apps/web/src/components/dashboard/Heatmap.tsx` — congestion heatmap component

## 2. Smart Scheduling
AI-assisted train scheduling — current vs. recommended frequency per line/time-slot,
an optimization score, and apply/dismiss actions with a service-status view.

**Backend (FastAPI)**
- `metroflow/apps/api/app/api/v1/routes/scheduling.py` — schedules, recommendations, apply/dismiss (`/schedules`)

**Frontend (Next.js + TypeScript)**
- `metroflow/apps/web/src/app/(dashboard)/dashboard/scheduling/page.tsx` — Scheduling page
- `metroflow/apps/web/src/components/dashboard/SchedulingRecos.tsx` — recommendation cards

---

## Tech used
FastAPI (Python) · Pydantic · Next.js App Router · TypeScript · Supabase (PostgreSQL) · XGBoost.

> Note: these modules are part of the larger shared MetroFlow codebase and depend on
> shared building blocks (e.g. `PageHeader`, `KpiCard`, `charts`) and lib utilities
> (`lib/live-data.ts`, `lib/api.ts`) that are maintained across the team.

— **Updesh Singh**
