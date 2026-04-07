"""
services/azure_service.py

Real Azure integration using azure-mgmt-* SDKs.
Fetches VM usage, storage accounts, and cost management data.
"""
from __future__ import annotations

import os



print("TENANT:", os.getenv("AZURE_TENANT_ID"))
print("CLIENT:", os.getenv("AZURE_CLIENT_ID"))
print("SECRET:", os.getenv("AZURE_CLIENT_SECRET"))



import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from azure.identity import ClientSecretCredential, DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.costmanagement import CostManagementClient
from azure.mgmt.costmanagement.models import (
    QueryDefinition, QueryTimePeriod, QueryDataset,
    QueryAggregation, QueryGrouping, TimeframeType,
)
from azure.core.exceptions import AzureError, HttpResponseError

from config.settings import get_settings
from services.carbon_service import calculate_carbon

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_credential(
    tenant_id: Optional[str] = None,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
):
    """
    Build an Azure credential.
    Falls back to DefaultAzureCredential (managed identity / CLI login)
    if explicit service-principal params are missing.
    """
    tid = tenant_id or settings.AZURE_TENANT_ID
    cid = client_id or settings.AZURE_CLIENT_ID
    sec = client_secret or settings.AZURE_CLIENT_SECRET

    if tid and cid and sec:
        return ClientSecretCredential(
            tenant_id=tid, client_id=cid, client_secret=sec
        )
    logger.info("Azure: falling back to DefaultAzureCredential")
    return DefaultAzureCredential()


def _sub_id(subscription_id: Optional[str] = None) -> str:
    sid = subscription_id or settings.AZURE_SUBSCRIPTION_ID
    if not sid:
        raise RuntimeError("AZURE_SUBSCRIPTION_ID is not configured.")
    return sid


# ─── Validation ───────────────────────────────────────────────────────────────

def verify_azure_credentials(
    subscription_id: str,
    tenant_id: str,
    client_id: str,
    client_secret: str,
) -> bool:
    """
    Validate Azure credentials by attempting to get an access token
    and potentially listing a resource.
    """
    try:
        credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
        # Try to get a token for Azure Management API
        token = credential.get_token("https://management.azure.com/.default")
        return True if token else False
    except Exception as e:
        logger.error("Azure credential validation failed: %s", e)
        return False


# ─── Cost Management ──────────────────────────────────────────────────────────

def fetch_azure_costs(
    subscription_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    **cred_kwargs,
) -> dict:
    """
    Fetch Azure costs grouped by service name via Cost Management API.
    """
    credential = _get_credential(**cred_kwargs)
    sub = _sub_id(subscription_id)

    if not end_date:
        end_date = datetime.now(timezone.utc).date().isoformat()
    if not start_date:
        start_date = (datetime.now(timezone.utc).date() - timedelta(days=30)).isoformat()

    client = CostManagementClient(credential)
    scope = f"/subscriptions/{sub}"

    query = QueryDefinition(
        type="ActualCost",
        timeframe=TimeframeType.CUSTOM,
        time_period=QueryTimePeriod(
            from_property=datetime.fromisoformat(start_date),
            to=datetime.fromisoformat(end_date),
        ),
        dataset=QueryDataset(
            granularity="None",
            aggregation={
                "totalCost": QueryAggregation(name="PreTaxCost", function="Sum")
            },
            grouping=[QueryGrouping(type="Dimension", name="ServiceName")],
        ),
    )

    try:
        result = client.query.usage(scope=scope, parameters=query)
    except (AzureError, HttpResponseError) as exc:
        logger.error("Azure Cost Management error: %s", exc)
        raise RuntimeError(f"Azure Cost Management: {exc}") from exc

    by_service = []
    total = 0.0
    if result.rows:
        cols = [c.name for c in result.columns]
        cost_idx = next((i for i, c in enumerate(cols) if "Cost" in c or "cost" in c), 0)
        svc_idx = next((i for i, c in enumerate(cols) if "Service" in c or "service" in c), 1)
        for row in result.rows:
            svc = row[svc_idx]
            cost = float(row[cost_idx])
            total += cost
            by_service.append({"service": svc, "cost_usd": round(cost, 4)})

    by_service.sort(key=lambda x: x["cost_usd"], reverse=True)
    return {
        "start": start_date,
        "end": end_date,
        "total_cost_usd": round(total, 4),
        "by_service": by_service,
    }


