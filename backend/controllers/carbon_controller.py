"""
controllers/carbon_controller.py
Pulls latest + previous usage snapshots from DB and runs carbon calculations.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.usage_history import UsageHistory
from services.carbon_service import (
    calculate_total_carbon,
    calculate_carbon_saved,
    get_emission_factors_table,
)
from services import aws_service, azure_service, gcp_service


def _row_to_service_dict(row: UsageHistory) -> dict:
    extra = row.extra_data or {}
    return {
        "provider": row.provider,
        "service_type": row.service_name,
        "resource_id": row.resource_id,
        "resource_name": extra.get("resource_name", row.resource_id),
        "instance_type": extra.get("instance_type", "m5.large"),
        "region": row.region or "",
        "status": row.status or "unknown",
        "usage_hours": row.usage_hours,
        "cost_usd": row.cost_usd,
        "size_gb": extra.get("size_gb", 0.0),
    }


async def get_total_carbon(user_id: int, db: AsyncSession) -> dict:
    """
    Return total carbon across all providers using the most recent snapshot
    stored in the database for the current user.
    If no snapshots exist yet, fetch live and compute on-the-fly.
    """
    # Fetch the most recent snapshot per resource
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(UsageHistory)
        .where(and_(UsageHistory.user_id == user_id, UsageHistory.recorded_at >= cutoff))
        .order_by(UsageHistory.recorded_at.desc())
    )
    rows = result.scalars().all()

    if not rows:
        # No cached data — fetch live from all providers (best-effort)
        live_resources: list[dict] = []
        for fetch_fn in (aws_service.fetch_aws_all, azure_service.fetch_azure_all, gcp_service.fetch_gcp_all):
            try:
                data = fetch_fn()
                live_resources.extend(data.get("resources", []))
            except Exception:
                pass
        service_dicts = live_resources
    else:
        # Deduplicate: keep latest record per resource_id
        seen: set[str] = set()
        service_dicts = []
        for row in rows:
            if row.resource_id not in seen:
                seen.add(row.resource_id)
                service_dicts.append(_row_to_service_dict(row))

    result_obj = calculate_total_carbon(service_dicts)

    services_out = []
    for svc in result_obj.services:
        services_out.append({
            "provider": svc.provider,
            "service_type": svc.service_type,
            "resource_id": svc.resource_id,
            "resource_name": svc.resource_name,
            "region": svc.region,
            "status": svc.status,
            "usage_hours": svc.usage_hours,
            "energy_kwh": svc.energy_kwh,
            "carbon_kg": svc.carbon_kg,
            "emission_factor": svc.emission_factor,
            "cost_usd": svc.cost_usd,
        })

    return {
        "total_carbon_kg": result_obj.total_carbon_kg,
        "total_energy_kwh": result_obj.total_energy_kwh,
        "total_cost_usd": result_obj.total_cost_usd,
        "service_count": len(services_out),
        "services": services_out,
        "carbon_by_provider": _aggregate_by_provider(services_out),
        "carbon_by_region": _aggregate_by_region(services_out),
        "emission_factors": get_emission_factors_table(),
    }


async def get_carbon_saved(user_id: int, db: AsyncSession) -> dict:
    """
    Compare the last two 24-hour windows of usage history and calculate
    carbon saved due to stopped or reduced services.

    Logic:
    - previous_usage = snapshots from 25–49 hours ago
    - current_usage  = snapshots from last 24 hours
    - Resources absent in current → assumed stopped → full previous carbon = saved
    - Resources with reduced hours → delta = saved
    """
    now = datetime.now(timezone.utc)

    # Current window
    curr_result = await db.execute(
        select(UsageHistory).where(
            and_(
                UsageHistory.user_id == user_id,
                UsageHistory.recorded_at >= now - timedelta(hours=24),
            )
        ).order_by(UsageHistory.recorded_at.desc())
    )
    curr_rows = curr_result.scalars().all()

    # Previous window
    prev_result = await db.execute(
        select(UsageHistory).where(
            and_(
                UsageHistory.user_id == user_id,
                UsageHistory.recorded_at >= now - timedelta(hours=49),
                UsageHistory.recorded_at < now - timedelta(hours=24),
            )
        ).order_by(UsageHistory.recorded_at.desc())
    )
    prev_rows = prev_result.scalars().all()

    def dedupe(rows) -> list[dict]:
        seen: set[str] = set()
        out = []
        for row in rows:
            if row.resource_id not in seen:
                seen.add(row.resource_id)
                out.append(_row_to_service_dict(row))
        return out

    current_usage = dedupe(curr_rows)
    previous_usage = dedupe(prev_rows)

    if not previous_usage:
        return {
            "carbon_saved_kg": 0.0,
            "details": [],
            "note": "No previous usage snapshot found. Carbon saved will populate after 24+ hours of data collection.",
        }

    saved_data = calculate_carbon_saved(previous_usage, current_usage)

    return {
        "carbon_saved_kg": saved_data["carbon_saved_kg"],
        "detail_count": len(saved_data["details"]),
        "details": saved_data["details"],
        "comparison_window": {
            "previous": f"{(now - timedelta(hours=49)).isoformat()} → {(now - timedelta(hours=24)).isoformat()}",
            "current": f"{(now - timedelta(hours=24)).isoformat()} → {now.isoformat()}",
        },
    }


def _aggregate_by_provider(services: list[dict]) -> dict:
    out: dict[str, float] = {}
    for s in services:
        p = s["provider"]
        out[p] = round(out.get(p, 0.0) + s["carbon_kg"], 6)
    return out


def _aggregate_by_region(services: list[dict]) -> dict:
    out: dict[str, float] = {}
    for s in services:
        r = s["region"] or "unknown"
        out[r] = round(out.get(r, 0.0) + s["carbon_kg"], 6)
    return out
