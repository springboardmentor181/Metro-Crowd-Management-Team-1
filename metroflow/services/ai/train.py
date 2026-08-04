"""
MetroFlow — crowd & demand model training (Planning Doc 10).

Trains, on the real 224k-row metro_ai_training_data.csv:
  1. Crowd-level classifier (4-class: Low/Medium/High/Critical) — XGBoost + RandomForest
  2. Passenger-demand regressor (future_passenger_count) — XGBoost

Uses a strict TIME-BASED split (no leakage from lag features), class weighting
for the rare Critical class, and reports macro-F1 / per-class recall / MAE / MAPE.

Outputs:
  artifacts/crowd_model.joblib, demand_model.joblib, encoders.joblib
  artifacts/model_metrics.json                 (metrics + feature importance)
  ../../apps/web/src/lib/model-metrics.json     (copy consumed by the dashboard)
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    r2_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor
import joblib

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]  # metroflow/
DATA = ROOT.parent / "MetroFlow_Dataset" / "metro_ai_training_data.csv"
ART = HERE / "artifacts"
ART.mkdir(exist_ok=True)
WEB_OUT = ROOT / "apps" / "web" / "src" / "lib" / "model-metrics.json"

LEVELS = ["Low", "Medium", "High", "Critical"]
CAT_COLS = ["day_of_week", "weather", "event"]
NUM_COLS = [
    "hour",
    "previous_hour_passengers",
    "previous_day_average",
    "holiday",
    "train_frequency",
    "occupancy",
]
SPLIT_DATE = "2024-12-15"  # earlier weeks -> train, later -> test


def main() -> None:
    print(f"Loading {DATA} …")
    df = pd.read_csv(DATA)
    df["date"] = pd.to_datetime(df["date"])
    df["holiday"] = df["holiday"].astype(int)

    # ---- encode categoricals (persist encoders for inference) ----
    encoders: dict[str, LabelEncoder] = {}
    for col in CAT_COLS:
        le = LabelEncoder()
        df[col + "_e"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    feat_cols = NUM_COLS + [c + "_e" for c in CAT_COLS]

    # ---- time-based split ----
    train = df[df["date"] < SPLIT_DATE]
    test = df[df["date"] >= SPLIT_DATE]
    print(f"Train rows: {len(train):,}  Test rows: {len(test):,}")

    X_tr, X_te = train[feat_cols], test[feat_cols]

    # ===================== 1) CROWD CLASSIFIER =====================
    ycl = LabelEncoder().fit(LEVELS)
    ytr_c = ycl.transform(train["future_crowd_level"])
    yte_c = ycl.transform(test["future_crowd_level"])

    # class weights (Critical is ~1.2% of rows)
    counts = np.bincount(ytr_c, minlength=len(LEVELS))
    weights = counts.sum() / (len(LEVELS) * np.maximum(counts, 1))
    sample_w = weights[ytr_c]

    print("Training XGBoost crowd classifier …")
    xgb_c = XGBClassifier(
        n_estimators=300,
        max_depth=7,
        learning_rate=0.15,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=len(LEVELS),
        tree_method="hist",
        n_jobs=-1,
        eval_metric="mlogloss",
    )
    xgb_c.fit(X_tr, ytr_c, sample_weight=sample_w)
    pred_x = xgb_c.predict(X_te)

    print("Training RandomForest crowd classifier (baseline) …")
    rf_c = RandomForestClassifier(
        n_estimators=160, max_depth=16, class_weight="balanced",
        n_jobs=-1, random_state=42,
    )
    rf_c.fit(X_tr, ytr_c)
    pred_rf = rf_c.predict(X_te)

    def cls_metrics(y_true, y_pred):
        return {
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
            "macro_f1": round(float(f1_score(y_true, y_pred, average="macro")), 4),
            "recall_per_class": {
                lvl: round(float(r), 4)
                for lvl, r in zip(
                    LEVELS,
                    recall_score(y_true, y_pred, average=None, labels=range(len(LEVELS)), zero_division=0),
                )
            },
        }

    xgb_metrics = cls_metrics(yte_c, pred_x)
    rf_metrics = cls_metrics(yte_c, pred_rf)
    best_name = "xgboost" if xgb_metrics["macro_f1"] >= rf_metrics["macro_f1"] else "random_forest"
    best_model = xgb_c if best_name == "xgboost" else rf_c
    cm = confusion_matrix(yte_c, pred_x if best_name == "xgboost" else pred_rf, labels=range(len(LEVELS)))

    importances = best_model.feature_importances_
    nice = {
        "hour": "Hour of day",
        "previous_hour_passengers": "Previous-hour volume",
        "previous_day_average": "Previous-day average",
        "holiday": "Holiday",
        "train_frequency": "Train frequency",
        "occupancy": "Current occupancy",
        "day_of_week_e": "Day of week",
        "weather_e": "Weather",
        "event_e": "Event nearby",
    }
    fi = sorted(
        ({"feature": nice.get(f, f), "importance": round(float(v), 4)}
         for f, v in zip(feat_cols, importances)),
        key=lambda d: d["importance"], reverse=True,
    )

    # ===================== 2) DEMAND REGRESSOR =====================
    print("Training XGBoost demand regressor …")
    ytr_d = train["future_passenger_count"].values
    yte_d = test["future_passenger_count"].values
    xgb_d = XGBRegressor(
        n_estimators=300, max_depth=7, learning_rate=0.15,
        subsample=0.9, colsample_bytree=0.9, tree_method="hist", n_jobs=-1,
    )
    xgb_d.fit(X_tr, ytr_d)
    pred_d = xgb_d.predict(X_te)
    mae = float(mean_absolute_error(yte_d, pred_d))
    mask = yte_d > 0
    mape = float(np.mean(np.abs((yte_d[mask] - pred_d[mask]) / yte_d[mask])) * 100)
    r2 = float(r2_score(yte_d, pred_d))

    # ---- persist ----
    joblib.dump(best_model, ART / "crowd_model.joblib")
    joblib.dump(xgb_d, ART / "demand_model.joblib")
    joblib.dump({"encoders": encoders, "label": ycl, "features": feat_cols}, ART / "encoders.joblib")

    metrics = {
        "generated_from": "metro_ai_training_data.csv",
        "rows_total": int(len(df)),
        "rows_train": int(len(train)),
        "rows_test": int(len(test)),
        "split_date": SPLIT_DATE,
        "levels": LEVELS,
        "crowd_classifier": {
            "active_model": best_name,
            "version": "v1.0.0",
            "xgboost": xgb_metrics,
            "random_forest": rf_metrics,
            "confusion_matrix": cm.tolist(),
        },
        "demand_regressor": {
            "algorithm": "xgboost",
            "mae": round(mae, 1),
            "mape_pct": round(mape, 2),
            "r2": round(r2, 4),
        },
        "feature_importance": fi,
    }

    (ART / "model_metrics.json").write_text(json.dumps(metrics, indent=2))
    WEB_OUT.write_text(json.dumps(metrics, indent=2))
    print("\n=== RESULTS ===")
    print(f"Best crowd model : {best_name}")
    print(f"  macro-F1 (xgb) : {xgb_metrics['macro_f1']}  (rf {rf_metrics['macro_f1']})")
    print(f"  accuracy (xgb) : {xgb_metrics['accuracy']}")
    print(f"  Critical recall: {xgb_metrics['recall_per_class']['Critical']}")
    print(f"Demand regressor : MAE {mae:.0f}  MAPE {mape:.1f}%  R2 {r2:.3f}")
    print(f"Wrote {WEB_OUT}")


if __name__ == "__main__":
    main()
