"""
config/settings.py
Central settings loaded from environment / .env file.

Security notes
──────────────
• Never commit a populated .env — only .env.example (with empty values).
• In production, inject secrets via environment variables, a vault,
  or your cloud provider's secret manager.
"""
from functools import lru_cache
import logging

from pydantic import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────
    # Default to production-safe behavior; individual deployments override via env.
    APP_ENV: str = "production"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # ── Database ─────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./multicloud.db"

    # ── AWS ──────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""
    AWS_DEFAULT_REGION: str = "us-east-1"

    # ── Azure ────────────────────────────────────
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    AZURE_SUBSCRIPTION_ID: str = ""

    # ── GCP ──────────────────────────────────────
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GCP_PROJECT_ID: str = ""
    GCP_BILLING_ACCOUNT_ID: str = ""

    # ── Security & Transport ─────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    REQUIRE_HTTPS: bool = False
    COOKIE_SECURE: bool = False
    ALLOWED_HOSTS: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
