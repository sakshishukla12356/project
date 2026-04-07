"""
routers/azure.py
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from controllers import azure_controller
from schemas.azure_schema import AzureConnectRequest
from services import azure_service

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


# ─────────────────────────────────────────────
# 🔗 CONNECT AZURE ACCOUNT
# ─────────────────────────────────────────────
@router.post("/connect", status_code=status.HTTP_200_OK)
async def connect_azure(
    request: AzureConnectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect Azure account with service principal credentials."""
    try:
        # 🔥 STEP 1: VALIDATE AZURE CREDENTIALS
        is_valid = azure_service.verify_azure_credentials(
            subscription_id=request.subscription_id,
            tenant_id=request.tenant_id,
            client_id=request.client_id,
            client_secret=request.client_secret,
        )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Azure credentials",
            )

        # 🔥 STEP 2: SAVE ONLY IF VALID
        await azure_controller.save_azure_credentials(
            user_id=current_user.id,
            subscription_id=request.subscription_id,
            tenant_id=request.tenant_id,
            client_id=request.client_id,
            client_secret=request.client_secret,
            account_label=request.account_label,
            db=db,
        )

        return {
            "message": "Azure account connected successfully",
            "subscription_id": request.subscription_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# ─────────────────────────────────────────────
# 📊 AZURE SUMMARY
# ─────────────────────────────────────────────
@router.get("/summary")
async def azure_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get summarized Azure data (Total costs, service count, etc.)"""
    return await azure_controller.get_azure_summary(current_user.id, db)
