"""User management (admin only) — list profiles and invite operators."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import Principal, require_admin
from app.data import db

router = APIRouter()


@router.get("/users")
def list_users(_: Principal = Depends(require_admin)) -> dict:
    if not settings.db_enabled:
        raise HTTPException(400, "User management requires the database")
    rows = db.query(
        """select p.id::text, coalesce(p.full_name,'') as full_name, p.role::text as role,
                  coalesce(p.assigned_network,'All networks') as network, p.is_active,
                  u.email, p.created_at
           from public.profiles p join auth.users u on u.id = p.id
           order by p.created_at"""
    )
    for r in rows:
        r["created_at"] = r["created_at"].isoformat() if r.get("created_at") else None
    return {"data": rows, "meta": {"total": len(rows)}}


class Invite(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    role: str = "operator"


@router.post("/users/invite")
async def invite(body: Invite, p: Principal = Depends(require_admin)) -> dict:
    if not (settings.supabase_url and settings.supabase_service_role_key):
        raise HTTPException(503, "Not configured")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    role = body.role if body.role in ("operator", "admin") else "operator"

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": body.email,
        "password": body.password,
        "email_confirm": True,
        "user_metadata": {"full_name": body.full_name or body.email.split("@")[0], "role": role},
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(f"{settings.supabase_url}/auth/v1/admin/users", headers=headers, json=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Auth service unreachable: {exc}") from exc

    if r.status_code >= 400:
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        msg = str(data.get("msg") or data.get("error_code") or "Invite failed")
        if "already" in msg.lower() or r.status_code == 422:
            raise HTTPException(409, "An account with this email already exists")
        raise HTTPException(400, msg)

    if settings.db_enabled:
        db.execute(
            "insert into audit_log(action, entity, entity_id, payload) values (%s,%s,%s,%s)",
            ("user.invite", "auth.users", body.email, f'{{"by":"{p.email}","role":"{role}"}}'),
        )
    return {"data": {"ok": True, "email": body.email, "role": role}}
