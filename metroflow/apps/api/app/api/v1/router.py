from fastapi import APIRouter

from app.api.v1.routes import (
    ai, alerts, analytics, auth, chat, congestion, flow, health, scheduling, stations, users,
)

api_router = APIRouter()
for module in (health, auth, stations, flow, congestion, ai, chat, analytics, scheduling, alerts, users):
    api_router.include_router(module.router)
