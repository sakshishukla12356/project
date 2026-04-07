"""
controllers/carbon_controller.py
Pulls latest + previous usage snapshots from DB and runs carbon calculations.
"""
from __future__ import annotations

import logging
import random
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.usage_history import UsageHistory
from models.cloud_account import CloudAccount
from services.carbon_service import (
    calculate_total_carbon,
    calculate_carbon_saved,
    get_emission_factors_table,
)
from services import aws_service, azure_service, gcp_service

logger = logging.getLogger(__name__)


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


def _map_service_name(provider: str, service_type: str) -> str:
    """Map internal service names to user-friendly cloud-specific names."""
    provider = provider.lower()
    service_type = service_type.lower()
    
    if provider == "aws":
        if service_type == "compute": return "EC2"
        if service_type == "storage": return "S3"
    elif provider == "azure":
        if service_type == "compute": return "Virtual Machines"
        if service_type == "storage": return "Blob Storage"
    elif provider == "gcp":
        if service_type == "compute": return "Compute Engine"
        if service_type == "storage": return "Cloud Storage"
        
    return service_type.title()


async def _fetch_live_data_for_user(user_id: int, db: AsyncSession) -> list[dict]:
    """Fetch live data by reading credentials securely from CloudAccount."""
    live_resources = []
    
    accounts_res = await db.execute(
        select(CloudAccount).where(CloudAccount.user_id == user_id)
    )
    accounts = accounts_res.scalars().all()
    
    for account in accounts:
        try:
            if account.provider == "aws":
                data = aws_service.fetch_aws_all(
                    access_key=account.access_key,
                    secret_key=account.secret_key,
                    region=account.default_region
                )
                live_resources.extend(data.get("resources", []))
            elif account.provider == "azure":
                cfg = account.extra_config or {}
                data = azure_service.fetch_azure_all(
                    subscription_id=cfg.get("subscription_id"),
                    tenant_id=cfg.get("tenant_id"),
                    client_id=cfg.get("client_id"),
                    client_secret=cfg.get("client_secret")
                )
                live_resources.extend(data.get("resources", []))
            elif account.provider == "gcp":
                cfg = account.extra_config or {}
                data = gcp_service.fetch_gcp_all(
                    project_id=cfg.get("project_id", "")
                )
                live_resources.extend(data.get("resources", []))
        except Exception:
            pass
            
    return live_resources


def _get_mock_data() -> list[dict]:
    """Return mock cloud resources for testing/demo purposes."""
    logger.info("Generating mock cloud resource data...")
    # Add slight randomness to cost values to simulate "live" data
    rand_variation = lambda base: round(base * random.uniform(0.9, 1.1), 2)
    return [
        {
            "provider": "azure",
            "service_type": "compute",
            "instance_type": "Standard_D2s_v3",
            "resource_id": "mock-azure-vm-1",
            "resource_name": "backend-prod-vm",
            "region": "centralindia",
            "usage_hours": 100.0,
            "cost_usd": rand_variation(8.2),
            "status": "running"
        },
        {
            "provider": "aws",
            "service_type": "compute",
            "instance_type": "m5.large",
            "resource_id": "mock-aws-ec2-1",
            "resource_name": "worker-node-1",
            "region": "ap-south-1",
            "usage_hours": 150.0,
            "cost_usd": rand_variation(15.0),
            "status": "running"
        },
        {
            "provider": "gcp",
            "service_type": "compute",
            "instance_type": "n1-standard-2",
            "resource_id": "mock-gcp-gce-1",
            "resource_name": "data-pipeline-vm",
            "region": "asia-south1",
            "usage_hours": 120.0,
            "cost_usd": rand_variation(6.0),
            "status": "running"
        },
        {
            "provider": "aws",
            "service_type": "storage",
            "resource_id": "mock-aws-s3-1",
            "resource_name": "app-assets-bucket",
            "region": "us-east-1",
            "size_gb": 500.0,
            "usage_hours": 720.0,
            "cost_usd": rand_variation(11.5),
            "status": "running"
        }
    ]


async def get_total_carbon(user_id: int, db: AsyncSession, mock: bool = False) -> dict:
    """
    Return total carbon across all providers using the most recent snapshot
    stored in the database for the current user.
    If no snapshots exist yet, fetch live and compute on-the-fly.
    """
    if mock:
        logger.info("Mock mode enabled for get_total_carbon. Bypassing live/cached data.")
        service_dicts = _get_mock_data()
    else:
        # Fetch the most recent snapshot per resource
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        result = await db.execute(
            select(UsageHistory)
            .where(and_(UsageHistory.user_id == user_id, UsageHistory.recorded_at >= cutoff))
            .order_by(UsageHistory.recorded_at.desc())
        )
        rows = result.scalars().all()

        if not rows:
            # No cached data — fetch live using credentials securely
            service_dicts = await _fetch_live_data_for_user(user_id, db)
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
        mapped_service = _map_service_name(svc.provider, svc.service_type)
        
        services_out.append({
            "service": mapped_service,
            "region": svc.region,
            "state": svc.status,
            "carbon_kg": svc.carbon_kg,
            # Extra fields kept to avoid breaking aggregations / frontend state
            "provider": svc.provider,
            "energy_kwh": svc.energy_kwh,
            "resource_id": svc.resource_id,
            "resource_name": svc.resource_name,
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
