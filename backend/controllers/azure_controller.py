"""
controllers/azure_controller.py
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from models.usage_history import UsageHistory
from models.cloud_account import CloudAccount
from services import azure_service
def get_azure_resources_controller():
    return azure_service.fetch_azure_all()

async def get_azure_costs(user_id: int, db: AsyncSession) -> dict:
    try:
        return azure_service.fetch_azure_costs()
    except RuntimeError as e:
        return {"error": str(e), "total_cost_usd": 0.0, "by_service": []}


async def get_azure_resources(user_id: int, db: AsyncSession) -> dict:
    data = azure_service.fetch_azure_all()
    await _persist_snapshot(user_id, "azure", data.get("resources", []), db)
    return data


async def _persist_snapshot(
    user_id: int, provider: str, resources: list[dict], db: AsyncSession
) -> None:
    now = datetime.now(timezone.utc)
    for r in resources:
        db.add(UsageHistory(
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
            },
            recorded_at=now,
        ))
    await db.flush()


# ─────────────────────────────────────────────
# 🔗 SAVE AZURE CREDENTIALS
# ─────────────────────────────────────────────
async def save_azure_credentials(
    user_id: int,
    subscription_id: str,
    tenant_id: str,
    client_id: str,
    client_secret: str,
    account_label: str,
    db: AsyncSession,
):
    """
    Save or update Azure credentials for a user
    """
    result = await db.execute(
        select(CloudAccount).where(
            CloudAccount.user_id == user_id,
            CloudAccount.provider == "azure",
        )
    )

    existing = result.scalar_one_or_none()

    extra_config = {
        "subscription_id": subscription_id,
        "tenant_id": tenant_id,
        "client_id": client_id,
        "client_secret": client_secret,
    }

    if existing:
        existing.extra_config = extra_config
        existing.account_label = account_label
    else:
        new_account = CloudAccount(
            user_id=user_id,
            provider="azure",
            account_label=account_label,
            extra_config=extra_config,
        )
        db.add(new_account)

    await db.commit()


# ─────────────────────────────────────────────
# 🔑 GET USER AZURE CREDENTIALS
# ─────────────────────────────────────────────
async def get_user_azure_credentials(user_id: int, db: AsyncSession):
    """
    Fetch Azure credentials for a user
    """
    result = await db.execute(
        select(CloudAccount).where(
            CloudAccount.user_id == user_id,
            CloudAccount.provider == "azure",
        )
    )

    account = result.scalar_one_or_none()
    return account


# ─────────────────────────────────────────────
# 📊 AZURE SUMMARY
# ─────────────────────────────────────────────
async def get_azure_summary(user_id: int, db: AsyncSession) -> dict:
    """
    Fetch Azure summary (costs + service count)
    """
    try:
        data = await get_azure_costs(user_id, db)
        
        services = data.get("by_service", [])
        top_service = max(
            services,
            key=lambda x: x.get("cost_usd", 0),
            default=None,
        )

        return {
            "total_cost_usd": data.get("total_cost_usd", 0),
            "service_count": len(services),
            "top_service": top_service["service"] if top_service else None,
            "period": f"{data.get('start')} to {data.get('end')}"
        }

    except Exception as e:
        return {"error": str(e), "total_cost_usd": 0.0, "service_count": 0}
