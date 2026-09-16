# MetroFlow — Risk & Assumptions Document

**Document 21** · Status: **Design artifact.**

MetroFlow is an AI-driven metro crowd management and scheduling platform. This document catalogs the assumptions the design rests on, the risks that could derail delivery or degrade quality, the hard dependencies that gate development, and the decisions still open at the close of the planning phase. It is intended to be read alongside the research, dataset, architecture, ML, and security documents cross-referenced at the end.

---

## 1. Assumptions

These are the working premises the plan treats as true. Each carries a stated consequence if it turns out to be false, so that a broken assumption is recognized as a design event rather than a surprise.

| ID | Assumption | Impact if false |
|----|-----------|-----------------|
| A1 | The synthetic dataset (fixed seed 42; 571,540 rows across 8 CSVs; 725 stations; 17 Indian metros; Oct–Dec 2024 window ending 2024-12-29) is a faithful proxy for real metro operations, and models trained on it transfer to real-world patterns in shape and direction. | Accuracy and scheduling recommendations may not generalize to live operations; a real-data recalibration phase becomes mandatory before any production claim. |
| A2 | The replay engine on a simulated clock is an acceptable stand-in for live data feeds during development and demonstration. | If stakeholders expect true live ingestion, a real streaming pipeline (feeds, brokers, backpressure) must be built, expanding scope well beyond the 8-week plan. |
| A3 | Supabase managed services (Auth, Postgres, Realtime, Storage) deliver adequate availability, performance, and quota headroom for the project's needs. | Managed-service limits or outages force self-hosting or migration, adding infrastructure and ops burden late in the schedule. |
| A4 | The user provides all required assets (branding, imagery, icons, station/line data artifacts) on schedule, ahead of the milestones that consume them. | Development stalls at the gated points; this is the single largest schedule risk (see R9). |
| A5 | All accuracy and performance claims are framed strictly as measured **"on the MetroFlow dataset"**, not as real-world guarantees. | Overstated claims create credibility and compliance exposure; framing must be corrected across UI, docs, and reports. |
| A6 | A single-region deployment is sufficient for the target audience and demo/evaluation context. | Multi-region latency, residency, or DR requirements would demand re-architecture of hosting and data replication. |
| A7 | User roles are limited to **admin** and **operator**; no finer-grained role hierarchy is required. | Additional roles (auditor, planner, read-only executive) require new RLS policies, UI gating, and test coverage. |
| A8 | External integrations — email, SMS, and public-address (PA) announcements — are **stubbed** interfaces, not live third-party connections. | Real notification delivery requires provider accounts, deliverability handling, rate limits, and compliance work not currently scoped. |
| A9 | The pre-computed ML targets in `metro_ai_training_data` (`future_crowd_level`, `future_passenger_count`, `congestion_probability`, `recommended_train_frequency`) are correctly derived and leakage-free relative to their feature windows. | Model results inherit any target-construction error; retraining and target regeneration become necessary (see R15, R3). |
| A10 | Crowd density estimated from ticketing, occupancy, and flow data (no CCTV/computer vision, by privacy-preserving design) is a sufficient signal for crowd management. | If density estimates prove too coarse for operational decisions, the data-only approach may require additional sensor sources, conflicting with the privacy stance. |
| A11 | The unified **teal + orange** palette is the final, single source of visual truth across all modules. | Any lingering dual-reference palette material causes inconsistency; must be reconciled to the resolved palette (see R12). |
| A12 | XGBoost + Random Forest are adequate as the primary modeling approach, with LSTM/Prophet optional. | If sequence models prove necessary for accuracy, the AI scope and training/serving complexity grow (see Open Decisions). |

---

## 2. Risk Register

Categories: Technical · Data · Schedule · Security · UX · Ops. Likelihood and Impact are rated L/M/H. Owners are role-based.

