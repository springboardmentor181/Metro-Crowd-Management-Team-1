from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import Principal, get_principal
from app.data import db, store

router = APIRouter()


@router.get("/analytics/summary")
def summary(_: Principal = Depends(get_principal)) -> dict:
    a = store.analytics_report()["analytics"]
    running = a["service_status_distribution"].get("Running", 0)
    total_ops = sum(a["service_status_distribution"].values()) or 1
    footfall_today = int(sum(a["city_avg_daily_flow"].values()))
    return {
        "data": {
            "network_load_pct": 63.4,
            "active_alerts": 7,
            "on_time_pct": round(running / total_ops * 100, 1),
            "footfall_today": footfall_today,
            "avg_delay_minutes": a["avg_delay_minutes"],
            "trend": {"footfall_pct": 4.2, "load_pct": -1.1},
        }
    }


REPORTS = {
    "top_footfall": "top_footfall_stations",
    "bottom_footfall": "bottom_footfall_stations",
    "city_flow": "city_avg_daily_flow",
    "by_category": "stations_by_category",
    "by_metro": "stations_by_metro",
    "ticket_types": "ticket_type_distribution",
    "payment_methods": "payment_method_distribution",
    "congested_lines": "most_congested_lines",
    "crowd_distribution": "crowd_density_distribution",
    "passengers_by_hour": "passengers_by_hour",
    "service_status": "service_status_distribution",
}


@router.get("/analytics/reports/{report}")
def report(report: str, _: Principal = Depends(get_principal)) -> dict:
    key = REPORTS.get(report)
    if not key:
        raise HTTPException(404, f"Unknown report. Options: {', '.join(REPORTS)}")
    return {"data": store.analytics_report()["analytics"][key]}


@router.get("/analytics/timeseries")
def timeseries(range: str = "1D", _: Principal = Depends(get_principal)) -> dict:
    """Passenger volume aggregated by the requested range (thousands).
    1H = recent hours, 1D = 24h profile, 1W = 7 days, 1M = 30 days."""
    rng = range.upper()
    if settings.db_enabled:
        if rng in ("1H", "1D"):
            rows = db.query(
                "select cast(left(\"time\",2) as int) as h, "
                "round(sum(total_passengers)/1000.0)::int as p "
                "from passenger_flow group by 1 order by 1"
            )
            data = [{"label": f"{r['h']:02d}:00", "passengers": r["p"]} for r in rows]
            if rng == "1H":
                data = data[-6:]
        else:
            days = 7 if rng == "1W" else 30
            rows = db.query(
                "select date, round(sum(total_passengers)/1000.0)::int as p "
                "from passenger_flow group by date order by date desc limit %s",
                (days,),
            )
            data = [
                {"label": r["date"].strftime("%d %b"), "passengers": r["p"]}
                for r in reversed(rows)
            ]
        return {"data": data, "meta": {"range": rng, "unit": "thousands"}}

    # CSV dev fallback
    df = store.passenger_flow()
    if rng in ("1H", "1D"):
        g = df.groupby("hour")["total_passengers"].sum().div(1000).round().astype(int)
        data = [{"label": f"{int(h):02d}:00", "passengers": int(v)} for h, v in g.items()]
        if rng == "1H":
            data = data[-6:]
    else:
        days = 7 if rng == "1W" else 30
        g = df.groupby("date")["total_passengers"].sum().div(1000).round().astype(int).tail(days)
        data = [{"label": str(d)[5:], "passengers": int(v)} for d, v in g.items()]
    return {"data": data, "meta": {"range": rng, "unit": "thousands"}}
