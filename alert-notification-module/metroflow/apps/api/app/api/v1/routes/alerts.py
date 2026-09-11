from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import Principal, get_principal, require_admin
from app.data import db, store

router = APIRouter()


class CreateAlert(BaseModel):
    message: str
    type: str = "emergency"
    severity: str = "emergency"
    station_id: str | None = None
    line_name: str | None = None

HIGH = {"High", "Critical"}


def _derive_alerts() -> list[dict]:
    """CSV-dev fallback: derive alerts from the most congested station-hours."""
    flow = store.passenger_flow()
    names = dict(zip(store.stations()["station_id"], store.stations()["station_name"]))
    lines = dict(zip(store.stations()["station_id"], store.stations()["line_name"]))
    crit = flow[flow["crowd_density_level"].isin(HIGH)]
    counts = crit.groupby("station_id").size().sort_values(ascending=False).head(6)
    out = []
    for i, (sid, n) in enumerate(counts.items()):
        sev = "Critical" if i < 2 else "High"
        out.append({
            "id": f"al{i+1}", "type": "overcrowding", "severity": sev,
            "station": names.get(sid, sid), "line": lines.get(sid, ""),
            "message": f"{sev} crowding — {int(n)} high-density hours recorded this window",
            "ago": f"{(i + 1) * 4}m", "status": "open" if i < 4 else "acknowledged",
        })
    return out


@router.get("/alerts")
def list_alerts(
    _: Principal = Depends(get_principal),
    status: str | None = None,
    severity: str | None = None,
) -> dict:
    if settings.db_enabled:
        rows = db.query(
            """
            select a.id::text, a.type::text, a.severity::text, a.status::text,
                   a.message, a.line_name as line, a.created_at, a.acknowledged_at,
                   s.station_name as station
            from alerts a left join metro_stations s on s.station_id = a.station_id
            order by (a.status='open') desc, a.severity desc, a.created_at desc
            """
        )
        for r in rows:
            r["severity"] = str(r["severity"]).title()
            r["ago"] = "just now"
            r.pop("created_at", None)
            r.pop("acknowledged_at", None)
        if status:
            rows = [r for r in rows if r["status"] == status]
        if severity:
            rows = [r for r in rows if r["severity"].lower() == severity.lower()]
        return {"data": rows, "meta": {"total": len(rows), "source": "supabase"}}

    alerts = _derive_alerts()
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    if severity:
        alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]
    return {"data": alerts, "meta": {"total": len(alerts), "source": "csv"}}


@router.post("/alerts/{alert_id}/ack")
def ack_alert(alert_id: str, p: Principal = Depends(get_principal)) -> dict:
    if not settings.db_enabled:
        raise HTTPException(400, "Alert acknowledgement requires the database")
    n = db.execute(
        "update alerts set status='acknowledged', acknowledged_at=now() where id=%s and status='open'",
        (alert_id,),
    )
    if n == 0:
        raise HTTPException(404, "Alert not found or already acknowledged")
    db.execute(
        "insert into audit_log(action, entity, entity_id, payload) values (%s,%s,%s,%s)",
        ("alert.ack", "alerts", alert_id, f'{{"by":"{p.email}"}}'),
    )
    return {"data": {"id": alert_id, "status": "acknowledged"}}


@router.post("/alerts")
def create_alert(body: CreateAlert, p: Principal = Depends(require_admin)) -> dict:
    if not settings.db_enabled:
        raise HTTPException(400, "Creating alerts requires the database")
    rows = db.query(
        """insert into alerts(type, severity, station_id, line_name, message, status)
           values (%s,%s,%s,%s,%s,'open') returning id::text""",
        (body.type, body.severity, body.station_id, body.line_name, body.message),
    )
    aid = rows[0]["id"]
    db.execute(
        "insert into audit_log(action, entity, entity_id, payload) values (%s,%s,%s,%s)",
        ("alert.broadcast", "alerts", aid, f'{{"by":"{p.email}"}}'),
    )
    return {"data": {"id": aid, "status": "open"}}