| ID | Risk | Category | Likelihood | Impact | Mitigation | Owner |
|----|------|----------|:---:|:---:|-----------|-------|
| R1 | **Synthetic-data optimism** — metrics look strong on generated data but overstate real-world performance. | Data | H | H | Frame all claims as "on the MetroFlow dataset" (A5); reserve a real-data calibration phase; report confidence intervals, not point claims; document generative process from seed 42. | ML Lead |
| R2 | **Critical-class imbalance** — the "Critical" crowd class is only ~1.2% of rows (2,765 / 224,010); recall collapses on the most operationally important class. | Data | H | H | Class weighting / focal loss; threshold tuning optimized for Critical recall; SMOTE-style resampling in training only; evaluate with PR-AUC and per-class recall, not accuracy. | ML Lead |
| R3 | **Temporal data leakage** — future-looking targets or shuffled splits leak information, inflating validation scores. | Data | M | H | Strict time-ordered train/val/test splits; verify no target-derived features; audit `metro_ai_training_data` target windows; forward-chaining CV. | ML Lead |
| R4 | **Model latency in the request path** — inference adds unacceptable delay to interactive endpoints. | Technical | M | M | Serve compact XGBoost/RF models; cache predictions in Redis; precompute where possible; async FastAPI; enforce latency budgets in load tests. | Backend Lead |
| R5 | **Replay vs real-live gap** — behavior tuned to the deterministic replay engine misbehaves against real, noisy, out-of-order feeds. | Technical | M | M | Isolate replay behind a feed interface; inject jitter/gaps/late data in replay; document the boundary; keep ingestion swappable. | Backend Lead |
| R6 | **Supabase RLS misconfiguration** — row-level security gaps expose data across tenants/roles. | Security | M | H | Deny-by-default policies; automated RLS test suite per role; peer review of every policy; align with 19_Security_and_RLS_Policy.md. | Security Owner |
| R7 | **JWT / auth vulnerabilities** — token handling, expiry, or role claims mishandled. | Security | M | H | Short-lived tokens with refresh; verify signature and role claims server-side; no secrets in frontend; rotate keys; auth test coverage. | Security Owner |
| R8 | **Realtime scaling / WebSocket fan-out** — many concurrent subscribers overwhelm Realtime channels. | Technical | M | M | Channel scoping and payload minimization; Redis-backed pub/sub throttling; batch/debounce updates; load-test fan-out early. | Backend Lead |
| R9 | **Asset delivery delay** — user-provided assets (P0 blocker) arrive late, blocking gated development. | Schedule | H | H | Placeholder assets and clear asset spec up front; parallelize non-asset work; explicit gating checklist; early reminders against milestones. | Project Lead |
| R10 | **Scope creep across 6 modules** — feature expansion beyond monitoring, scheduling, AI, alerts, analytics, admin. | Schedule | M | H | Lock module scope to the 8-week plan; change-control for additions; MoSCoW prioritization; defer to backlog. | Project Lead |
| R11 | **Heatmap / map library complexity** — mapping and density-heatmap rendering harder than estimated. | UX | M | M | Prototype the map/heatmap spike in M1; choose proven libs (see Open Decisions); fall back to schematic line view if geo-map slips. | Frontend Lead |
| R12 | **Palette confusion** — dual-reference color material causes inconsistency (resolved to teal + orange). | UX | L | M | Single tokenized palette; design-system enforcement in components; audit legacy references; treat teal+orange as canonical (A11). | Frontend Lead |
| R13 | **Docker / cloud deployment complexity** — containerization and cloud provisioning consume more than the M4 budget. | Ops | M | M | Compose early in M1; infrastructure-as-config; single-region target (A6); rehearse deploy before M4; document runbook. | DevOps Owner |
| R14 | **Performance under concurrent sessions** — degradation with many simultaneous operators/dashboards. | Technical | M | M | Load-test target concurrency; Redis caching; connection pooling; pagination and query indexing; profile hot paths. | Backend Lead |
| R15 | **Over-reliance on precomputed targets** — pipeline depends on `metro_ai_training_data` targets without independent validation. | Data | M | M | Validate targets against raw signals; retain regeneration scripts; spot-check distributions; keep target logic documented and reproducible (seed 42). | ML Lead |
| R16 | **Accessibility / color-only status** — crowd/congestion status conveyed by color alone fails colorblind and low-vision users. | UX | M | M | Pair color with icon/label/text; WCAG AA contrast on teal+orange; test with simulators; non-color redundant encoding for all status. | Frontend Lead |
| R17 | **Data load / migration errors** — the 8-CSV, 571,540-row load into Postgres corrupts or misaligns data despite 15/15 quality checks. | Data | M | M | Idempotent, checksummed loaders; re-run the 15 data-quality checks post-load; foreign-key and row-count assertions; staged migrations. | Backend Lead |
| R18 | **Team / timeline pressure on the 8-week plan** — four milestones (M1 setup/auth/monitoring, M2 scheduling/AI, M3 alerts/analytics, M4 testing/deploy/docs) overrun. | Schedule | M | H | Milestone buffers; weekly burn-down; cut optional scope first (LSTM/Prophet); protect M4 testing/deploy/docs from compression. | Project Lead |

