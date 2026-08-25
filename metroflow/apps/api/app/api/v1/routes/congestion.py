from fastapi import APIRouter, Depends, Query

from app.core.security import Principal, get_principal
from app.data import store

router = APIRouter()

HIGH = {"High", "Critical"}


@router.get("/congestion/heatmap")
def heatmap(
    _: Principal = Depends(get_principal),
    network: str | None = None,
    limit: int = Query(8, ge=1, le=20),
) -> dict:
    """Station × hour congestion probability (share of High/Critical hours)."""
    flow = store.passenger_flow()
    st = store.stations()[["station_id", "station_name", "metro_name", "daily_average_footfall"]]
    if network:
        ids = set(st[st["metro_name"] == network]["station_id"])
        flow = flow[flow["station_id"].isin(ids)]

    top_ids = (
        st.sort_values("daily_average_footfall", ascending=False)["station_id"].head(limit).tolist()
    )
    id_to_name = dict(zip(st["station_id"], st["station_name"]))
    hours = list(range(6, 24, 2))

    sub = flow[flow["station_id"].isin(top_ids)].copy()
    sub["is_high"] = sub["crowd_density_level"].isin(HIGH).astype(int)
    grp = sub.groupby(["station_id", "hour"])["is_high"].mean()

    values = []
    for sid in top_ids:
        row = [round(float(grp.get((sid, h), 0.0)), 2) for h in hours]
        values.append(row)

    return {
        "data": {
            "rows": [id_to_name.get(s, s) for s in top_ids],
            "cols": [f"{h:02d}" for h in hours],
            "values": values,
            "scale": "congestion_probability",
        },
        "meta": {"unit": "0-1"},
    }
