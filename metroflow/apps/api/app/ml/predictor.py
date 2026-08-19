"""Serves the trained crowd & demand models (Doc 10). Loads the joblib artifacts
produced by services/ai/train.py and predicts from a station-hour context."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
import pandas as pd

from app.core.config import ARTIFACTS_DIR
from app.data import store

LEVELS = ["Low", "Medium", "High", "Critical"]
NUM_COLS = ["hour", "previous_hour_passengers", "previous_day_average",
            "holiday", "train_frequency", "occupancy"]
CAT_COLS = ["day_of_week", "weather", "event"]


@lru_cache
def _bundle():
    import joblib

    crowd = joblib.load(ARTIFACTS_DIR / "crowd_model.joblib")
    demand = joblib.load(ARTIFACTS_DIR / "demand_model.joblib")
    enc = joblib.load(ARTIFACTS_DIR / "encoders.joblib")
    return crowd, demand, enc


def model_available() -> bool:
    return (ARTIFACTS_DIR / "crowd_model.joblib").exists()


def _safe_encode(le, value: str) -> int:
    classes = list(le.classes_)
    return classes.index(value) if value in classes else 0


@lru_cache
def _station_hour_baseline(station_id: str, hour: int) -> tuple[float, float]:
    """Mean previous-hour and daily-average passengers for a station at an hour."""
    df = store.passenger_flow()
    sub = df[df["station_id"] == station_id]
    if sub.empty:
        return 5000.0, 5000.0
    at_hour = sub[sub["hour"] == hour]["total_passengers"]
    prev = float(at_hour.mean()) if len(at_hour) else float(sub["total_passengers"].mean())
    daily = float(sub["total_passengers"].mean())
    return round(prev, 1), round(daily, 1)


def predict(
    station_id: str,
    hour: int,
    day_of_week: str = "Monday",
    weather: str = "Clear",
    holiday: int = 0,
    event: str = "None",
    train_frequency: int = 4,
    occupancy: int = 60,
) -> dict:
    crowd, demand, enc = _bundle()
    encoders, label = enc["encoders"], enc["label"]
    prev_hour, prev_day = _station_hour_baseline(station_id, hour)

    row = {
        "hour": hour,
        "previous_hour_passengers": prev_hour,
        "previous_day_average": prev_day,
        "holiday": int(holiday),
        "train_frequency": train_frequency,
        "occupancy": occupancy,
        "day_of_week_e": _safe_encode(encoders["day_of_week"], day_of_week),
        "weather_e": _safe_encode(encoders["weather"], weather),
        "event_e": _safe_encode(encoders["event"], event),
    }
    X = pd.DataFrame([row])[enc["features"]]

    proba = crowd.predict_proba(X)[0]
    # proba columns follow label.classes_ order (alphabetical), NOT LEVELS.
    classes = list(label.classes_)
    idx = int(np.argmax(proba))
    crowd_level = classes[idx]

    def p(level: str) -> float:
        return float(proba[classes.index(level)]) if level in classes else 0.0

    passengers = int(max(0, round(float(demand.predict(X)[0]))))
    congestion = round(p("High") + p("Critical"), 3)

    return {
        "station_id": station_id,
        "hour": hour,
        "crowd_level": str(crowd_level),
        "passenger_count": passengers,
        "congestion_probability": min(1.0, congestion),
        "confidence": round(float(proba[idx]), 3),
        "model": {"name": "crowd_classifier", "version": "v1.0.0", "algorithm": "xgboost"},
        "estimated": True,
    }
