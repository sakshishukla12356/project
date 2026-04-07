from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 🔐 Link to user (MULTI-USER CORE)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # ☁️ Cloud provider (MULTI-CLOUD CORE)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # aws | azure | gcp

    # Optional label
    account_label: Mapped[str] = mapped_column(String(255), nullable=True)

    # 🌍 Region
    default_region: Mapped[str] = mapped_column(String(64), nullable=True)

    # 🆔 Optional account ID (AWS account id etc.)
    account_ref: Mapped[str] = mapped_column(String(512), nullable=True)

    # 🔑 AWS Credentials
    access_key: Mapped[str] = mapped_column(String(512), nullable=True)
    secret_key: Mapped[str] = mapped_column(String(512), nullable=True)

    # 🔥 UPDATED: extra_config safer default
    extra_config: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)

    # ⏱️ Created time
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # 🔗 Relationship
    owner: Mapped["User"] = relationship(back_populates="cloud_accounts")
