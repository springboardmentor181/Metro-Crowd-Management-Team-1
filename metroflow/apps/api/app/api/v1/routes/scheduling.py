from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import Principal, get_principal, require_admin
from app.data import db, store

router = APIRouter()


class RecoDecision(BaseModel):
    schedule_id: str | None = None
    line: str
    slot: str
    current: int
    recommended: int
    score: float
    decision: str  # 'applied' | 'dismissed'


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


@router.post("/schedules/recommendations/decide")
def decide(body: RecoDecision, p: Principal = Depends(require_admin)) -> dict:
    if not settings.db_enabled:
        raise HTTPException(400, "Applying recommendations requires the database")
    if body.decision not in ("applied", "dismissed"):
        raise HTTPException(400, "decision must be 'applied' or 'dismissed'")
    rows = db.query(
        """insert into schedule_recommendations
             (schedule_id, line_name, time_slot, current_frequency, recommended_frequency,
              optimization_score, status, decided_at)
           values (%s,%s,%s,%s,%s,%s,%s, now()) returning id::text""",
        (body.schedule_id, body.line, body.slot, body.current, body.recommended,
         body.score, body.decision),
    )
    rid = rows[0]["id"]
    db.execute(
        "insert into audit_log(action, entity, entity_id, payload) values (%s,%s,%s,%s)",
        (f"schedule.{body.decision}", "schedule_recommendations", rid, f'{{"by":"{p.email}","line":"{body.line}"}}'),
    )
    return {"data": {"id": rid, "status": body.decision}}
