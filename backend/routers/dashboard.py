"""
routers/dashboard.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import dashboard_controller

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Combined multi-cloud dashboard.

    Fetches AWS, Azure, and GCP data concurrently and returns:

    ```json
    {
      "total_cost": 0.0,
      "total_carbon": 0.0,
      "total_energy_kwh": 0.0,
      "carbon_saved": 0.0,
      "providers": { "aws": {...}, "azure": {...}, "gcp": {...} },
      "carbon_by_provider": { "aws": 0.0, "azure": 0.0, "gcp": 0.0 },
      "carbon_by_region": { "us-east-1": 0.0, ... },
      "carbon_saved_details": [...],
      "services": [...]
    }
    ```
    """
    return await dashboard_controller.get_dashboard(current_user.id, db)
