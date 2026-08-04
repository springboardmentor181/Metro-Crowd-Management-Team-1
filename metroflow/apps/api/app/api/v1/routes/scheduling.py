from fastapi import APIRouter, Depends

from app.core.security import Principal, get_principal
from app.data import store

router = APIRouter()


@router.get("/schedules")
def schedules(
    _: Principal = Depends(get_principal),
    line: str | None = None,
    limit: int = 50,
) -> dict:
    df = store.train_schedule()
    if line:
        df = df[df["line_name"] == line]
    return {"data": df.head(limit).to_dict("records"), "meta": {"total": len(df)}}


@router.get("/schedules/recommendations")
def recommendations(_: Principal = Depends(get_principal), limit: int = 12) -> dict:
    df = store.train_schedule().copy()
    # surface slots where the optimizer recommends a change, best score first
    recs = df[df["current_frequency"] != df["recommended_frequency"]]
    recs = recs.sort_values("optimization_score", ascending=False).head(limit)
    data = [
        {
            "schedule_id": r["schedule_id"],
            "line": r["line_name"],
            "slot": r["time_slot"],
            "current": int(r["current_frequency"]),
            "recommended": int(r["recommended_frequency"]),
            "demand": round(float(r["passenger_demand"]), 1),
            "delay_probability": round(float(r["delay_probability"]), 3),
            "score": round(float(r["optimization_score"]), 1),
        }
        for r in recs.to_dict("records")
    ]
    return {"data": data, "meta": {"total": len(data)}}
