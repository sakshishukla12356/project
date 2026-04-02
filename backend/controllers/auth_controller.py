"""
controllers/auth_controller.py
Business logic for signup / login.
"""

from __future__ import annotations

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
# 📝 SIGNUP
# ─────────────────────────────────────────────
async def signup(
    email: str,
    password: str,
    full_name: str | None,
    db: AsyncSession,
) -> dict:

    # 🔍 Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 🔐 Hash password
    hashed_pw = hash_password(password)

    # 🧾 Create user
    user = User(
        email=email,
        hashed_password=hashed_pw,
        full_name=full_name,
    )

    db.add(user)

    # ⚠️ IMPORTANT: commit required
    await db.commit()

    # Refresh after commit
    await db.refresh(user)

    # 🔑 Generate JWT token
    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }


# ─────────────────────────────────────────────
# 🔐 LOGIN
# ─────────────────────────────────────────────
async def login(
    email: str,
    password: str,
    db: AsyncSession,
) -> dict:

    # 🔍 Fetch user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # ❌ Invalid credentials
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ❌ Inactive user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    # 🔑 Generate JWT
    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }
