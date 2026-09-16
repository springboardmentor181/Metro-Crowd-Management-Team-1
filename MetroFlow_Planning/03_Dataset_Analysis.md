# MetroFlow — Dataset Analysis Report

**Document 3 of 7**
**Dataset location:** `D:\dataset for metro management system\MetroFlow_Dataset`
**Status:** Draft for approval — analysis only, no preprocessing executed yet

---

## 1. Overview

A large-scale, **relational, ML-ready synthetic dataset** emulating the operational data footprint of Indian metro networks — built entirely from ticketing, smart-card, entry/exit, station, train and schedule signals. **No CCTV / computer-vision data** (consistent with the PRD constraint).

| Property | Value |
|---|---|
| Total records | **571,540** |
| Files | **8 CSV** + 2 JSON (summary, analytics) + 1 PDF (methodology) |
| Time window | **2024-10-01 → 2024-12-29** (90 days) |
| Stations (master) | **725** unique · **131** actively monitored |
| Metro networks | **17** · **23** cities · **11** states |
| Reproducibility | Deterministic (fixed seed 42), regenerable via `scripts/` |
| Data quality | **15 / 15 checks pass** (unique PKs, referential integrity, arithmetic & range consistency, no missing key fields) |

**Record counts by file:**

| File | Rows | Grain (one row = ) |
|------|-----:|--------------------|
| `metro_stations.csv` | 725 | one station (master/dimension) |
| `passenger_flow.csv` | 224,010 | one station × day × hour |
| `metro_ai_training_data.csv` | 224,010 | one station × day × hour (engineered + ML targets) |
| `ticket_transactions.csv` | 65,000 | one passenger journey |
| `train_operations.csv` | 44,333 | one train stop event |
| `train_occupancy.csv` | 10,902 | one train load reading at a station |
| `external_factors.csv` | 2,070 | one city × day (23 × 90) |
| `train_schedule.csv` | 490 | one line × time-slot |

---

## 2. Dataset Structure & Relationships

```
                        metro_stations (725)  ── station master / dimension
                          │  PK: station_id (e.g. DEL001)
        ┌─────────────────┼──────────────────┬──────────────────┬─────────────────┐
        │ FK station_id   │                  │                  │                 │
        ▼                 ▼                  ▼                  ▼                 ▼
 passenger_flow    ticket_transactions  train_operations   train_occupancy   metro_ai_training_data
   (224,010)           (65,000)            (44,333)           (10,902)            (224,010)
        │                                     │                                    │
        │ join on city+date                   │ line_name, time_slot               │ (mirrors passenger_flow grain)
        ▼                                     ▼
 external_factors (2,070) ── city × day    train_schedule (490) ── line × slot
```

- **All FKs validated:** 0 orphans for `passenger_flow`, `ticket_transactions`, `train_operations`, `train_occupancy`, `metro_ai_training_data` → `metro_stations.station_id`.
- **Cross-file consistency by construction:** `external_factors` (weather/holiday/festival/event) is generated per city-day first, then joined into `passenger_flow` and the ML table; fares derive from real haversine distance between entry/exit stations.
- `passenger_flow` and `metro_ai_training_data` share the same grain (station × day × hour) — the ML table is the feature-engineered, target-labeled twin of the raw flow table.

---

## 3. Data Dictionary (per file)

### 3.1 `metro_stations.csv` — Station Master (725)
| Field | Description | Type |
|---|---|---|
| station_id | PK, e.g. `DEL001` | String |
| metro_name | Network, e.g. Delhi Metro | String |
| state | State / UT | String |
| city | City | String |
| station_name | Human name | String |
| station_code | Short code, e.g. `DEL-SAM` | String |
| line_name | Metro line, e.g. Yellow Line | String |
| latitude / longitude | Coordinates (within India bbox, validated) | Float |
| opening_year | Year opened | Integer |
| interchange_station | Yes/No | String (bool) |
| platform_count | Platforms | Integer |
| daily_average_footfall | Baseline footfall | Integer |
| nearby_landmarks | Free text | String |
| station_category | Commercial / Residential / IT Hub / Educational Zone / Railway Connection / Industrial Area / Airport | String (categorical) |

### 3.2 `passenger_flow.csv` — Footfall (224,010)
| Field | Description | Type |
|---|---|---|
| record_id | PK, `PF0000001` | String |
| date | Record date | Date |
| time | Hour slot, `HH:MM` | Time |
| station_id | FK → stations | String |
| entry_count / exit_count | Passengers in / out | Integer |
| total_passengers | entry + exit (validated: 0 mismatches) | Integer |
| peak_hour_flag | 1 = peak | Integer (bool) |
| weekday | Day name | String |
| holiday_flag | 1 = holiday | Integer (bool) |
| weather_condition | Clear / Cloudy / Rain / … | String (categorical) |
| event_near_station | Event name or `None` | String |
| **crowd_density_level** | **Low / Medium / High / Critical** | String (categorical) ← label |

