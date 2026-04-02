"""
routers/aws.py

Handles AWS routes:
- Connect AWS account
- Fetch costs
- Fetch resources
- Summary API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from dependencies.auth import get_current_user
from controllers import aws_controller

router = APIRouter(prefix="/aws", tags=["AWS"])


# ─────────────────────────────────────────────
# 🔗 CONNECT AWS ACCOUNT
# ─────────────────────────────────────────────
@router.post("/connect", status_code=status.HTTP_200_OK)
async def connect_aws(
    access_key: str = Form(...),
    secret_key: str = Form(...),
    region: str = Form("us-east-1"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user

        await aws_controller.save_aws_credentials(
            user_id=user_id,
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            db=db,
        )

        return {"message": "AWS account connected successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 💰 AWS COSTS
# ─────────────────────────────────────────────
@router.get("/costs")
async def get_aws_costs(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user

        data = await aws_controller.get_aws_costs(user_id, db)
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 📦 AWS RESOURCES
# ─────────────────────────────────────────────
@router.get("/resources")
async def get_aws_resources(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user

        data = await aws_controller.get_aws_resources(user_id, db)
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 📊 AWS SUMMARY
# ─────────────────────────────────────────────
@router.get("/summary")
async def aws_summary(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = current_user.id if hasattr(current_user, "id") else current_user

        data = await aws_controller.get_aws_costs(user_id, db)

        services = data.get("by_service", [])

        top_service = max(
            services,
            key=lambda x: x.get("cost_usd", 0),
            default=None,
        )

        return {
            "total_cost_usd": data.get("total_cost_usd", 0),
            "service_count": len(services),
            "top_service": top_service["service"] if top_service else None,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))