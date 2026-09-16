"""Seed the 7 dataset CSVs into Supabase Postgres (Doc 08 §6).

Usage (after 001_schema.sql has been run):
    DATABASE_URL=postgresql://... python seed/load_csvs.py

Uses COPY for speed. Truncates each table first so it is idempotent.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg

REPO_ROOT = Path(__file__).resolve().parents[4]
DATASET = REPO_ROOT / "MetroFlow_Dataset"

# (csv file, table, ordered columns matching the CSV header)
TABLES = [
    ("metro_stations.csv", "metro_stations",
     "station_id,metro_name,state,city,station_name,station_code,line_name,latitude,longitude,opening_year,interchange_station,platform_count,daily_average_footfall,nearby_landmarks,station_category"),
    ("passenger_flow.csv", "passenger_flow",
     "record_id,date,time,station_id,entry_count,exit_count,total_passengers,peak_hour_flag,weekday,holiday_flag,weather_condition,event_near_station,crowd_density_level"),
    ("ticket_transactions.csv", "ticket_transactions",
     "transaction_id,station_id,timestamp,ticket_type,passenger_category,entry_station,exit_station,travel_duration,fare_amount,payment_method"),
    ("train_operations.csv", "train_operations",
     "train_id,metro_name,line_name,station_id,arrival_time,departure_time,scheduled_time,actual_time,delay_minutes,train_frequency,occupancy_percentage,service_status"),
    ("train_occupancy.csv", "train_occupancy",
     "train_id,date,time,station_id,coach_capacity,current_passengers,occupancy_percentage,crowd_level"),
    ("external_factors.csv", "external_factors",
     "date,city,weather,temperature,rainfall,public_holiday,festival,major_event,impact_percentage"),
    ("train_schedule.csv", "train_schedule",
     "schedule_id,metro_name,line_name,time_slot,current_frequency,recommended_frequency,passenger_demand,delay_probability,optimization_score"),
]


def main() -> None:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        sys.exit("Set DATABASE_URL (Supabase connection string) first.")
    with psycopg.connect(dsn, autocommit=True) as conn:
        for fname, table, cols in TABLES:
            path = DATASET / fname
            print(f"Loading {table} from {fname} …", flush=True)
            with conn.cursor() as cur:
                cur.execute(f"truncate public.{table} cascade;")
                copy_sql = f"copy public.{table} ({cols}) from stdin with (format csv, header true)"
                with cur.copy(copy_sql) as cp, open(path, "r", encoding="utf-8") as fh:
                    while chunk := fh.read(1 << 20):
                        cp.write(chunk)
            with conn.cursor() as cur:
                cur.execute(f"select count(*) from public.{table};")
                print(f"  -> {cur.fetchone()[0]:,} rows")
    print("Seed complete.")


if __name__ == "__main__":
    main()