### 3.3 `ticket_transactions.csv` — Journeys (65,000)
| Field | Description | Type |
|---|---|---|
| transaction_id | PK | String |
| station_id | FK → stations | String |
| timestamp | Datetime | Datetime |
| ticket_type | Smart Card / Token / Monthly Pass / QR Ticket | String (categorical) |
| passenger_category | General / Senior Citizen / … | String (categorical) |
| entry_station / exit_station | O-D pair (names) | String |
| travel_duration | Minutes (avg 26.5) | Integer |
| fare_amount | ₹, slab [9,60], avg 30.4 | Integer |
| payment_method | UPI / Cash / NCMC Card / Metro App / Credit-Debit Card | String (categorical) |

### 3.4 `train_operations.csv` — Stop Events (44,333)
| Field | Description | Type |
|---|---|---|
| train_id | Train run id, e.g. `DEL-YE-00001` | String |
| metro_name / line_name | Network / line | String |
| station_id | FK → stations | String |
| arrival_time / departure_time | Actual clock | Time |
| scheduled_time / actual_time | Planned vs realized | Time |
| delay_minutes | Delay (avg 4.28) | Integer |
| train_frequency | Headway (min) | Integer |
| occupancy_percentage | Load % | Integer |
| service_status | Running / Delayed / Cancelled (38,965 / 5,308 / 60) | String (categorical) |

### 3.5 `train_occupancy.csv` — Train Load (10,902)
| Field | Description | Type |
|---|---|---|
| train_id | FK-ish train run | String |
| date / time | When | Date / Time |
| station_id | FK → stations | String |
| coach_capacity | Total capacity | Integer |
| current_passengers | On board | Integer |
| occupancy_percentage | Load %, validated [0,150] | Float |
| crowd_level | Low / Medium / High / Critical | String (categorical) |

### 3.6 `external_factors.csv` — City × Day Context (2,070 = 23 × 90)
| Field | Description | Type |
|---|---|---|
| date | Day | Date |
| city | City | String |
| weather | Condition | String (categorical) |
| temperature | °C | Float |
| rainfall | mm | Float |
| public_holiday | Yes/No | String (bool) |
| festival | Name or None | String |
| major_event | Name or None | String |
| impact_percentage | Demand uplift/drag (festival avg +5.76%) | Float |

### 3.7 `train_schedule.csv` — Line × Slot Schedule (490)
| Field | Description | Type |
|---|---|---|
| schedule_id | PK | String |
| metro_name / line_name | Network / line | String |
| time_slot | e.g. `Weekday 07:00-10:00` | String |
| current_frequency | Current headway (min) | Integer |
| **recommended_frequency** | AI/optimizer target headway | Integer ← target |
| passenger_demand | Demand index | Float |
| delay_probability | 0–1 | Float |
| **optimization_score** | Quality of recommendation | Float ← confidence |

### 3.8 `metro_ai_training_data.csv` — ML Table (224,010) ⭐
The primary training table — engineered features + ready-made targets.

| Field | Role | Description | Type |
|---|---|---|---|
| station_id | key | FK → stations | String |
| date / hour | key | Timestamp parts | Date / Int |
| day_of_week | feature | Day name | String (categorical) |
| previous_hour_passengers | feature | Lag-1 hour total | Integer |
| previous_day_average | feature | Lag daily mean | Float |
| weather | feature | Condition | String (categorical) |
| holiday | feature | 1 = holiday | Integer (bool) |
| event | feature | Event or None | String |
| train_frequency | feature | Current headway | Integer |
| occupancy | feature | Current load % | Integer |
| **future_crowd_level** | **TARGET** | Next-step crowd class (Low/Medium/High/Critical) | Categorical |
| **future_passenger_count** | **TARGET** | Next-step demand | Integer |
| **recommended_train_frequency** | **TARGET** | Optimizer headway | Integer |
| **congestion_probability** | **TARGET** | Congestion risk 0–1 | Float |

---

## 4. Data Quality Assessment

**All 15 automated checks pass** (`analytics_report.json`):

- **Uniqueness:** `station_id`, `record_id`, `transaction_id` all unique. ✅
- **Referential integrity:** 0 orphan FKs across all 5 fact tables → master. ✅
- **Arithmetic:** `entry + exit == total` (0 mismatches); `external_factors = 23 cities × 90 days` exactly. ✅
- **Ranges:** occupancy % ∈ [0,150]; fares ∈ [9,60]; `crowd_density_level` ∈ allowed set; coordinates within India bbox. ✅
- **Completeness:** `passenger_flow` has **0 rows with missing key fields**. ✅

