from fastapi import APIRouter, Depends, HTTPException

from app.core.security import Principal, get_principal
from app.data import store

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
}


@router.get("/analytics/reports/{report}")
def report(report: str, _: Principal = Depends(get_principal)) -> dict:
    key = REPORTS.get(report)
    if not key:
        raise HTTPException(404, f"Unknown report. Options: {', '.join(REPORTS)}")
    return {"data": store.analytics_report()["analytics"][key]}
