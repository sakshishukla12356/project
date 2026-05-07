"""
models/security_event.py

SQLAlchemy model for the security audit log.
Every security-relevant action (login, failed auth, rate-limit hit,
suspicious behaviour) is persisted here for forensics and dashboards.
"""

from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    # ── Primary key ──────────────────────────────
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # ── Event classification ─────────────────────
    event_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment="e.g. LOGIN_SUCCESS, LOGIN_FAILED, BRUTE_FORCE, RATE_LIMITED, TOKEN_ABUSE, SUSPICIOUS_IP",
    )

    severity: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="INFO",
        index=True,
        comment="INFO | WARNING | CRITICAL",
    )

    # ── Who / where ──────────────────────────────
    ip_address: Mapped[str] = mapped_column(
        String(45),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=True,
        index=True,
        comment="NULL for unauthenticated events",
    )

    user_email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )

    # ── Request context ──────────────────────────
    method: Mapped[str] = mapped_column(
        String(10),
        nullable=True,
    )

    path: Mapped[str] = mapped_column(
        String(512),
        nullable=True,
    )

    user_agent: Mapped[str] = mapped_column(
        String(512),
        nullable=True,
    )

    status_code: Mapped[int] = mapped_column(
        Integer,
        nullable=True,
    )

    # ── Details ──────────────────────────────────
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    details: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="JSON blob with extra context",
    )

    request_id: Mapped[str] = mapped_column(
        String(64),
        nullable=True,
        comment="Correlation ID for request tracing",
    )

    # ── Timestamps ───────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # ── Composite indexes for dashboard queries ──
    __table_args__ = (
        Index("ix_severity_created", "severity", "created_at"),
        Index("ix_ip_event_type", "ip_address", "event_type"),
        Index("ix_user_event_type", "user_id", "event_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<SecurityEvent(id={self.id}, type={self.event_type}, "
            f"severity={self.severity}, ip={self.ip_address})>"
        )
