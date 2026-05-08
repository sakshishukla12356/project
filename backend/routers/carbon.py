"""
routers/carbon.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import carbon_controller
from services.carbon_service import get_emission_factors_table
from services.realtime_bus import realtime_bus

router = APIRouter(prefix="/carbon", tags=["Carbon"])


@router.get("")
async def total_carbon(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Total carbon emissions across all cloud providers.

    Returns:
    - total_carbon_kg: combined kgCO2 from all services
    - total_energy_kwh: total energy consumed
    - carbon_by_provider: breakdown per cloud provider
    - carbon_by_region: breakdown per region
    - services: per-resource carbon detail
    - emission_factors: region → kgCO2/kWh lookup tables
    """
    out = await carbon_controller.get_total_carbon(current_user.id, db)
    await realtime_bus.publish(
        "carbon_metrics_updated",
        {
            "total_carbon_kg": out.get("total_carbon_kg", 0.0),
            "total_energy_kwh": out.get("total_energy_kwh", 0.0),
            "total_cost_usd": out.get("total_cost_usd", 0.0),
            "carbon_by_provider": out.get("carbon_by_provider", {}),
            "carbon_by_region": out.get("carbon_by_region", {}),
            "service_count": out.get("service_count", 0),
            "note": out.get("note"),
        },
    )
    return out


@router.get("/saved")
async def carbon_saved(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Carbon saved compared to the previous 24-hour window.

    Logic:
    - Stopped services → full previous-period carbon counted as saved
    - Reduced usage → delta (previous − current) counted as saved
    """
    return await carbon_controller.get_carbon_saved(current_user.id, db)


@router.get("/emission-factors")
async def emission_factors(_: User = Depends(get_current_user)):
    """
    Reference table: region → kgCO2eq/kWh for AWS, Azure, and GCP.
    Useful for building UI dropdowns / tooltips.
    """
    return get_emission_factors_table()
