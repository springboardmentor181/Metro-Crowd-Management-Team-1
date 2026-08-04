<div align="center">

# 🚇 MetroFlow

### AI-Powered Metro Crowd Management & Smart Scheduling Platform

*Move the city. Predict the crowd.*

Privacy-preserving AI command center for metro operators — real-time crowd
monitoring, demand forecasting and prescriptive scheduling, built entirely from
ticketing and operational data. **No cameras. No CCTV.**

![status](https://img.shields.io/badge/status-in%20development-0E4B5A)
![frontend](https://img.shields.io/badge/frontend-Next.js%2016-black)
![backend](https://img.shields.io/badge/backend-FastAPI-009688)
![ai](https://img.shields.io/badge/AI-XGBoost%20%7C%20scikit--learn-F26C2E)
![license](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## Overview

MetroFlow helps metro authorities monitor passenger flow, predict crowd density,
analyze station congestion and optimize train scheduling in real time. It is
built for the Indian metro context and scales from a single line to a
700-station multi-network view.

The platform has two halves:

1. **Public website** — introduces the platform and funnels operators to the console.
2. **AI Operations Dashboard** — authenticated command center for admins & operators.

## ✨ Key capabilities

- 📊 **Crowd monitoring** — passenger density & station congestion (Low → Critical), heatmaps, inflow/outflow
- 🔮 **AI prediction** — crowd level, passenger demand and congestion probability, hour-ahead
- 🗓️ **Smart scheduling** — prescriptive train-frequency recommendations with an optimization score
- 🚨 **Alerts** — overcrowding, delay and emergency notifications in real time
- 📈 **Analytics** — traffic analytics, station performance and operational insights
- 🔐 **RBAC** — Admin & Operator roles, network-scoped access

## 🏗️ Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, lucide-react |
| Backend | FastAPI, Python, Pydantic, SQLAlchemy |
| Auth / DB / Realtime / Storage | Supabase |
| Cache & realtime bus | Redis |
| AI / ML | XGBoost, scikit-learn, Pandas, NumPy (TensorFlow optional) |
| DevOps | Docker, Docker Compose, AWS / Azure |

## 📁 Repository structure

```
.
├── metroflow/                 # Application monorepo
│   └── apps/web/              # Next.js frontend (public site + dashboard)
├── MetroFlow_Dataset/         # 571,540-row relational dataset (8 CSVs) + docs
├── MetroFlow_Planning/        # 21 research/architecture/design documents
├── scripts/                   # Deterministic dataset generator + validator
└── README.md
```

## 🚀 Getting started (frontend)

```bash
cd metroflow/apps/web
npm install
cp .env.example .env.local     # runs in demo-auth mode until Supabase keys are added
npm run dev                    # http://localhost:3000
```

> **Demo mode:** with no Supabase keys, any email/password signs you in. An email
> containing `admin` grants the Admin role; anything else is an Operator.

## 📊 Dataset

A large-scale, relational, ML-ready synthetic dataset emulating Indian metro
operations — **571,540 records across 8 CSVs**, 725 stations, 17 networks, a
90-day window, **15/15 data-quality checks passing**, with ML targets
pre-computed. See [`MetroFlow_Dataset/`](MetroFlow_Dataset) and
[`MetroFlow_Planning/03_Dataset_Analysis.md`](MetroFlow_Planning/03_Dataset_Analysis.md).

## 📚 Documentation

All research, architecture and design work lives in
[`MetroFlow_Planning/`](MetroFlow_Planning) — from the research report and
competitor analysis to the database schema, API contract, security policy and
UI specifications.

## 🗺️ Roadmap

- [x] Research, planning & design system (21 documents)
- [x] Frontend: public website + design system
- [x] Frontend: authentication + operations dashboard (8 modules)
- [ ] FastAPI backend + Supabase schema & migrations
- [ ] AI models (crowd / demand / congestion / scheduling)
- [ ] Replay engine + WebSocket live updates
- [ ] Docker + cloud deployment

## 📄 License

[MIT](LICENSE)
