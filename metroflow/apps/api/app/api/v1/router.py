from fastapi import APIRouter

from app.api.v1.routes import (
    ai, alerts, analytics, congestion, flow, health, scheduling, stations,
)

api_router = APIRouter()
for module in (health, stations, flow, congestion, ai, analytics, scheduling, alerts):
    api_router.include_router(module.router)