# ─── Virtual Machines ─────────────────────────────────────────────────────────

# Azure VM size → approximate kWh/hour (from Azure sustainability docs)
AZURE_VM_ENERGY: dict[str, float] = {
    "Standard_B1s": 0.06, "Standard_B1ms": 0.10, "Standard_B2s": 0.16,
    "Standard_B2ms": 0.22, "Standard_B4ms": 0.38,
    "Standard_D2s_v3": 0.28, "Standard_D4s_v3": 0.50, "Standard_D8s_v3": 0.90,
    "Standard_D2s_v4": 0.26, "Standard_D4s_v4": 0.48,
    "Standard_D2s_v5": 0.24, "Standard_D4s_v5": 0.45,
    "Standard_E2s_v3": 0.32, "Standard_E4s_v3": 0.58,
    "Standard_F2s_v2": 0.22, "Standard_F4s_v2": 0.40,
    "Standard_NC6": 1.80, "Standard_NC12": 3.20, "Standard_NC24": 6.00,
}


def _vm_energy_per_hour(vm_size: str) -> float:
    energy = AZURE_VM_ENERGY.get(vm_size)
    if energy:
        return energy
    size_lower = vm_size.lower()
    if any(x in size_lower for x in ["b1s", "b1ls"]):
        return 0.06
    if "b1" in size_lower:
        return 0.10
    if "b2" in size_lower:
        return 0.18
    if "b4" in size_lower:
        return 0.35
    if "d2" in size_lower:
        return 0.28
    if "d4" in size_lower:
        return 0.50
    if "d8" in size_lower:
        return 0.90
    if "d16" in size_lower:
        return 1.60
    if "d32" in size_lower:
        return 3.00
    if "e2" in size_lower:
        return 0.32
    if "e4" in size_lower:
        return 0.58
    if "nc" in size_lower or "nd" in size_lower:
        return 2.50
    return 0.30


def fetch_azure_vms(
    subscription_id: Optional[str] = None,
    **cred_kwargs,
) -> list[dict]:
    """List all VMs across all resource groups with carbon estimates."""
    credential = _get_credential(**cred_kwargs)
    sub = _sub_id(subscription_id)
    compute_client = ComputeManagementClient(credential, sub)

    try:
        all_vms = list(compute_client.virtual_machines.list_all())
    except (AzureError, HttpResponseError) as exc:
        logger.error("Azure VM list error: %s", exc)
        raise RuntimeError(f"Azure VMs: {exc}") from exc

    results = []
    now = datetime.now(timezone.utc)

    for vm in all_vms:
        location = vm.location or "eastus"
        vm_size = vm.hardware_profile.vm_size if vm.hardware_profile else "Standard_D2s_v3"
        status = "unknown"

        # Get instance view to get power state
        try:
            rg = vm.id.split("/")[4]
            iv = compute_client.virtual_machines.instance_view(rg, vm.name)
            for stat in (iv.statuses or []):
                if stat.code and stat.code.startswith("PowerState/"):
                    status = stat.code.split("/")[1].lower()
        except Exception:
            pass

        usage_hours = 720.0 if status == "running" else 0.0
        kwh_per_hour = _vm_energy_per_hour(vm_size)
        energy_kwh = kwh_per_hour * usage_hours

        carbon_data = calculate_carbon(
            usage_hours=usage_hours,
            region=location,
            provider="azure",
            instance_type=vm_size,
            service_type="compute",
        )

        results.append({
            "provider": "azure",
            "service_type": "compute",
            "resource_id": vm.id,
            "resource_name": vm.name,
            "instance_type": vm_size,
            "region": location,
            "status": status,
            "usage_hours": usage_hours,
            "energy_kwh": carbon_data["energy_kwh"],
            "carbon_kg": carbon_data["carbon_kg"],
            "emission_factor": carbon_data["emission_factor"],
            "cost_usd": 0.0,
            "size_gb": 0.0,
        })
    return results


