from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Literal
from sqlalchemy.orm import Session

from database.base import get_db
from models.cloud_account import CloudAccount

from services.aws_service import stop_instance
from services.azure_service import _get_credential
from azure.mgmt.compute import ComputeManagementClient

router = APIRouter()


# ─────────────────────────────────────────────
# 🔹 Request Model
# ─────────────────────────────────────────────
class StopRequest(BaseModel):
    provider: Literal["aws", "azure"] = Field(..., example="aws")
    resource_id: str = Field(..., example="i-1234567890abcdef")
    user_id: int = Field(..., example=1)


# ─────────────────────────────────────────────
# 🔹 Extract Resource Group
# ─────────────────────────────────────────────
def extract_resource_group(resource_id: str):
    try:
        parts = resource_id.split("/")
        return parts[4]
    except:
        return None


# ─────────────────────────────────────────────
# 🔹 STOP API
# ─────────────────────────────────────────────
@router.post("/stop", tags=["Cloud Actions"])
def stop_resource(data: StopRequest, db: Session = Depends(get_db)):

    provider = data.provider.lower()
    resource_id = data.resource_id.strip()

    # 🔥 Fetch account from DB
    account = db.query(CloudAccount).filter(
        CloudAccount.user_id == data.user_id,
        CloudAccount.provider == provider
    ).first()

    # ❌ No account
    if not account:
        return {
            "status": "error",
            "message": "Cloud account not found. Please connect your cloud account first."
        }

    try:
        # ───────────────── AWS ─────────────────
        if provider == "aws":

            # ❌ Missing credentials
            if not account.access_key or not account.secret_key:
                return {
                    "status": "error",
                    "message": "AWS credentials not configured"
                }

            stop_instance(
                instance_id=resource_id,
                access_key=account.access_key,
                secret_key=account.secret_key,
                region=account.default_region or "us-east-1"
            )

            return {
                "status": "success",
                "message": f"AWS instance '{resource_id}' stopped successfully"
            }

        # ───────────────── AZURE ─────────────────
        elif provider == "azure":

            extra = account.extra_config or {}

            # ❌ Missing credentials
            if not extra:
                return {
                    "status": "error",
                    "message": "Azure credentials not configured"
                }

            credential = _get_credential(
                tenant_id=extra.get("tenant_id"),
                client_id=extra.get("client_id"),
                client_secret=extra.get("client_secret")
            )

            compute_client = ComputeManagementClient(
                credential,
                extra.get("subscription_id")
            )

            resource_group = extract_resource_group(resource_id)

            if not resource_group:
                return {
                    "status": "error",
                    "message": "Invalid Azure resource_id format"
                }

            vm_name = resource_id.split("/")[-1]

            compute_client.virtual_machines.begin_deallocate(
                resource_group,
                vm_name
            )

            return {
                "status": "success",
                "message": f"Azure VM '{vm_name}' stopped successfully"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to stop resource: {str(e)}"
        }