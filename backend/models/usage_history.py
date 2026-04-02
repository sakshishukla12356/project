"""
models/usage_history.py
Records periodic usage snapshots per provider / service so that
carbon_service can compare previous vs current usage.
"""
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class UsageHistory(Base):
    __tablename__ = "usage_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)     # aws | azure | gcp
    service_name: Mapped[str] = mapped_column(String(128), nullable=False) # e.g. EC2, VM, S3
    resource_id: Mapped[str] = mapped_column(String(255), nullable=True)
    region: Mapped[str] = mapped_column(String(64), nullable=True)
    usage_hours: Mapped[float] = mapped_column(Float, default=0.0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    carbon_kg: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), nullable=True)        # running | stopped
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    user: Mapped["User"] = relationship(back_populates="usage_history")  # noqa: F821
