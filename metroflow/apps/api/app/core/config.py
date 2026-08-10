"""Typed settings loaded from environment (Planning Doc 17)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

import os

# apps/api/app/core/config.py -> repo root is 5 parents up
API_DIR = Path(__file__).resolve().parents[2]          # apps/api
REPO_ROOT = API_DIR.parents[2]                          # d:/dataset for metro management system

# Paths are env-overridable (Docker mounts them at /data/*).
DATASET_DIR = Path(os.environ.get("DATASET_DIR", REPO_ROOT / "MetroFlow_Dataset"))
ARTIFACTS_DIR = Path(
    os.environ.get("ARTIFACTS_DIR", API_DIR.parent.parent / "services" / "ai" / "artifacts")
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(API_DIR / ".env"), extra="ignore")

    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwks_url: str = ""
    database_url: str = ""

    redis_url: str = "redis://localhost:6379/0"
    replay_default_speed: int = 3600
    replay_start_at: str = "2024-10-01T05:00:00Z"

    # Groq (LLM chatbot)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def auth_enabled(self) -> bool:
        """Verify JWTs only when a secret/JWKS is configured; dev runs open."""
        return bool(self.supabase_jwt_secret or self.supabase_jwks_url)

    @property
    def db_enabled(self) -> bool:
        return bool(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