**Missing values:** none in key fields. `event_near_station` / `festival` / `major_event` use the sentinel `"None"` (not null) — a categorical value, not missing data. This must be treated as a legitimate category during encoding.

**Class imbalance (important for modeling):** `crowd_density_level` distribution is skewed —
`Low 120,658 · Medium 66,091 · High 34,496 · Critical 2,765`. **Critical is ~1.2%** of rows → use class weighting / macro-F1 / stratified splits; do not evaluate on plain accuracy.

**Realism signals (support demoable AI):**
- Bimodal peaks: hour 9 (74.5M) and hour 19 (76.2M).
- Weekday vs weekend flow: 3,997 vs 3,017.
- Festival uplift +5.76% vs normal −0.61%.
- Service status: 88% Running, 12% Delayed, 0.14% Cancelled; avg delay 4.28 min.
- Volume leaders: Delhi (1.7M/day), Mumbai (908K), Bengaluru (749K).

---

## 5. Feature Availability vs Modules

| Module (Doc 5/6) | Powered by | Ready? |
|---|---|---|
| Crowd Monitoring (density, congestion, heatmap) | `passenger_flow`, `train_occupancy`, `metro_stations` | ✅ direct |
| Inflow/Outflow analysis | `passenger_flow.entry_count/exit_count` | ✅ direct |
| Scheduling (frequency, delay, optimization) | `train_schedule`, `train_operations` | ✅ direct |
| AI Prediction (crowd/demand/congestion) | `metro_ai_training_data` (targets included) | ✅ direct, supervised |
| Traffic pattern / O-D / revenue | `ticket_transactions` | ✅ direct |
| Alerts (overcrowding/delay) | derived from crowd_level / delay_minutes / service_status | ✅ rule-derivable |
| Analytics/reports | all + `analytics_report.json` precomputed | ✅ direct |
| Seasonality/weather drivers | `external_factors` | ✅ join-ready |

**Conclusion: 100% of the six dashboard modules are supported by existing data.** No data gaps block the planned scope.

---

## 6. AI Training Feasibility

| Model target | Source column | Task | Feasible now? |
|---|---|---|---|
| Crowd density | `future_crowd_level` | 4-class classification | ✅ (weight Critical) |
| Passenger demand | `future_passenger_count` | Regression / TS | ✅ |
| Congestion risk | `congestion_probability` | Regression (prob) | ✅ |
| Frequency rec. | `recommended_train_frequency` / `recommended_frequency` | Regression / rules | ✅ |
| Delay | `delay_minutes`, `delay_probability` | Regression / classification | ✅ |

Targets ship pre-computed → **supervised training can begin immediately in Milestone 2**; no labeling phase required.

---

## 7. Required Preprocessing (to execute post-approval)

1. **Type parsing** — cast `date`/`time`/`timestamp` to datetime; split `hour`, `day_of_week`, `is_weekend`, `is_peak` (some already present).
2. **Categorical encoding** — one-hot / ordinal for `weather`, `station_category`, `line_name`, `ticket_type`, `payment_method`; treat `"None"` as its own category for `event`/`festival`.
3. **Ordinal target** — map `crowd_level` Low<Medium<High<Critical (ordered) for classification + optional ordinal metrics.
4. **Joins** — enrich the ML table with `station_category`, `city`, `state` (from master) and `external_factors` (by city+date) as needed.
5. **Class imbalance** — class weights or SMOTE for `Critical`; stratified, **time-based** train/test split (earlier weeks → train, later → test) to prevent leakage from lag features.
6. **Scaling** — standardize numeric features for any linear/LSTM model (trees don't need it).
7. **Leakage guard** — never feed a `future_*` target as a feature; keep lag features strictly causal.
8. **Serving artifacts** — persist fitted encoders + model to disk for FastAPI inference; version them.

---

## 8. Assets Already in the Repo (reusable)
- `MetroFlow_Dashboard.html` — a self-contained analytics dashboard prototype (reference for what's been explored; **not** the target design — Doc 6 governs the real UI).
- `scripts/` — deterministic generator + validator + doc builder (lets us regenerate or extend data, and replay it as a simulated realtime feed — see Doc 5 §realtime).
- `documentation.pdf` — full methodology & feature dictionary (source of truth alongside this doc).

---

## 9. Risks & Notes
- **Synthetic data:** patterns are realistic but generated; models will demo well but real-world accuracy claims must be framed as "on the MetroFlow dataset."
- **Historical window:** data ends 2024-12-29 → "real-time" must be a **replay** of the dataset on a simulated clock (recommended) or a synthetic live generator (decision flagged in Doc 1 §5 and Doc 5).
- **Critical-class rarity:** the most operationally important class is the rarest — weight it and report per-class recall, not just accuracy.
