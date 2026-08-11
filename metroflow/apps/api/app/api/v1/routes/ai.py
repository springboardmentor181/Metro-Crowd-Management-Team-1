from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import Principal, get_principal
from app.ml import predictor

router = APIRouter()


class PredictContext(BaseModel):
    day_of_week: str = "Monday"
    weather: str = "Clear"
    holiday: int = 0
    event: str = "None"
    train_frequency: int = 4
    occupancy: int = 60


class PredictRequest(BaseModel):
    station_id: str
    hour: int
    context: PredictContext = PredictContext()


def _run(req: PredictRequest) -> dict:
    if not predictor.model_available():
        raise HTTPException(503, "Model not available — run services/ai/train.py")
    c = req.context
    return predictor.predict(
        station_id=req.station_id, hour=req.hour, day_of_week=c.day_of_week,
        weather=c.weather, holiday=c.holiday, event=c.event,
        train_frequency=c.train_frequency, occupancy=c.occupancy,
    )


@router.post("/ai/predict/crowd")
def predict_crowd(req: PredictRequest, _: Principal = Depends(get_principal)) -> dict:
    r = _run(req)
    return {"data": {k: r[k] for k in ("station_id", "hour", "crowd_level", "congestion_probability", "confidence", "model", "estimated")}}


@router.post("/ai/predict/demand")
def predict_demand(req: PredictRequest, _: Principal = Depends(get_principal)) -> dict:
    r = _run(req)
    return {"data": {"station_id": r["station_id"], "hour": r["hour"], "passenger_count": r["passenger_count"], "confidence": r["confidence"], "model": r["model"], "estimated": True}}
