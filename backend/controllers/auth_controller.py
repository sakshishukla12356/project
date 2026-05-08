"""
controllers/auth_controller.py
Production-ready authentication controller.
"""

from __future__ import annotations

import re
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)


# ─────────────────────────────────────────────
# 🔐 PASSWORD VALIDATION
# ─────────────────────────────────────────────

def validate_password(password: str) -> None:
    """
    Validate password strength.
    """

    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter",
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter",
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number",
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character",
        )


# ─────────────────────────────────────────────
# 📝 SIGNUP
# ─────────────────────────────────────────────

async def signup(
    email: str,
    password: str,
    full_name: str | None,
    db: AsyncSession,
) -> dict:

    # ✅ Normalize email
    email = email.lower().strip()

    # ✅ Validate password strength
    validate_password(password)

    # 🔍 Check if user already exists
    result = await db.execute(
        select(User).where(User.email == email)
    )

    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 🔐 Hash password
    hashed_pw = hash_password(password)

    # 🧾 Create new user
    user = User(
        email=email,
        hashed_password=hashed_pw,
        full_name=full_name.strip() if full_name else None,
        is_active=True,
        created_at=datetime.utcnow(),
    )

    try:
        # ➕ Add user to DB
        db.add(user)

        # 💾 Commit transaction
        await db.commit()

        # 🔄 Refresh instance
        await db.refresh(user)

    except Exception as e:
        # ❌ Rollback on failure
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during signup",
        ) from e

    # 🔑 Generate JWT token
    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # ✅ Success response
    return {
        "message": "Signup successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
    }


# ─────────────────────────────────────────────
# 🔐 LOGIN
# ─────────────────────────────────────────────

async def login(
    email: str,
    password: str,
    db: AsyncSession,
) -> dict:

    # ✅ Normalize email
    email = email.lower().strip()

    # 🔍 Fetch user
    result = await db.execute(
        select(User).where(User.email == email)
    )

    user = result.scalar_one_or_none()

    # ❌ Invalid credentials
    if not user or not verify_password(
        password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ❌ Inactive account
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    # 🔑 Generate JWT token
    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # ✅ Success response
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
    }