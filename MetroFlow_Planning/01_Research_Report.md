# MetroFlow — Research Report

**Document 1 of 7** · Smart Transportation & AI Research
**Project:** MetroFlow — AI-Powered Metro Crowd Management & Smart Scheduling Platform
**Prepared by:** Senior Product Architect / AI-ML System Architect / Smart Transportation Consultant
**Status:** Draft for approval — no development started

---

## 1. Executive Summary

MetroFlow is an AI operations platform for metro authorities that turns **ticketing, entry/exit, occupancy, schedule and sensor-adjacent data** into real-time crowd intelligence and scheduling decisions. Critically, and confirmed by the PRD, **the system uses no computer vision, CCTV or image processing** — all crowd estimation is derived from *operational and transactional data*. This is both a constraint and a competitive advantage: it is privacy-preserving, cheaper to deploy, and works from data metro authorities already collect (AFC / Automatic Fare Collection, gate logs, SCADA/train telemetry).

This report establishes the domain understanding, industry patterns, and AI approach that the design and architecture (Docs 4–6) will implement, and is grounded in the actual project dataset (see Doc 3): **571,540 records across 8 relational files, 725 stations, 17 Indian metro networks, a 90-day window (Oct–Dec 2024)**.

---

## 2. Smart Transportation Industry Research

### 2.1 What a metro operations platform actually does

Metro control operates in three loops running at different speeds:

| Loop | Horizon | Question it answers | MetroFlow module |
|------|---------|--------------------|------------------|
| **Real-time monitoring** | seconds–minutes | "What is happening right now?" | Crowd Monitoring, Alerts |
| **Operational tactical** | minutes–hours | "What should we change today?" | Scheduling, AI Prediction |
| **Strategic analytics** | days–seasons | "How do we plan capacity?" | Analytics Dashboard |

A credible operator platform must serve all three from one data spine. MetroFlow's dataset supports each: hourly `passenger_flow` + `train_occupancy` feed the real-time loop; `train_schedule` recommendations feed the tactical loop; 90 days of history feed the strategic loop.

### 2.2 Core capabilities of best-in-class systems

Researched against the operations practice of Delhi Metro (DMRC), Transport for London (TfL), Singapore LTA/SMRT, Tokyo Metro, and New York MTA (detailed comparison in Doc 2). Common capability pillars:

1. **Network state visualization** — a live map/schematic of lines and stations with color-coded load. Every mature operator has a "control room wall."
2. **Passenger flow analytics** — inflow/outflow, origin-destination (O-D) matrices, dwell and interchange load. Driven almost entirely by AFC tap-in/tap-out data.
3. **Crowd / congestion estimation** — density levels per station and per train, usually bucketed (Low/Medium/High/Critical) for fast human reading.
4. **Demand forecasting** — short-horizon (next hour) and profile-based (typical weekday/weekend/festival).
5. **Service & schedule management** — headway (frequency) planning, delay tracking, incident response.
6. **Alerting & passenger information** — overcrowding, delays, emergencies pushed to operators and passenger channels (PA, app, signage).
7. **Reporting** — KPI dashboards for management, regulators, and daily operations review.

### 2.3 Operator dashboard patterns (control-room UX)

Patterns observed and adopted for MetroFlow:

- **KPI strip at the top** — a small number of headline numbers (network load %, active alerts, on-time %, total footfall today) with sparklines/trend deltas. *(Directly mirrored in the SmartHR reference: the 4-card top row.)*
- **Status-color language** — a strict, consistent Low→Critical color ramp everywhere (cards, map, tables, charts) so an operator reads state pre-attentively. *(SmartHR reference uses exactly this in its "Peak Hours" grid.)*
- **Progressive disclosure** — network → line → station → train. One click deeper each time; never bury the operator in raw rows.
- **Heatmaps for time × space** — hour-of-day × station/line grids to spot congestion windows at a glance. *(SmartHR "Integration Error Counts" heatmap is the exact visual pattern we will reuse for congestion.)*
- **Persistent alert rail** — active alerts always visible, ranked by severity, one-click acknowledge.
- **Time-window toggles** — 1H / 1D / 1W / 1M on every chart. *(Present in the reference; adopt verbatim.)*
- **Role-scoped views** — Admin sees everything + config; Operator sees monitoring + alerts, no destructive settings.

