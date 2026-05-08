"""
routers/sustainability.py

FastAPI routes for Sustainability and Carbon Impact analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.base import get_db
from dependencies.auth import get_current_user
from controllers import carbon_impact_controller

router = APIRouter(prefix="/sustainability", tags=["Sustainability"])

@router.get("/carbon-impact", status_code=status.HTTP_200_OK)
async def get_carbon_impact(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns detailed carbon impact analytics across all connected cloud platforms.
    """
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user
        
        data = await carbon_impact_controller.get_carbon_impact_analytics(user_id, db)
        
        return data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sustainability analytics failed: {str(e)}"
        )