---

## 3. Dependencies

Ordered by how hard they gate progress.

| Dependency | Type | Gates | Notes |
|-----------|------|-------|-------|
| **User-provided assets** | External input | **P0 blocker** — gates all asset-consuming UI work | Branding, imagery, icons, station/line artifacts; development is explicitly gated on delivery (A4, R9). |
| **Supabase project** | Platform | Auth, Postgres, Realtime, Storage across all modules | Must be provisioned before M1 data load and auth work (A3). |
| **Cloud account (AWS/Azure)** | Platform | Deployment, container hosting, Redis, FastAPI services | Needed by M4; single-region target (A6, R13). |
| **The MetroFlow dataset** | Data | All analytics, ML, and replay features | 8 CSVs, 571,540 rows, seed 42; 15/15 quality checks passing is the entry condition (R17). |
| **Model training completion** | Internal artifact | Gates AI-dependent features (predictions, congestion probability, recommended frequency) | AI features cannot ship until XGBoost/RF training and validation complete (M2). |

---

## 4. Risk Heat Summary — Top 5 to Watch

1. **R9 — Asset delivery delay (Schedule, H/H).** The P0 blocker with the widest blast radius; any slip cascades into every gated UI milestone. Watch weekly against the asset spec.
2. **R1 — Synthetic-data optimism (Data, H/H).** The credibility of the entire platform hinges on honest framing; unmanaged, it converts strong demo metrics into unsupportable real-world claims.
3. **R2 — Critical-class imbalance (Data, H/H).** The rarest class (~1.2%) is the one that matters most operationally; naive training will fail exactly where the product must succeed.
4. **R6 — Supabase RLS misconfiguration (Security, M/H).** A single policy gap can expose data across roles; security failures are high-cost and reputationally severe.
5. **R18 — 8-week timeline pressure (Schedule, M/H).** Four tightly-packed milestones with M4 (testing/deploy/docs) most at risk of being compressed — precisely the phase that protects quality.

---

## 5. Open Decisions Still Pending

Two lower-stakes decisions are **defaulted to recommendations** and stand unless the user changes them; minor UI library choices remain to be confirmed during the M1 spike.

- **OD1 — AI model scope.** *Recommendation (default):* XGBoost + Random Forest as primary, with **LSTM / Prophet optional** if sequence modeling proves necessary for accuracy. Kept optional to protect the timeline (ties to A12, R18).
- **OD2 — Scheduler approach.** *Recommendation (default):* an **interpretable rules + regression** scheduler rather than reinforcement learning. Favors transparency, auditability, and delivery certainty over the complexity and data-hunger of RL.
- **OD3 — Map rendering library.** Pending: **react-leaflet / MapLibre** geo-map vs a **schematic** line-diagram view. Decide in the M1 map/heatmap spike (ties to R11).
- **OD4 — Heatmap rendering.** Pending: **Recharts custom cells** for the density heatmap vs an alternative. Decide alongside OD3.

---

## 6. Cross-References

- **01_Research_Report.md** — problem framing, domain context, and the privacy-preserving, data-only rationale (no CCTV/CV).
- **03_Dataset_Analysis.md** — the 8-CSV / 571,540-row synthetic dataset, seed 42, class distribution, and the 15/15 data-quality checks.
- **05_Application_Architecture.md** — hybrid Supabase + FastAPI backend, Next.js frontend, Redis, and the replay engine boundary.
- **10_AI_ML_Architecture.md** — XGBoost/RF (LSTM optional) modeling, precomputed targets, and training/serving design.
- **19_Security_and_RLS_Policy.md** — RLS policies, JWT/auth handling, and the admin/operator role model.
