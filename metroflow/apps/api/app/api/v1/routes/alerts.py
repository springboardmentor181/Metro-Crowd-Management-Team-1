from fastapi import APIRouter, Depends

from app.core.security import Principal, get_principal
from app.data import store

router = APIRouter()

HIGH = {"High", "Critical"}


def _derive_alerts() -> list[dict]:
    """Derive operational alerts from the most congested station-hours."""
    flow = store.passenger_flow()
    names = dict(zip(store.stations()["station_id"], store.stations()["station_name"]))
    lines = dict(zip(store.stations()["station_id"], store.stations()["line_name"]))
    crit = flow[flow["crowd_density_level"].isin(HIGH)]
    counts = (
        crit.groupby("station_id").size().sort_values(ascending=False).head(6)
    )
    out = []
    for i, (sid, n) in enumerate(counts.items()):
        sev = "Critical" if i < 2 else "High"
        out.append({
            "id": f"al{i+1}",
            "type": "overcrowding",
            "severity": sev,
            "station": names.get(sid, sid),
            "line": lines.get(sid, ""),
            "message": f"{sev} crowding — {int(n)} high-density hours recorded this window",
            "ago": f"{(i + 1) * 4}m",
            "status": "open" if i < 4 else "acknowledged",
        })
    return out


@router.get("/alerts")
def list_alerts(
    _: Principal = Depends(get_principal),
    status: str | None = None,
    severity: str | None = None,
) -> dict:
    alerts = _derive_alerts()
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    if severity:
        alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]
    return {"data": alerts, "meta": {"total": len(alerts)}}
