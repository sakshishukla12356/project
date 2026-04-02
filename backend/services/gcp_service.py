"""
services/gcp_service.py

Real GCP integration via google-cloud-* SDKs.
Fetches Compute Engine instances, GCS buckets, and Cloud Billing costs.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone, timedelta, date
from typing import Optional

import google.auth
from google.oauth2 import service_account
from google.cloud import compute_v1, storage
from google.cloud import billing_v1
from google.api_core.exceptions import GoogleAPICallError

from config.settings import get_settings
from services.carbon_service import calculate_carbon

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_credentials(key_file: Optional[str] = None):
    """
    Return Google credentials.
    Uses explicit service-account JSON if provided, else ADC.
    """
    key_path = key_file or settings.GOOGLE_APPLICATION_CREDENTIALS
    if key_path and os.path.isfile(key_path):
        return service_account.Credentials.from_service_account_file(
            key_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    return creds


def _project_id(project_id: Optional[str] = None) -> str:
    pid = project_id or settings.GCP_PROJECT_ID
    if not pid:
        raise RuntimeError("GCP_PROJECT_ID is not configured.")
    return pid


# ─── Cloud Billing ────────────────────────────────────────────────────────────

def fetch_gcp_costs(
    billing_account_id: Optional[str] = None,
    project_id: Optional[str] = None,
    **cred_kwargs,
) -> dict:
    """
    Fetch GCP costs via Cloud Billing API for the current month.

    NOTE: The Cloud Billing API returns budget/account-level data.
    For per-project cost breakdown, BigQuery billing export is required.
    This function returns what is available via the public API.
    """
    end_date = date.today().isoformat()
    start_date = (date.today().replace(day=1)).isoformat()

    bid = billing_account_id or settings.GCP_BILLING_ACCOUNT_ID
    pid = _project_id(project_id)

    credentials = _get_credentials(**cred_kwargs)
    billing_client = billing_v1.CloudBillingClient(credentials=credentials)

    try:
        account_name = f"billingAccounts/{bid}" if bid else None
        # List projects associated with the billing account
        if account_name:
            projects = list(
                billing_client.list_project_billing_info(name=account_name)
            )
        else:
            projects = []
    except GoogleAPICallError as exc:
        logger.error("GCP Billing API error: %s", exc)
        raise RuntimeError(f"GCP Billing: {exc}") from exc

    return {
        "start": start_date,
        "end": end_date,
        "total_cost_usd": 0.0,   # Detailed cost requires BigQuery billing export
        "by_service": [],
        "note": (
            "Detailed per-service cost breakdown requires Cloud Billing → BigQuery export. "
            "Configure GCP_BILLING_ACCOUNT_ID and enable BigQuery billing export for full data."
        ),
        "billing_account": bid,
        "project_id": pid,
        "linked_projects": [p.project_id for p in projects],
    }


# ─── Compute Engine ───────────────────────────────────────────────────────────

# GCP machine type → kWh/hour (from Google Carbon Footprint API data)
GCP_MACHINE_ENERGY: dict[str, float] = {
    "e2-micro": 0.05, "e2-small": 0.08, "e2-medium": 0.14,
    "e2-standard-2": 0.22, "e2-standard-4": 0.40, "e2-standard-8": 0.75,
    "e2-standard-16": 1.40, "e2-standard-32": 2.60,
    "e2-highmem-2": 0.26, "e2-highmem-4": 0.48,
    "n1-standard-1": 0.18, "n1-standard-2": 0.30, "n1-standard-4": 0.55,
    "n1-standard-8": 1.00, "n1-standard-16": 1.90, "n1-standard-32": 3.60,
    "n1-standard-64": 7.00, "n1-standard-96": 10.50,
    "n2-standard-2": 0.28, "n2-standard-4": 0.52, "n2-standard-8": 0.96,
    "n2-standard-16": 1.80, "n2-standard-32": 3.40,
    "n2d-standard-2": 0.26, "n2d-standard-4": 0.48, "n2d-standard-8": 0.90,
    "c2-standard-4": 0.50, "c2-standard-8": 0.95, "c2-standard-16": 1.80,
    "c2-standard-30": 3.30, "c2-standard-60": 6.50,
    "a2-highgpu-1g": 2.50, "a2-highgpu-2g": 5.00, "a2-highgpu-4g": 10.00,
    "a2-highgpu-8g": 20.00,
}


def _gcp_machine_energy(machine_type: str) -> float:
    mt = machine_type.split("/")[-1].lower()
    energy = GCP_MACHINE_ENERGY.get(mt)
    if energy:
        return energy
    if "micro" in mt:
        return 0.05
    if "small" in mt:
        return 0.08
    if "medium" in mt:
        return 0.14
    if "-2" in mt:
        return 0.28
    if "-4" in mt:
        return 0.52
    if "-8" in mt:
        return 0.96
    if "-16" in mt:
        return 1.80
    if "-32" in mt:
        return 3.40
    if "-64" in mt:
        return 6.80
    if "a2" in mt or "gpu" in mt:
        return 5.00
    return 0.30


def fetch_gcp_instances(
    project_id: Optional[str] = None,
    zone: Optional[str] = None,
    **cred_kwargs,
) -> list[dict]:
    """
    List all GCE instances in the project (all zones or specific zone).
    Returns carbon-service-compatible dicts.
    """
    pid = _project_id(project_id)
    credentials = _get_credentials(**cred_kwargs)
    instance_client = compute_v1.InstancesClient(credentials=credentials)

    results = []
    now = datetime.now(timezone.utc)

    try:
        if zone:
            pages = [instance_client.list(project=pid, zone=zone)]
        else:
            # Aggregated list across all zones
            agg = instance_client.aggregated_list(project=pid)
            pages = [items for _, items in agg if hasattr(items, "instances") and items.instances]

        for page in pages:
            instances = page.instances if hasattr(page, "instances") else page
            for inst in instances:
                # Extract zone from selfLink or name
                self_link = inst.self_link or ""
                zone_name = self_link.split("/zones/")[1].split("/")[0] if "/zones/" in self_link else "us-central1-a"
                region = "-".join(zone_name.split("-")[:2])  # us-central1-a → us-central1

                state = inst.status.lower() if inst.status else "unknown"
                machine_type = inst.machine_type or "n1-standard-2"

                # Creation timestamp
                creation_ts = inst.creation_timestamp
                if creation_ts and state == "running":
                    try:
                        ct = datetime.fromisoformat(creation_ts.replace("Z", "+00:00"))
                        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        effective_start = max(ct, month_start)
                        usage_hours = (now - effective_start).total_seconds() / 3600
                    except Exception:
                        usage_hours = 720.0
                else:
                    usage_hours = 0.0

                carbon_data = calculate_carbon(
                    usage_hours=usage_hours,
                    region=region,
                    provider="gcp",
                    instance_type=machine_type,
                    service_type="compute",
                )

                results.append({
                    "provider": "gcp",
                    "service_type": "compute",
                    "resource_id": str(inst.id),
                    "resource_name": inst.name,
                    "instance_type": machine_type,
                    "region": region,
                    "zone": zone_name,
                    "status": state,
                    "usage_hours": round(usage_hours, 2),
                    "energy_kwh": carbon_data["energy_kwh"],
                    "carbon_kg": carbon_data["carbon_kg"],
                    "emission_factor": carbon_data["emission_factor"],
                    "cost_usd": 0.0,
                    "size_gb": 0.0,
                })
    except GoogleAPICallError as exc:
        logger.error("GCP Compute list error: %s", exc)
        raise RuntimeError(f"GCP Compute: {exc}") from exc

    return results


# ─── GCS Buckets ─────────────────────────────────────────────────────────────

def fetch_gcs_buckets(
    project_id: Optional[str] = None,
    **cred_kwargs,
) -> list[dict]:
    """List GCS buckets with storage size and carbon estimates."""
    pid = _project_id(project_id)
    credentials = _get_credentials(**cred_kwargs)
    gcs_client = storage.Client(project=pid, credentials=credentials)

    results = []
    try:
        buckets = list(gcs_client.list_buckets())
    except GoogleAPICallError as exc:
        logger.error("GCS list_buckets error: %s", exc)
        raise RuntimeError(f"GCS: {exc}") from exc

    for bucket in buckets:
        bucket_location = (bucket.location or "US").lower()
        # Map multi-region to a specific region for carbon calculation
        region_map = {
            "us": "us-central1", "eu": "europe-west1",
            "asia": "asia-east1", "nam4": "us-central1",
            "eur4": "europe-north1",
        }
        region = region_map.get(bucket_location, bucket_location)

        # Get total size via bucket IAM / metrics is not directly available in the client lib
        # Use list_blobs with fields to estimate size (limited by quota)
        size_bytes = 0.0
        try:
            blobs = gcs_client.list_blobs(bucket.name, fields="items(size),nextPageToken")
            for blob in blobs:
                size_bytes += blob.size or 0
        except Exception as exc:
            logger.debug("GCS size estimation for %s failed: %s", bucket.name, exc)

        size_gb = size_bytes / (1024 ** 3)
        usage_hours = 720
        carbon_data = calculate_carbon(
            usage_hours=usage_hours,
            region=region,
            provider="gcp",
            size_gb=size_gb,
            service_type="storage",
        )

        results.append({
            "provider": "gcp",
            "service_type": "storage",
            "resource_id": f"gs://{bucket.name}",
            "resource_name": bucket.name,
            "instance_type": "gcs",
            "region": region,
            "status": "running",
            "usage_hours": usage_hours,
            "size_gb": round(size_gb, 4),
            "energy_kwh": carbon_data["energy_kwh"],
            "carbon_kg": carbon_data["carbon_kg"],
            "emission_factor": carbon_data["emission_factor"],
            "cost_usd": 0.0,
        })
    return results


# ─── Combined ─────────────────────────────────────────────────────────────────

def fetch_gcp_all(project_id: Optional[str] = None, **cred_kwargs) -> dict:
    errors = []
    instances, buckets, costs = [], [], {}

    try:
        instances = fetch_gcp_instances(project_id=project_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("GCP instance fetch failed: %s", e)

    try:
        buckets = fetch_gcs_buckets(project_id=project_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("GCS bucket fetch failed: %s", e)

    try:
        costs = fetch_gcp_costs(project_id=project_id, **cred_kwargs)
    except RuntimeError as e:
        errors.append(str(e))
        logger.warning("GCP cost fetch failed: %s", e)

    all_resources = instances + buckets
    total_carbon = round(sum(r["carbon_kg"] for r in all_resources), 4)
    total_energy = round(sum(r["energy_kwh"] for r in all_resources), 6)

    return {
        "provider": "gcp",
        "project_id": _project_id(project_id) if (project_id or settings.GCP_PROJECT_ID) else None,
        "total_cost_usd": costs.get("total_cost_usd", 0.0),
        "cost_breakdown": costs.get("by_service", []),
        "total_carbon_kg": total_carbon,
        "total_energy_kwh": total_energy,
        "compute_instances": instances,
        "gcs_buckets": buckets,
        "resources": all_resources,
        "errors": errors,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
