"""
controllers/gcp_controller.py
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from models.usage_history import UsageHistory
from services import gcp_service


async def get_gcp_costs(user_id: int, db: AsyncSession) -> dict:
    try:
        return gcp_service.fetch_gcp_costs()
    except RuntimeError as e:
        return {"error": str(e), "total_cost_usd": 0.0, "by_service": []}


async def get_gcp_resources(user_id: int, db: AsyncSession) -> dict:
    data = gcp_service.fetch_gcp_all()
    await _persist_snapshot(user_id, "gcp", data.get("resources", []), db)
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
