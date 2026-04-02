"""
routers/gcp.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import gcp_controller

router = APIRouter(prefix="/gcp", tags=["GCP"])


@router.get("/costs")
async def gcp_costs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GCP billing data (requires billing account ID + BigQuery export for full detail)."""
    return await gcp_controller.get_gcp_costs(current_user.id, db)


@router.get("/resources")
async def gcp_resources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All GCP Compute Engine instances + GCS buckets with carbon emission data."""
    return await gcp_controller.get_gcp_resources(current_user.id, db)
