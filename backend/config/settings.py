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
import warnings

from pydantic import BaseSettings, validator

logger = logging.getLogger(__name__)

_INSECURE_KEY_DEFAULTS = {
    "change-me",
    "change-me-to-a-long-random-string-in-production",
    "",
}


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me"
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
    FRONTEND_URL: str = "https://localhost:3000"
    REQUIRE_HTTPS: bool = False  # Set to True in production!
    COOKIE_SECURE: bool = False  # Set to True in production!
    ALLOWED_HOSTS: str = "*"     # Comma separated list for production, e.g., "api.cloudcost.com,cloudcost.com"

    # ── Validators ───────────────────────────────

    @validator("SECRET_KEY", always=True)
    def _secret_key_must_be_strong(cls, v, values):
        """Block startup with an insecure key outside of development."""
        if v in _INSECURE_KEY_DEFAULTS:
            env = values.get("APP_ENV", "development")
            if env != "development":
                raise ValueError(
                    "SECRET_KEY is not set! Generate one with:\n"
                    '  python -c "import secrets; print(secrets.token_urlsafe(64))"'
                )
            warnings.warn(
                "⚠️  SECRET_KEY is using an insecure default. "
                "Set a strong key before deploying.",
                stacklevel=2,
            )
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
