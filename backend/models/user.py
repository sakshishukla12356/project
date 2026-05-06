"""
models/user.py
Enterprise-Grade Secure User Model with RBAC + Security Features
"""

from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from sqlalchemy import (
    String,
    DateTime,
    Boolean,
    Integer,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from database.base import Base


# =========================================================
# Avoid Circular Imports
# =========================================================
if TYPE_CHECKING:
    from models.cloud_account import CloudAccount
    from models.usage_history import UsageHistory


# =========================================================
# USER MODEL
# =========================================================
class User(Base):
    __tablename__ = "users"

    # =====================================================
    # PRIMARY KEY
    # =====================================================
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # =====================================================
    # USER INFORMATION
    # =====================================================
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # =====================================================
    # ROLE-BASED ACCESS CONTROL (RBAC)
    # =====================================================
    role: Mapped[str] = mapped_column(
        String(50),
        default="user",
        nullable=False
    )

    """
    Available Roles:
    - user
    - admin
    - manager
    - security_analyst
    """

    # =====================================================
    # ACCOUNT STATUS
    # =====================================================
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    # =====================================================
    # LOGIN SECURITY
    # =====================================================
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    account_locked: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    last_login: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    password_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # =====================================================
    # MFA / 2FA
    # =====================================================
    mfa_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    mfa_secret: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    # =====================================================
    # EMAIL VERIFICATION
    # =====================================================
    email_verification_token: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    # =====================================================
    # PASSWORD RESET SECURITY
    # =====================================================
    reset_password_token: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    reset_password_expires: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # =====================================================
    # JWT TOKEN SECURITY
    # =====================================================
    refresh_token: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    refresh_token_expires: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # =====================================================
    # AUDIT + FORENSICS
    # =====================================================
    last_ip_address: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )

    last_user_agent: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    # =====================================================
    # TIMESTAMPS
    # =====================================================
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================
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

    # =====================================================
    # ROLE HELPERS
    # =====================================================
    def is_admin(self) -> bool:
        return self.role == "admin"

    def is_manager(self) -> bool:
        return self.role == "manager"

    def is_security_analyst(self) -> bool:
        return self.role == "security_analyst"

    def has_role(self, role_name: str) -> bool:
        return self.role == role_name

    # =====================================================
    # LOGIN SECURITY METHODS
    # =====================================================
    def increment_failed_attempts(self):
        self.failed_login_attempts += 1

        if self.failed_login_attempts >= 5:
            self.account_locked = True

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0

    # =====================================================
    # ACCOUNT LOCK CHECK
    # =====================================================
    def is_account_locked(self) -> bool:
        return self.account_locked

    # =====================================================
    # MFA CHECK
    # =====================================================
    def has_mfa_enabled(self) -> bool:
        return self.mfa_enabled

    # =====================================================
    # EMAIL VERIFICATION CHECK
    # =====================================================
    def is_email_verified(self) -> bool:
        return self.is_verified

    # =====================================================
    # DEBUG REPRESENTATION
    # =====================================================
    def __repr__(self) -> str:
        return (
            f"<User("
            f"id={self.id}, "
            f"email='{self.email}', "
            f"role='{self.role}', "
            f"active={self.is_active}"
            f")>"
        )
