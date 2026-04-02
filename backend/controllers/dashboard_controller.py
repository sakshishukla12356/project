"""
controllers/dashboard_controller.py
Combines AWS + Azure + GCP + Carbon into a single dashboard response.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from services import aws_service, azure_service, gcp_service
from services.carbon_service import calculate_total_carbon, calculate_carbon_saved
from controllers.carbon_controller import get_carbon_saved
from models.usage_history import UsageHistory
from datetime import datetime, timezone


async def get_dashboard(user_id: int, db: AsyncSession) -> dict:
    """
    Fetch live data from all three cloud providers concurrently,
    compute carbon totals, and return a unified JSON payload.
    """
    # Run all three provider fetches concurrently in a thread pool
    # (boto3/azure/gcp SDKs are synchronous)
    loop = asyncio.get_event_loop()

    aws_task = loop.run_in_executor(None, aws_service.fetch_aws_all)
    azure_task = loop.run_in_executor(None, azure_service.fetch_azure_all)
    gcp_task = loop.run_in_executor(None, gcp_service.fetch_gcp_all)

    aws_data, azure_data, gcp_data = await asyncio.gather(
        aws_task, azure_task, gcp_task, return_exceptions=True
    )

    # Handle any provider-level exceptions gracefully
    def safe(result, provider: str) -> dict:
        if isinstance(result, Exception):
            return {
                "provider": provider,
                "error": str(result),
                "resources": [],
                "total_cost_usd": 0.0,
                "total_carbon_kg": 0.0,
                "total_energy_kwh": 0.0,
            }
        return result

    aws_data = safe(aws_data, "aws")
    azure_data = safe(azure_data, "azure")
    gcp_data = safe(gcp_data, "gcp")

    # Combine all resources for aggregate carbon calculation
    all_resources: list[dict] = (
        aws_data.get("resources", [])
        + azure_data.get("resources", [])
        + gcp_data.get("resources", [])
    )

    carbon_result = calculate_total_carbon(all_resources)

    # Persist snapshot for historical comparison
    now = datetime.now(timezone.utc)
    for r in all_resources:
        db.add(UsageHistory(
            user_id=user_id,
            provider=r.get("provider", ""),
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
        ))
    await db.flush()

    # Carbon saved (best-effort from DB history)
    carbon_saved_data = await get_carbon_saved(user_id, db)

    # Build per-service output
    services_out = []
    for svc in carbon_result.services:
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

    total_cost = round(
        aws_data.get("total_cost_usd", 0.0)
        + azure_data.get("total_cost_usd", 0.0)
        + gcp_data.get("total_cost_usd", 0.0),
        4,
    )

    return {
        "fetched_at": now.isoformat(),
        # ── Summary ────────────────────────────────────────────────────────
        "total_cost": total_cost,
        "total_carbon": carbon_result.total_carbon_kg,
        "total_energy_kwh": carbon_result.total_energy_kwh,
        "carbon_saved": carbon_saved_data.get("carbon_saved_kg", 0.0),
        # ── Per-provider breakdown ─────────────────────────────────────────
        "providers": {
            "aws": {
                "total_cost_usd": aws_data.get("total_cost_usd", 0.0),
                "total_carbon_kg": aws_data.get("total_carbon_kg", 0.0),
                "total_energy_kwh": aws_data.get("total_energy_kwh", 0.0),
                "cost_breakdown": aws_data.get("cost_breakdown", []),
                "ec2_count": len(aws_data.get("ec2_instances", [])),
                "s3_count": len(aws_data.get("s3_buckets", [])),
                "errors": aws_data.get("errors", []),
            },
            "azure": {
                "total_cost_usd": azure_data.get("total_cost_usd", 0.0),
                "total_carbon_kg": azure_data.get("total_carbon_kg", 0.0),
                "total_energy_kwh": azure_data.get("total_energy_kwh", 0.0),
                "cost_breakdown": azure_data.get("cost_breakdown", []),
                "vm_count": len(azure_data.get("virtual_machines", [])),
                "storage_count": len(azure_data.get("storage_accounts", [])),
                "errors": azure_data.get("errors", []),
            },
            "gcp": {
                "total_cost_usd": gcp_data.get("total_cost_usd", 0.0),
                "total_carbon_kg": gcp_data.get("total_carbon_kg", 0.0),
                "total_energy_kwh": gcp_data.get("total_energy_kwh", 0.0),
                "cost_breakdown": gcp_data.get("cost_breakdown", []),
                "instance_count": len(gcp_data.get("compute_instances", [])),
                "bucket_count": len(gcp_data.get("gcs_buckets", [])),
                "errors": gcp_data.get("errors", []),
            },
        },
        # ── Carbon details ─────────────────────────────────────────────────
        "carbon_by_provider": _aggregate_by_key(services_out, "provider"),
        "carbon_by_region": _aggregate_by_key(services_out, "region"),
        "carbon_saved_details": carbon_saved_data.get("details", []),
        # ── Full service list ──────────────────────────────────────────────
        "services": services_out,
    }


def _aggregate_by_key(services: list[dict], key: str) -> dict[str, float]:
    out: dict[str, float] = {}
    for s in services:
        k = s.get(key) or "unknown"
        out[k] = round(out.get(k, 0.0) + s["carbon_kg"], 6)
    return out