### 2.4 Data-visualization best practices adopted

- Bucketed categorical color for load state; sequential single-hue ramps for magnitude heatmaps; never rainbow.
- Always pair a number with a trend (delta vs. previous period).
- Charts are decision tools, not decoration — every chart answers an operator question named in its title.
- Accessibility: color is never the *only* signal (icons + labels accompany status color) — essential for a government-grade, color-blind-safe control system.

### 2.5 UX improvements MetroFlow will introduce

1. **Data-only crowd estimation** surfaced honestly as *estimated* density with a confidence indicator — no false precision, no cameras.
2. **Prescriptive scheduling** — don't just show congestion, recommend a headway change (`recommended_frequency` already exists in the dataset) with an `optimization_score`.
3. **Unified public site → dashboard funnel** — a marketing/explainer website (Part 1) that flows into an authenticated command center (Part 2), so stakeholders and buyers understand the product before login.

---

## 3. AI Transportation Research

### 3.1 Problem framing

MetroFlow's AI reduces to three supervised/forecasting problems, all learnable from the provided `metro_ai_training_data.csv` (engineered features + ready-made targets — see Doc 3):

| # | AI capability | ML task type | Target column(s) in dataset |
|---|---------------|--------------|-----------------------------|
| 1 | **Crowd density prediction** | Multiclass classification | `future_crowd_level` (Low/Medium/High/Critical) |
| 2 | **Passenger demand forecasting** | Regression / time-series | `future_passenger_count` |
| 3 | **Congestion risk scoring** | Regression (probability) | `congestion_probability` (0–1) |
| 4 | **Schedule/frequency optimization** | Recommendation / rule+regression | `recommended_train_frequency`, `recommended_frequency`, `optimization_score` |

The dataset ships the targets pre-computed, which means MetroFlow can train *supervised* models immediately rather than needing to define labels — a major head start.

### 3.2 Crowd prediction — model landscape

Input signals available per station-hour (from `metro_ai_training_data.csv`): `hour`, `day_of_week`, `previous_hour_passengers`, `previous_day_average`, `weather`, `holiday`, `event`, `train_frequency`, `occupancy`.

**Model options analysed:**

| Model | Fit for MetroFlow | Notes |
|-------|-------------------|-------|
| **Random Forest** | ★★★★★ recommended baseline | Robust to mixed numeric/categorical features, no scaling needed, gives feature importance, fast to train on 224K rows, strong for the 4-class crowd label. |
| **XGBoost / Gradient Boosting** | ★★★★★ recommended production | Typically best tabular accuracy; handles class imbalance (Critical is rare — 2,765 / 224K) via `scale_pos_weight`/class weights; exports to a small artifact for FastAPI serving. |
| **Logistic / Linear / Ridge Regression** | ★★★☆☆ | Good interpretable baseline for demand count and probability; underfits nonlinear peak behavior. |
| **LSTM / GRU (RNN)** | ★★★☆☆ optional | Captures true sequential dependency per station; heavier to train/serve. Justified only if per-station sequence models beat trees. The data is already lag-featured (`previous_hour_passengers`, `previous_day_average`), so trees capture most temporal signal without an RNN. |
| **Classical time-series (SARIMA/Prophet)** | ★★★☆☆ optional | Good for per-station daily/weekly seasonality and long-horizon profiles; weaker at incorporating exogenous event/weather features than boosting. |

**Recommendation:** ship **XGBoost (primary) + Random Forest (baseline/fallback)** for crowd classification and demand regression. Treat **LSTM and Prophet as optional "AI depth" enhancements** for Milestone 2, only if evaluation shows tree models leaving accuracy on the table. This matches the PRD tech stack (Scikit-learn, TensorFlow) — Scikit-learn/XGBoost for the shipping models, TensorFlow reserved for the optional LSTM.

### 3.3 Demand & peak-hour forecasting

