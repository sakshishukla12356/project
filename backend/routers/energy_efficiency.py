"""
routers/energy_efficiency.py

FastAPI routes for AI-powered Energy Efficiency metrics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.base import get_db
from dependencies.auth import get_current_user
from controllers import energy_efficiency_controller, azure_efficiency_controller

router = APIRouter(tags=["Energy Efficiency"])

@router.get("/aws/energy-efficiency", status_code=status.HTTP_200_OK)
async def get_aws_energy_efficiency(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real-time Energy Efficiency score and sustainability insights for AWS.
    """
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user
        data = await energy_efficiency_controller.get_aws_energy_efficiency(user_id, db)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/azure/energy-efficiency", status_code=status.HTTP_200_OK)
async def get_azure_energy_efficiency(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real-time Energy Efficiency score and sustainability insights for Azure.
    """
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user
        data = await azure_efficiency_controller.get_azure_energy_efficiency(user_id, db)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
