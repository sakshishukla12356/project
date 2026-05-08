"""
routers/telemetry.py

Unified API-first telemetry endpoints for frontend dashboard integration.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from controllers import aws_controller, azure_controller, energy_efficiency_controller, azure_efficiency_controller
from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from services.aws_service import fetch_aws_cost_trend, summarize_aws_resources
from services import azure_service
from services.security_service import get_event_stats, get_recent_events

router = APIRouter(prefix="/api", tags=["Telemetry"])


def _security_score_from_stats(stats: dict) -> int:
    total = stats.get("total_events", 0) or 0
    by_severity = stats.get("by_severity", {}) or {}
    critical = by_severity.get("CRITICAL", 0) or 0
    warning = by_severity.get("WARNING", 0) or 0
    penalty = (critical * 8) + (warning * 3) + min(total, 20)
    return max(0, min(100, 100 - penalty))


def _resource_distribution_from_summary(summary: dict) -> list[dict]:
    return [
        {"name": "EC2", "value": summary.get("ec2", 0), "color": "#3b82f6"},
        {"name": "RDS", "value": summary.get("rds", 0), "color": "#06b6d4"},
        {"name": "S3", "value": summary.get("s3", 0), "color": "#10b981"},
        {"name": "Lambda", "value": summary.get("lambda", 0), "color": "#8b5cf6"},
        {"name": "Other", "value": summary.get("other", 0), "color": "#6366f1"},
    ]


@router.get("/aws/resources")
async def aws_resources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resources_payload = await aws_controller.get_aws_resources(current_user.id, db)
    resources = resources_payload.get("resources", [])
    summary = summarize_aws_resources(resources)
    return {
        "active_resources": summary.get("active_resources", 0),
        "resources": summary,
        "raw_resources": resources,
        "error": resources_payload.get("error"),
    }


@router.get("/aws/costs")
async def aws_costs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await aws_controller.get_user_aws_credentials(current_user.id, db)
    base = await aws_controller.get_aws_costs(current_user.id, db)
    trend = []
    if account:
        trend = fetch_aws_cost_trend(
            access_key=account.access_key,
            secret_key=account.secret_key,
            days=7,
        )
    else:
        trend = [{"date": str(i + 1), "cost": 0.0} for i in range(7)]

    return {
        "monthly_cost": base.get("total_cost_usd", 0.0),
        "cost_breakdown": base.get("by_service", []),
        "cost_trend_7d": trend,
        "error": base.get("error"),
    }


@router.get("/aws/dashboard")
async def aws_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resources_payload = await aws_controller.get_aws_resources(current_user.id, db)
    costs_payload = await aws_controller.get_aws_costs(current_user.id, db)
    account = await aws_controller.get_user_aws_credentials(current_user.id, db)
    security_stats = await get_event_stats(db, 24)
    recent_events = await get_recent_events(db, limit=10, hours=24)
    summary = summarize_aws_resources(resources_payload.get("resources", []))
    trend = (
        fetch_aws_cost_trend(
            access_key=account.access_key,
            secret_key=account.secret_key,
            days=7,
        )
        if account
        else [{"date": str(i + 1), "cost": 0.0} for i in range(7)]
    )

    monthly_cost = float(costs_payload.get("total_cost_usd", 0.0) or 0.0)
    savings_potential = round(monthly_cost * 0.15, 2)
    security_score = _security_score_from_stats(security_stats)

    recs = []
    if summary.get("ec2", 0) > 0:
        recs.append({"title": "Right-size EC2 instances", "savings_usd": round(monthly_cost * 0.05, 2)})
    if summary.get("rds", 0) > 0:
        recs.append({"title": "Review RDS sizing and storage", "savings_usd": round(monthly_cost * 0.04, 2)})
    if summary.get("s3", 0) > 0:
        recs.append({"title": "Apply S3 lifecycle policies", "savings_usd": round(monthly_cost * 0.03, 2)})

    return {
        "provider": "aws",
        "monthly_cost": monthly_cost,
        "active_resources": summary.get("active_resources", 0),
        "security_score": security_score,
        "savings_potential": savings_potential,
        "resources": summary,
        "resource_distribution": _resource_distribution_from_summary(summary),
        "cost_trend_7d": trend,
        "recent_alerts": recent_events,
        "recommendations": recs,
        "errors": [x for x in [resources_payload.get("error"), costs_payload.get("error")] if x],
    }


@router.get("/aws/sustainability")
async def aws_sustainability(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    efficiency = await energy_efficiency_controller.get_aws_energy_efficiency(current_user.id, db)
    return {
        "provider": "aws",
        "energy_efficiency": efficiency.get("efficiency_score", 0),
        "renewable_coverage": efficiency.get("renewable_coverage", 0),
        "water_impact": efficiency.get("water_impact_liters", 0),
        "sustainability_score": efficiency.get("sustainability_score", efficiency.get("efficiency_score", 0)),
        "co2_emissions": efficiency.get("co2_emissions_kg", 0),
        "trees_planted": efficiency.get("trees_equivalent", 0),
        "energy_consumed": efficiency.get("energy_consumed_kwh", 0),
        "recommendations": efficiency.get("recommendations", []),
        "raw": efficiency,
    }


@router.get("/azure/resources")
async def azure_resources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payload = await azure_controller.get_azure_resources(current_user.id, db)
    vms = payload.get("virtual_machines", [])
    storage = payload.get("storage_accounts", [])
    summary = {
        "azure_vms": len(vms),
        "azure_storage": len(storage),
        "databases": 0,
        "active_resources": len(vms) + len(storage),
    }
    return {"active_resources": summary["active_resources"], "resources": summary, "raw_resources": payload.get("resources", [])}


@router.get("/azure/costs")
async def azure_costs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await azure_controller.get_user_azure_credentials(current_user.id, db)
    payload = await azure_controller.get_azure_costs(current_user.id, db)
    trend = (
        azure_service.fetch_azure_cost_trend(
            subscription_id=(account.extra_config or {}).get("subscription_id") if account else None,
            tenant_id=(account.extra_config or {}).get("tenant_id") if account else None,
            client_id=(account.extra_config or {}).get("client_id") if account else None,
            client_secret=(account.extra_config or {}).get("client_secret") if account else None,
            days=7,
        )
        if account and account.extra_config
        else [{"date": str(i + 1), "cost": 0.0} for i in range(7)]
    )
    return {
        "monthly_cost": payload.get("total_cost_usd", 0.0),
        "cost_breakdown": payload.get("by_service", []),
        "cost_trend_7d": trend,
        "error": payload.get("error"),
    }


@router.get("/azure/dashboard")
async def azure_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resources_payload = await azure_controller.get_azure_resources(current_user.id, db)
    costs_payload = await azure_controller.get_azure_costs(current_user.id, db)
    account = await azure_controller.get_user_azure_credentials(current_user.id, db)
    security_stats = await get_event_stats(db, 24)
    recent_events = await get_recent_events(db, limit=10, hours=24)

    vms = resources_payload.get("virtual_machines", [])
    storage = resources_payload.get("storage_accounts", [])
    active_resources = len(vms) + len(storage)
    monthly_cost = float(costs_payload.get("total_cost_usd", 0.0) or 0.0)
    savings_potential = round(monthly_cost * 0.12, 2)
    trend = (
        azure_service.fetch_azure_cost_trend(
            subscription_id=(account.extra_config or {}).get("subscription_id") if account else None,
            tenant_id=(account.extra_config or {}).get("tenant_id") if account else None,
            client_id=(account.extra_config or {}).get("client_id") if account else None,
            client_secret=(account.extra_config or {}).get("client_secret") if account else None,
            days=7,
        )
        if account and account.extra_config
        else [{"date": str(i + 1), "cost": 0.0} for i in range(7)]
    )

    return {
        "provider": "azure",
        "monthly_cost": monthly_cost,
        "active_resources": active_resources,
        "security_score": _security_score_from_stats(security_stats),
        "savings_potential": savings_potential,
        "resources": {
            "azure_vms": len(vms),
            "azure_storage": len(storage),
            "databases": 0,
        },
        "resource_distribution": [
            {"name": "Azure VMs", "value": len(vms), "color": "#3b82f6"},
            {"name": "Storage", "value": len(storage), "color": "#06b6d4"},
            {"name": "Databases", "value": 0, "color": "#10b981"},
        ],
        "cost_trend_7d": trend,
        "recent_alerts": recent_events,
        "recommendations": [],
        "errors": [x for x in [resources_payload.get("error"), costs_payload.get("error")] if x],
    }


@router.get("/azure/sustainability")
async def azure_sustainability(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    efficiency = await azure_efficiency_controller.get_azure_energy_efficiency(current_user.id, db)
    return {
        "provider": "azure",
        "energy_efficiency": efficiency.get("efficiency_score", 0),
        "renewable_coverage": efficiency.get("renewable_coverage", 0),
        "water_impact": efficiency.get("water_impact_liters", 0),
        "sustainability_score": efficiency.get("sustainability_score", efficiency.get("efficiency_score", 0)),
        "co2_emissions": efficiency.get("co2_emissions_kg", 0),
        "trees_planted": efficiency.get("trees_equivalent", 0),
        "energy_consumed": efficiency.get("energy_consumed_kwh", 0),
        "recommendations": efficiency.get("recommendations", []),
        "raw": efficiency,
    }
