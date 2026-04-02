"""
routers/azure.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import azure_controller

router = APIRouter(prefix="/azure", tags=["Azure"])


@router.get("/costs")
async def azure_costs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Azure cost breakdown via Cost Management API (last 30 days)."""
    return await azure_controller.get_azure_costs(current_user.id, db)


@router.get("/resources")
async def azure_resources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All Azure VMs + Storage Accounts with carbon emission data."""
    return await azure_controller.get_azure_resources(current_user.id, db)