- **Peak structure is strong and bimodal** in the data — morning peak ~08:00–09:00 (hour 9 = 74.5M passengers) and evening peak ~18:00–19:00 (hour 19 = 76.2M). This is a highly learnable signal.
- **Weekday vs weekend** clearly separable: avg flow 3,997 (weekday) vs 3,017 (weekend).
- **Festival/event uplift** quantified: avg festival impact +5.76% vs normal −0.61%, with `external_factors.impact_percentage` as a direct exogenous regressor.
- **Approach:** hour-ahead regression using lag features + calendar + exogenous factors; plus a "typical profile" model (median by station × hour × day-type) for the strategic view and as a sanity baseline.

### 3.4 Scheduling optimization

The dataset already frames scheduling as a solvable recommendation problem: `train_schedule.csv` contains, per line × time-slot, `current_frequency`, `recommended_frequency`, `passenger_demand`, `delay_probability`, and an `optimization_score`. The ML/optimization layer:

1. **Frequency recommendation** — regress/learn the mapping (predicted demand + current headway + delay probability) → recommended headway. Serve the recommendation with its `optimization_score` as a confidence.
2. **Delay impact prediction** — model `delay_probability` from load, time-slot, weather, and upstream delays (`train_operations.delay_minutes`, avg 4.28 min, 12% of stops "Delayed").
3. **Resource utilization** — surface where added frequency yields the largest congestion reduction (highest marginal `optimization_score`), so operators allocate limited trainsets rationally.

**Approach:** a rules + regression hybrid (interpretable, auditable — important for a government-grade system) rather than a black-box RL scheduler. Operators must be able to see *why* a headway change is recommended.

### 3.5 Traffic pattern analysis

- **O-D and interchange load** from `ticket_transactions` (entry_station → exit_station, travel_duration, fare) — supports flow analysis and revenue analytics.
- **Line congestion ranking** already computed (e.g., Blue/Magenta interchange 22.7% high-or-critical) — feeds a "most congested corridors" analytics view.
- **Seasonality & external drivers** via `external_factors` join (weather, rainfall, holiday, festival, major_event).

### 3.6 Model evaluation plan (to be executed post-approval, in Milestone 2)

| Task | Primary metric | Secondary |
|------|----------------|-----------|
| Crowd level (4-class) | Macro-F1 (handles Critical rarity) | Confusion matrix, per-class recall on High/Critical |
| Demand count | MAE / MAPE | RMSE, R² |
| Congestion probability | ROC-AUC / PR-AUC | Brier score, calibration curve |
| Frequency recommendation | Agreement w/ `optimization_score`-ranked target | Simulated delay reduction |

Validation uses a **time-based split** (train on earlier weeks, test on later weeks) — never random shuffling — to avoid leakage across the temporal sequence.

---

## 4. Key Research Conclusions → Design Implications

| Research finding | Implication for MetroFlow build |
|------------------|---------------------------------|
| Operators read state pre-attentively via color | Enforce one Low→Critical color ramp system-wide (Doc 4). |
| Best control UX = KPI strip + map + heatmap + alert rail | These become the dashboard's fixed anatomy (Doc 6). |
| Dataset ships ML targets pre-computed | Train supervised XGBoost/RF immediately; no labeling phase needed. |
| Peak/weekend/festival signals are strong | Forecasting is feasible and demoable early. |
| No CV/CCTV by design | Market it as privacy-preserving; label crowd as *estimated* with confidence. |
| Scheduling has ready recommendation targets | Ship prescriptive (not just descriptive) scheduling — a differentiator. |

---

## 5. Open Questions for Approval

1. **Model scope for the graded milestones** — is XGBoost + Random Forest sufficient for "AI Prediction functional" (Milestone 2), with LSTM/Prophet as optional stretch? *(Recommended: yes.)*
2. **Live vs. replay realtime** — the dataset is historical (Oct–Dec 2024). Do we drive "real-time" monitoring by **replaying** the dataset on a simulated clock (recommended for demo/grading), or wire a synthetic live generator?
3. **Scope of scheduling optimization** — ship the interpretable rules+regression recommender (recommended) vs. attempt an RL/optimization solver (higher risk, harder to justify).

> These are answered concretely in Doc 5 (Architecture) with a recommendation; listed here so they surface at the approval checkpoint.
