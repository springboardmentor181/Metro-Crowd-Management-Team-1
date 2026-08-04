# MetroFlow — AI / ML Architecture

**Document 10** · Phase 1 Architecture
**Status:** Design artifact — **no models trained yet.** Aligns with Doc 1 (research), Doc 3 (dataset), Doc 08 (`model_metadata`, `prediction_history`), Doc 11 (AI endpoints).

---

## 1. Model portfolio

| # | Model | Task | Target (Doc 3) | Algorithm | Serving endpoint |
|---|---|---|---|---|---|
| 1 | `crowd_classifier` | 4-class classification | `future_crowd_level` | XGBoost (primary), RandomForest (baseline) | `POST /ai/predict/crowd` |
| 2 | `demand_regressor` | regression | `future_passenger_count` | XGBoost regressor | `POST /ai/predict/demand` |
| 3 | `congestion_regressor` | probability regression | `congestion_probability` | XGBoost / GBM | `POST /ai/predict/congestion` |
| 4 | `frequency_recommender` | recommendation | `recommended_train_frequency` / `recommended_frequency` | rules + regression | `GET /ai/schedule/recommend` |
| 5 | `delay_model` (opt) | classification/regression | `delay_probability` / `delay_minutes` | GBM | delay analytics |
| 6 | `lstm_forecaster` (optional depth) | seq forecast | `future_passenger_count` | LSTM (TensorFlow) | swaps in for #2 if it wins |

Primary shipping stack = **XGBoost + Scikit-learn**; TensorFlow reserved for the optional LSTM (Doc 1 recommendation).

---

## 2. Pipeline overview

```
                 OFFLINE (training)                              ONLINE (serving)
┌──────────────────────────────────────────┐        ┌────────────────────────────────────┐
│ metro_ai_training_data.csv (224,010)      │        │ POST /ai/predict/*  (station, hour)  │
│  → load.py                                 │        │   → predictor.load(active model)     │
│  → preprocess.py (clean, types, 'None')    │        │   → features.transform(request)      │
│  → features.py (encode, lag, scale)        │        │   → model.predict()                  │
│  → split.py (TIME-BASED split)             │        │   → attach confidence + model meta   │
│  → training/train.py                       │        │   → cache (Redis) + prediction_history│
│      fit XGBoost + RandomForest            │        │   → return {crowd_level, count, prob} │
│  → evaluate.py (macro-F1 / MAE / AUC)      │        └────────────────────────────────────┘
│  → persist artifact + encoders (versioned) │                     ▲
│  → register in model_metadata (is_active)  │─────────────────────┘ active version lookup
└──────────────────────────────────────────┘
```

---

## 3. Preprocessing & feature engineering (Doc 3 §7)

- **Parsing:** datetime split → `hour`, `day_of_week`, `is_weekend`, `is_peak` (some present).
- **Categoricals:** one-hot/ordinal for `weather`, `station_category`, `line_name`, `event`; `'None'` kept as its own category (not null).
- **Lag features:** `previous_hour_passengers`, `previous_day_average` already provided; keep strictly causal (no leakage from `future_*`).
- **Exogenous join:** `external_factors` (weather/holiday/festival/`impact_percentage`) by city+date; `station_category`/city from master.
- **Ordinal target:** `crowd_level` Low<Medium<High<Critical.
- **Scaling:** standardize numerics for linear/LSTM; trees skip.
- **Persistence:** fitted encoders/scalers saved **with** the model artifact (identical transform at inference).

---

## 4. Training pipeline

- **Split:** **time-based** — train on earlier weeks, validate/test on later weeks (never random shuffle; lag features make random splits leak).
- **Imbalance:** `crowd_level` Critical ≈1.2% → class weights / `scale_pos_weight` / optional SMOTE on train only; evaluate on natural distribution.
- **Tuning:** small grid/Optuna on validation fold; early stopping (XGBoost).
- **Reproducibility:** fixed seeds; dataset already seed-42 deterministic.
- **CLI:** `python -m metroflow_ai.training.train --task crowd --algo xgboost` → trains, evaluates, writes artifact, registers `model_metadata`.

---

## 5. Evaluation metrics (Doc 1 §3.6)

| Task | Primary | Secondary | Gate to activate |
|---|---|---|---|
| crowd (4-class) | Macro-F1 | per-class recall (High/Critical), confusion matrix | beats RF baseline & prior version |
| demand | MAE / MAPE | RMSE, R² | MAPE ≤ target |
| congestion | ROC-AUC / PR-AUC | Brier, calibration | AUC ≥ target |
| frequency | agreement w/ optimization_score ranking | simulated delay reduction | non-regression |

Metrics stored in `model_metadata.metrics` (jsonb); shown in the dashboard (D4) and Analytics performance section.

---

## 6. Model versioning & registry

- Every trained artifact → `model_metadata` row: `name, task, version (semver), algorithm, metrics, artifact_path, is_active, trained_at`.
- Artifacts (model + encoders) stored on disk in the AI image or **Supabase Storage**; `artifact_path` points to them.
- **Activation:** `POST /models/{id}/activate` (admin) flips `is_active` for that task; inference always loads the active version.
- **Traceability:** `prediction_history.model_id` records which version produced each prediction (audit/government-grade).
- **Rollback:** re-activate a prior version — no redeploy.

---

## 7. Inference service

- `predictor.py`: loads active model + encoders once (cached); `transform → predict → post-process`.
- **Confidence:** classifier max-proba (or calibrated) for crowd; prediction interval/std for demand; probability itself for congestion. Surfaced as `confidence`, always labeled `estimated: true`.
- **Explainability:** `GET /ai/feature-importance` returns model feature importances (tree) or SHAP summary → D4 "what drives this" chart → operator trust.
- **Batch mode:** replay engine can request next-hour predictions for all monitored stations in a batch to pre-warm the cache + drive threshold alerts.

---

## 8. Scheduling recommendation engine

Interpretable **rules + regression** (Doc 5 decision; auditable, not black-box RL):
1. Predict next-slot demand (model #2) + congestion (model #3) per line×slot.
2. Map (predicted demand, current `train_frequency`, `delay_probability`) → recommended headway via a regression fit to `recommended_frequency` + guardrail rules (min/max headway, fleet limits).
3. Emit `recommended_frequency` + `optimization_score` (confidence) → `schedule_recommendations` (Doc 08) → D3 AI reco cards.
4. Admin Apply/Dismiss → audited; applied recos update the operating schedule view.

---

## 9. Replay integration
- Replay engine (Doc 09 §7) calls the inference service each sim-tick for forecasts and feeds the threshold→alert job.
- Predictions cached in Redis + appended to `prediction_history`; the UI reads live predictions via WS (`crowd.update`) and REST.

---

## 10. Risks & mitigations (AI-specific)
| Risk | Mitigation |
|---|---|
| Synthetic-data optimism | Frame accuracy as "on MetroFlow dataset"; keep honest confidence. |
| Critical-class rarity | Class weighting; report per-class recall, not accuracy. |
| Temporal leakage | Time-based split; causal lag features; leakage guard in `features.py`. |
| Model drift (if live) | Versioned registry + periodic re-train job; metrics tracked. |
| Serving latency | Load-once models, Redis cache, batch pre-warm on replay ticks. |
