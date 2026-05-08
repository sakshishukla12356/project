from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from services.security_service import get_recent_events, get_event_stats
from services.realtime_bus import realtime_bus

router = APIRouter()

@router.get("/stats")
async def security_stats(
    hours: int = Query(24, description="Hours to look back"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get aggregated security metrics for the dashboard.
    Requires authentication (in a real app, you'd check current_user.is_superuser).
    """
    out = await get_event_stats(db, hours)
    await realtime_bus.publish("security_alert_generated", {"stats": out, "hours": hours})
    return out

@router.get("/events")
async def security_events(
    limit: int = Query(50, ge=1, le=500),
    severity: str = Query(None),
    event_type: str = Query(None),
    ip_address: str = Query(None),
    hours: int = Query(24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get raw security event logs.
    """
    out = await get_recent_events(
        db,
        limit=limit,
        severity=severity,
        event_type=event_type,
        ip_address=ip_address,
        hours=hours
    )
    await realtime_bus.publish(
        "security_alert_generated",
        {"events_count": len(out) if isinstance(out, list) else None, "hours": hours},
    )
    return out