# ─── Storage Accounts ─────────────────────────────────────────────────────────

def fetch_azure_storage(
    subscription_id: Optional[str] = None,
    **cred_kwargs,
) -> list[dict]:
    """List Azure Storage Accounts with carbon estimates."""
    credential = _get_credential(**cred_kwargs)
    sub = _sub_id(subscription_id)
    storage_client = StorageManagementClient(credential, sub)

    try:
        accounts = list(storage_client.storage_accounts.list())
    except (AzureError, HttpResponseError) as exc:
        logger.error("Azure storage list error: %s", exc)
        raise RuntimeError(f"Azure Storage: {exc}") from exc

    results = []
    for acct in accounts:
        location = acct.location or "eastus"
        usage_hours = 720
        # Without Azure Monitor we can't get exact size; use a nominal 100 GB
        size_gb = 100.0

        carbon_data = calculate_carbon(
            usage_hours=usage_hours,
            region=location,
            provider="azure",
            size_gb=size_gb,
            service_type="storage",
        )
        results.append({
            "provider": "azure",
            "service_type": "storage",
            "resource_id": acct.id,
            "resource_name": acct.name,
            "instance_type": "blob_storage",
            "region": location,
            "status": "running",
            "usage_hours": usage_hours,
            "size_gb": size_gb,
            "energy_kwh": carbon_data["energy_kwh"],
            "carbon_kg": carbon_data["carbon_kg"],
            "emission_factor": carbon_data["emission_factor"],
            "cost_usd": 0.0,
        })
    return results


# ─── Combined ─────────────────────────────────────────────────────────────────

def fetch_azure_all(subscription_id: Optional[str] = None, **cred_kwargs) -> dict:
    errors = []
    vms, storage, costs = [], [], {}

    try:
        vms = fetch_azure_vms(subscription_id=subscription_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("Azure VM fetch failed: %s", e)

    try:
        storage = fetch_azure_storage(subscription_id=subscription_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("Azure storage fetch failed: %s", e)

    try:
        costs = fetch_azure_costs(subscription_id=subscription_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("Azure cost fetch failed: %s", e)

    all_resources = vms + storage
    total_carbon = round(sum(r["carbon_kg"] for r in all_resources), 4)
    total_energy = round(sum(r["energy_kwh"] for r in all_resources), 6)

    return {
        "provider": "azure",
        "subscription_id": subscription_id or settings.AZURE_SUBSCRIPTION_ID,
        "total_cost_usd": costs.get("total_cost_usd", 0.0),
        "cost_breakdown": costs.get("by_service", []),
        "total_carbon_kg": total_carbon,
        "total_energy_kwh": total_energy,
        "virtual_machines": vms,
        "storage_accounts": storage,
        "resources": all_resources,
        "errors": errors,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
# ─────────────────────────────────────────────
# 🔥 CHATBOT HELPER FUNCTION (ADD ONLY THIS)
# ─────────────────────────────────────────────
def get_running_vms(subscription_id=None, **cred_kwargs):
    """
    Returns ONLY running Azure VM names for chatbot usage
    """
    try:
        vms = fetch_azure_vms(subscription_id=subscription_id, **cred_kwargs)
    except Exception:
        return []

    running_vms = []

    for vm in vms:
        if vm.get("status") == "running":
            running_vms.append(vm.get("resource_name"))

    return running_vms

def stop_vm(vm_name, subscription_id=None, **cred_kwargs):
    from azure.mgmt.compute import ComputeManagementClient

    credential = _get_credential(**cred_kwargs)
    sub = _sub_id(subscription_id)

    compute_client = ComputeManagementClient(credential, sub)

    # ⚠️ need resource group
    # extracting from VM name won't work → for now assume default RG

    resource_group = "your-resource-group-name"

    compute_client.virtual_machines.begin_deallocate(resource_group, vm_name)