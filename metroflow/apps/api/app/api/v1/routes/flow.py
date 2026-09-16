from fastapi import APIRouter, Depends, Query

from app.core.security import Principal, get_principal
from app.data import store

router = APIRouter()


@router.get("/flow")
def passenger_flow(
    station_id: str = Query(...),
    _: Principal = Depends(get_principal),
) -> dict:
    """Average passenger flow by hour for a station (entry/exit/total)."""
    df = store.passenger_flow()
    sub = df[df["station_id"] == station_id]
    if sub.empty:
        return {"data": [], "meta": {"station_id": station_id}}
    grouped = (
        sub.groupby("hour")[["entry_count", "exit_count", "total_passengers"]]
        .mean()
        .round(0)
        .astype(int)
        .reset_index()
        .sort_values("hour")
    )
    data = [
        {
            "hour": f"{int(r['hour']):02d}:00",
            "inflow": int(r["entry_count"]),
            "outflow": int(r["exit_count"]),
            "total": int(r["total_passengers"]),
        }
        for r in grouped.to_dict("records")
    ]
    return {"data": data, "meta": {"station_id": station_id}}
