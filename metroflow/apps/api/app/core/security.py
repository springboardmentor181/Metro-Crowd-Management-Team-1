"""Auth: verify Supabase JWTs and expose role dependencies (Doc 09/19).

In dev (no JWT secret configured) auth is open and every caller is treated as
an admin so the API is usable before Supabase is wired.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer = HTTPBearer(auto_error=False)


@dataclass
class Principal:
    user_id: str
    email: str
    role: str  # 'admin' | 'operator'


DEV_PRINCIPAL = Principal(user_id="dev", email="dev@metroflow.local", role="admin")


def _decode(token: str) -> dict:
    if settings.supabase_jwks_url:
        jwk_client = jwt.PyJWKClient(settings.supabase_jwks_url)
        key = jwk_client.get_signing_key_from_jwt(token).key
        return jwt.decode(token, key, algorithms=["RS256", "ES256"], audience="authenticated")
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        audience="authenticated",
    )


def get_principal(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> Principal:
    if not settings.auth_enabled:
        return DEV_PRINCIPAL
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        claims = _decode(creds.credentials)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc
    role = (claims.get("user_metadata") or {}).get("role") or claims.get("role") or "operator"
    if role not in ("admin", "operator"):
        role = "operator"
    return Principal(user_id=claims.get("sub", ""), email=claims.get("email", ""), role=role)


def require_admin(p: Principal = Depends(get_principal)) -> Principal:
    if p.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin role required")
    return p
