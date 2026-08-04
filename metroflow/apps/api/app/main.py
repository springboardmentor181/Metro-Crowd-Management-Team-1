"""MetroFlow API — FastAPI gateway (Planning Docs 09/11).

Serves the trained AI models plus stations/flow/congestion/analytics/alerts/
scheduling. Runs in CSV-backed dev mode until Supabase env vars are set.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title="MetroFlow API",
    version="1.0.0",
    description="AI metro crowd management & scheduling — REST API.",
    docs_url=f"{settings.api_v1_prefix}/docs",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root() -> dict:
    return {"service": "metroflow-api", "docs": f"{settings.api_v1_prefix}/docs"}
