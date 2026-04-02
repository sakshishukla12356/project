"""
models/user.py
Production-ready User model for multi-user SaaS system
"""

from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

# ✅ Avoid circular imports (VERY IMPORTANT)
if TYPE_CHECKING:
    from models.cloud_account import CloudAccount
    from models.usage_history import UsageHistory


class User(Base):
    __tablename__ = "users"

    # ─────────────────────────────
    # PRIMARY KEY
    # ─────────────────────────────
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ─────────────────────────────
    # USER INFO
    # ─────────────────────────────
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    # ─────────────────────────────
    # USER STATUS FLAGS
    # ─────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    # ─────────────────────────────
    # TIMESTAMPS
    # ─────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # ─────────────────────────────
    # RELATIONSHIPS
    # ─────────────────────────────
    cloud_accounts: Mapped[List["CloudAccount"]] = relationship(
        "CloudAccount",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    usage_history: Mapped[List["UsageHistory"]] = relationship(
        "UsageHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # ─────────────────────────────
    # DEBUG METHOD
    # ─────────────────────────────
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
