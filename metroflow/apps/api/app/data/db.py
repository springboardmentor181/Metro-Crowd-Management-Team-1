"""Postgres access for Supabase (used when DATABASE_URL is set). The backend
connects as a privileged role, so RLS is bypassed — RLS protects direct client
access, not this trusted service (Doc 09/19)."""
from __future__ import annotations

from typing import Any

import psycopg
from psycopg.rows import dict_row

from app.core.config import settings


def query(sql: str, params: tuple | None = None) -> list[dict[str, Any]]:
    with psycopg.connect(settings.database_url, connect_timeout=20, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchall()


def execute(sql: str, params: tuple | None = None) -> int:
    with psycopg.connect(settings.database_url, connect_timeout=20, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.rowcount
