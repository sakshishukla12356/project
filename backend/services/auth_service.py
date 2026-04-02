"""
services/auth_service.py
JWT-based authentication helpers (production-ready)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from config.settings import get_settings

settings = get_settings()

# 🔐 Password hashing config
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─────────────────────────────────────────────
# 🔐 PASSWORD FUNCTIONS
# ─────────────────────────────────────────────
def hash_password(password: str) -> str:
    # ✅ Clean + limit password (bcrypt max = 72 bytes)
    password = password.strip()

    if len(password.encode("utf-8")) > 72:
        password = password[:72]

    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    plain = plain.strip()

    if len(plain.encode("utf-8")) > 72:
        plain = plain[:72]

    return pwd_context.verify(plain, hashed)


# ─────────────────────────────────────────────
# 🔑 JWT TOKEN FUNCTIONS
# ─────────────────────────────────────────────
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """
    Decode JWT token.
    Raises JWTError if invalid/expired.
    """
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as e:
        raise JWTError(f"Token decode error: {str(e)}")
