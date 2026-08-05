"""Public registration — creates a confirmed Supabase user via the admin API so
new operators can sign in immediately (email confirmation stays optional). Role
is always forced to 'operator'; admins are promoted separately."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


@router.post("/auth/register")
async def register(req: RegisterRequest) -> dict:
    if not (settings.supabase_url and settings.supabase_service_role_key):
        raise HTTPException(503, "Registration is not configured")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }
    body = {
        "email": req.email,
        "password": req.password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": req.full_name or req.email.split("@")[0],
            "role": "operator",
        },
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{settings.supabase_url}/auth/v1/admin/users", headers=headers, json=body
            )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Auth service unreachable: {exc}") from exc

    if r.status_code >= 400:
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        msg = str(data.get("msg") or data.get("error_code") or data.get("message") or "Registration failed")
        if "already" in msg.lower() or "exists" in msg.lower() or r.status_code == 422:
            raise HTTPException(409, "An account with this email already exists")
        raise HTTPException(400, msg)

    return {"data": {"ok": True, "email": req.email}}
