from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import Principal, get_principal
from app.data import store

router = APIRouter()


@router.get("/stations")
def list_stations(
    _: Principal = Depends(get_principal),
    network: str | None = None,
    city: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
) -> dict:
    df = store.stations()
    if network:
        df = df[df["metro_name"] == network]
    if city:
        df = df[df["city"] == city]
    if q:
        df = df[df["station_name"].str.contains(q, case=False, na=False)]
    total = len(df)
    start = (page - 1) * page_size
    rows = df.iloc[start : start + page_size].to_dict("records")
    return {"data": rows, "meta": {"page": page, "page_size": page_size, "total": total}}


@router.get("/stations/{station_id}")
def get_station(station_id: str, _: Principal = Depends(get_principal)) -> dict:
    row = store.station_index().get(station_id)
    if not row:
        raise HTTPException(404, "Station not found")
    return {"data": row}
