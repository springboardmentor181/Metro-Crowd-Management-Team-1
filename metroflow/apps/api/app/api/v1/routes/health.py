from fastapi import APIRouter

from app.core.config import settings
from app.ml import predictor

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "env": settings.app_env,
        "auth_enabled": settings.auth_enabled,
        "db": "supabase" if settings.db_enabled else "csv-dev",
        "model_loaded": predictor.model_available(),
    }
