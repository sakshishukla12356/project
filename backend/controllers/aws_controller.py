"""
controllers/aws_controller.py

Orchestrates AWS service calls and persists usage history.
"""

from __future__ import annotations
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.usage_history import UsageHistory
from models.cloud_account import CloudAccount
from services import aws_service


# ─────────────────────────────────────────────
# 🔗 SAVE AWS CREDENTIALS
# ─────────────────────────────────────────────
async def save_aws_credentials(
    user_id: int,
    access_key: str,
    secret_key: str,
    region: str,
    db: AsyncSession,
):
    """
    Save or update AWS credentials for a user
    """
    result = await db.execute(
        select(CloudAccount).where(
            CloudAccount.user_id == user_id,
            CloudAccount.provider == "aws",
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        existing.access_key = access_key
        existing.secret_key = secret_key
        existing.default_region = region
    else:
        new_account = CloudAccount(
            user_id=user_id,
            provider="aws",
            access_key=access_key,
            secret_key=secret_key,
            default_region=region,
        )
        db.add(new_account)

    await db.commit()


# ─────────────────────────────────────────────
# 🔑 GET USER AWS CREDENTIALS
# ─────────────────────────────────────────────
async def get_user_aws_credentials(user_id: int, db: AsyncSession):
    """
    Fetch AWS credentials for a user
    """
    result = await db.execute(
        select(CloudAccount).where(
            CloudAccount.user_id == user_id,
            CloudAccount.provider == "aws",
        )
    )

    account = result.scalar_one_or_none()

    if not account:
        return None

    return account


# ─────────────────────────────────────────────
# 💰 AWS COSTS
# ─────────────────────────────────────────────
async def get_aws_costs(user_id: int, db: AsyncSession) -> dict:
    """
    Fetch AWS cost breakdown
    """
    try:
        account = await get_user_aws_credentials(user_id, db)

        if not account:
            return {
                "error": "AWS not connected",
                "total_cost_usd": 0.0,
                "by_service": [],
            }

        return aws_service.fetch_aws_costs(
            access_key=account.access_key,
            secret_key=account.secret_key,
            region=account.default_region,
        )

    except Exception as e:
        return {
            "error": str(e),
            "total_cost_usd": 0.0,
            "by_service": [],
        }


# ─────────────────────────────────────────────
# 📦 AWS RESOURCES
# ─────────────────────────────────────────────
async def get_aws_resources(user_id: int, db: AsyncSession) -> dict:
    """
    Fetch AWS resources and store usage snapshot
    """
    account = await get_user_aws_credentials(user_id, db)

    if not account:
        return {"error": "AWS not connected"}

    data = aws_service.fetch_aws_all(
        access_key=account.access_key,
        secret_key=account.secret_key,
        region=account.default_region,
    )

    await _persist_snapshot(user_id, "aws", data.get("resources", []), db)

    return data


# ─────────────────────────────────────────────
# 📊 SAVE USAGE HISTORY
# ─────────────────────────────────────────────
async def _persist_snapshot(
    user_id: int,
    provider: str,
    resources: list[dict],
    db: AsyncSession,
) -> None:
    """
    Save resource usage into DB
    """
    now = datetime.now(timezone.utc)

    for r in resources:
        record = UsageHistory(
            user_id=user_id,
            provider=provider,
            service_name=r.get("service_type", ""),
            resource_id=r.get("resource_id", ""),
            region=r.get("region", ""),
            usage_hours=r.get("usage_hours", 0.0),
            cost_usd=r.get("cost_usd", 0.0),
            carbon_kg=r.get("carbon_kg", 0.0),
            status=r.get("status", "unknown"),
            extra_data={
                "resource_name": r.get("resource_name", ""),
                "instance_type": r.get("instance_type", ""),
                "energy_kwh": r.get("energy_kwh", 0.0),
                "emission_factor": r.get("emission_factor", 0.0),
            },
            recorded_at=now,
        )
        db.add(record)

    await db.commit()