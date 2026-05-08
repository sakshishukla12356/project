"""
routers/optimization.py

Optimization endpoints backed by real telemetry.
Never fabricates savings estimates; provides actionable recommendations without fake dollar amounts.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import aws_controller, azure_controller
from services.aws_service import summarize_aws_resources

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])


@router.get("/recommendations")
async def optimization_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns optimization recommendations derived from connected-cloud inventory.

    Output format is stable for the frontend; savings fields are intentionally omitted
    unless computed by a dedicated optimization engine.
    """
    aws_payload = await aws_controller.get_aws_resources(current_user.id, db)
    azure_payload = await azure_controller.get_azure_resources(current_user.id, db)

    aws_resources = aws_payload.get("resources", []) or []
    aws_summary = summarize_aws_resources(aws_resources) if aws_resources else {"active_resources": 0}

    azure_vms = azure_payload.get("virtual_machines", []) or []
    azure_storage = azure_payload.get("storage_accounts", []) or []
    azure_active = len(azure_vms) + len(azure_storage)

    recs: list[dict] = []

    if aws_summary.get("ec2", 0) > 0:
        recs.append(
            {
                "provider": "aws",
                "category": "compute",
                "title": "Review EC2 utilization",
                "description": "Use CloudWatch metrics to identify idle or over-provisioned instances for rightsizing.",
                "resources_affected": int(aws_summary.get("ec2", 0) or 0),
                "status": "review",
                "risk": "low",
            }
        )
    if aws_summary.get("s3", 0) > 0:
        recs.append(
            {
                "provider": "aws",
                "category": "storage",
                "title": "Apply S3 lifecycle policies",
                "description": "Review bucket access patterns and transition cold objects to lower-cost storage tiers.",
                "resources_affected": int(aws_summary.get("s3", 0) or 0),
                "status": "review",
                "risk": "low",
            }
        )
    if azure_active > 0:
        recs.append(
            {
                "provider": "azure",
                "category": "inventory",
                "title": "Review Azure inventory for waste",
                "description": "Validate VM sizing and remove unused resources across subscriptions.",
                "resources_affected": int(azure_active),
                "status": "review",
                "risk": "low",
            }
        )

    return {
        "recommendations": recs,
        "connected": {
            "aws": aws_payload.get("error") is None,
            "azure": azure_payload.get("error") is None,
        },
        "errors": [x for x in [aws_payload.get("error"), azure_payload.get("error")] if x],
    }


@router.get("/automation-rules")
async def optimization_automation_rules(
    current_user: User = Depends(get_current_user),
    _: AsyncSession = Depends(get_db),
):
    """
    Placeholder for future automation rules storage.
    Always returns empty unless rules are configured.
    """
    return {"rules": [], "note": "No automation rules configured."}

