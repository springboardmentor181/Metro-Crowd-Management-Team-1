"""CSV-backed data layer (dev). Lazily loads the MetroFlow dataset with pandas
and caches it. Swapped for Supabase/SQLAlchemy repositories once DATABASE_URL is
set — the route/service layer stays the same (Doc 09)."""
from __future__ import annotations

import json
from functools import lru_cache

import pandas as pd

from app.core.config import DATASET_DIR


@lru_cache
def stations() -> pd.DataFrame:
    return pd.read_csv(DATASET_DIR / "metro_stations.csv")


@lru_cache
def passenger_flow() -> pd.DataFrame:
    df = pd.read_csv(DATASET_DIR / "passenger_flow.csv")
    df["hour"] = df["time"].str.slice(0, 2).astype(int)
    return df


@lru_cache
def train_schedule() -> pd.DataFrame:
    return pd.read_csv(DATASET_DIR / "train_schedule.csv")


@lru_cache
def analytics_report() -> dict:
    return json.loads((DATASET_DIR / "analytics_report.json").read_text())


@lru_cache
def station_index() -> dict[str, dict]:
    return {r["station_id"]: r for r in stations().to_dict("records")}
