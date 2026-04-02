"""
services/carbon_service.py

Carbon Emission Calculation System
===================================
Formula:  Carbon (kgCO2) = Energy (kWh) × Region Emission Factor

Energy estimation:
  - Compute instances (EC2 / Azure VM / GCP VM):  0.2 – 0.5 kWh/hour
    We use a tiered table based on instance size where available,
    defaulting to 0.3 kWh/hour for unknown sizes.
  - Storage (S3 / Blob / GCS):  ~0.00000024 kWh per GB-hour
    (industry average for cloud object storage)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Literal

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Region Emission Factors (kgCO2eq / kWh)
# Sources:
#   AWS  → https://docs.aws.amazon.com/whitepapers/latest/sustainability/
#   Azure→ https://azure.microsoft.com/en-us/blog/green-behind-the-cloud/
#   GCP  → https://cloud.google.com/sustainability/region-carbon
# Updated: 2024 — use latest official figures in production.
# ──────────────────────────────────────────────────────────────────────────────

AWS_REGION_FACTORS: dict[str, float] = {
    # North America
    "us-east-1":      0.386,   # N. Virginia
    "us-east-2":      0.410,   # Ohio
    "us-west-1":      0.350,   # N. California
    "us-west-2":      0.162,   # Oregon (heavy renewables)
    "ca-central-1":   0.130,   # Canada (hydro-heavy)
    "ca-west-1":      0.120,
    # Europe
    "eu-west-1":      0.316,   # Ireland
    "eu-west-2":      0.228,   # London
    "eu-west-3":      0.052,   # Paris (nuclear)
    "eu-central-1":   0.338,   # Frankfurt
    "eu-central-2":   0.030,
    "eu-north-1":     0.008,   # Stockholm (almost 100% renewables)
    "eu-south-1":     0.233,
    "eu-south-2":     0.180,
    # Asia Pacific
    "ap-southeast-1": 0.493,   # Singapore
    "ap-southeast-2": 0.760,   # Sydney
    "ap-southeast-3": 0.718,
    "ap-southeast-4": 0.560,
    "ap-northeast-1": 0.506,   # Tokyo
    "ap-northeast-2": 0.450,   # Seoul
    "ap-northeast-3": 0.506,   # Osaka
    "ap-south-1":     0.708,   # Mumbai
    "ap-south-2":     0.600,
    "ap-east-1":      0.453,   # Hong Kong
    # Middle East & Africa
    "me-south-1":     0.732,
    "me-central-1":   0.600,
    "af-south-1":     0.928,   # Cape Town
    # South America
    "sa-east-1":      0.074,   # São Paulo (hydro)
    # GovCloud
    "us-gov-east-1":  0.386,
    "us-gov-west-1":  0.350,
}

AZURE_REGION_FACTORS: dict[str, float] = {
    "eastus":           0.386,
    "eastus2":          0.386,
    "westus":           0.350,
    "westus2":          0.162,
    "westus3":          0.350,
    "centralus":        0.410,
    "northcentralus":   0.440,
    "southcentralus":   0.440,
    "westcentralus":    0.410,
    "northeurope":      0.316,   # Ireland
    "westeurope":       0.338,   # Netherlands
    "uksouth":          0.228,
    "ukwest":           0.228,
    "francecentral":    0.052,
    "francesouth":      0.052,
    "germanywestcentral": 0.338,
    "swedencentral":    0.008,
    "switzerlandnorth": 0.030,
    "norwayeast":       0.008,
    "polandcentral":    0.700,
    "eastasia":         0.453,
    "southeastasia":    0.493,
    "japaneast":        0.506,
    "japanwest":        0.506,
    "australiaeast":    0.760,
    "australiasoutheast": 0.760,
    "brazilsouth":      0.074,
    "southafricanorth": 0.928,
    "uaenorth":         0.732,
    "centralindia":     0.708,
    "southindia":       0.708,
    "westindia":        0.708,
    "koreacentral":     0.450,
    "koreasouth":       0.450,
    "canadacentral":    0.130,
    "canadaeast":       0.130,
}

GCP_REGION_FACTORS: dict[str, float] = {
    "us-central1":       0.410,  # Iowa
    "us-east1":          0.386,
    "us-east4":          0.386,
    "us-east5":          0.386,
    "us-south1":         0.440,
    "us-west1":          0.068,  # Oregon (high renewables)
    "us-west2":          0.350,
    "us-west3":          0.350,
    "us-west4":          0.350,
    "northamerica-northeast1": 0.013,  # Montréal
    "northamerica-northeast2": 0.013,
    "southamerica-east1": 0.074,
    "southamerica-west1": 0.180,
    "europe-west1":      0.180,  # Belgium
    "europe-west2":      0.228,
    "europe-west3":      0.338,
    "europe-west4":      0.390,
    "europe-west6":      0.030,
    "europe-west8":      0.233,
    "europe-west9":      0.052,
    "europe-west10":     0.700,
    "europe-west12":     0.233,
    "europe-central2":   0.700,
    "europe-north1":     0.008,
    "europe-southwest1": 0.180,
    "asia-east1":        0.453,
    "asia-east2":        0.453,
    "asia-northeast1":   0.506,
    "asia-northeast2":   0.506,
    "asia-northeast3":   0.450,
    "asia-south1":       0.708,
    "asia-south2":       0.600,
    "asia-southeast1":   0.493,
    "asia-southeast2":   0.718,
    "australia-southeast1": 0.760,
    "australia-southeast2": 0.560,
    "me-west1":          0.732,
    "me-central1":       0.600,
    "africa-south1":     0.928,
}

DEFAULT_EMISSION_FACTOR = 0.450  # kgCO2/kWh — global average fallback

# ──────────────────────────────────────────────────────────────────────────────
# Energy per instance-hour (kWh)
# Derived from published TDP / PUE data.  Defaults to 0.3 for unknown sizes.
# ──────────────────────────────────────────────────────────────────────────────

# AWS EC2 instance family → kWh/hour
EC2_ENERGY_MAP: dict[str, float] = {
    # Micro / Nano
    "t2.nano": 0.05, "t2.micro": 0.10, "t2.small": 0.13, "t2.medium": 0.20,
    "t3.nano": 0.04, "t3.micro": 0.08, "t3.small": 0.12, "t3.medium": 0.18,
    "t3.large": 0.24, "t3.xlarge": 0.32, "t3.2xlarge": 0.48,
    "t3a.nano": 0.04, "t3a.micro": 0.08, "t3a.small": 0.11, "t3a.medium": 0.17,
    # General Purpose M
    "m5.large": 0.28, "m5.xlarge": 0.40, "m5.2xlarge": 0.60,
    "m5.4xlarge": 0.90, "m5.8xlarge": 1.40, "m5.12xlarge": 2.10,
    "m5.16xlarge": 2.80, "m5.24xlarge": 3.50,
    "m6i.large": 0.26, "m6i.xlarge": 0.38, "m6i.2xlarge": 0.56,
    "m6i.4xlarge": 0.85, "m6i.8xlarge": 1.30,
    "m7i.large": 0.24, "m7i.xlarge": 0.35, "m7i.2xlarge": 0.52,
    # Compute Optimised C
    "c5.large": 0.26, "c5.xlarge": 0.38, "c5.2xlarge": 0.56,
    "c5.4xlarge": 0.84, "c5.9xlarge": 1.60, "c5.18xlarge": 2.80,
    "c6i.large": 0.24, "c6i.xlarge": 0.35, "c6i.2xlarge": 0.52,
    # Memory Optimised R
    "r5.large": 0.30, "r5.xlarge": 0.45, "r5.2xlarge": 0.70,
    "r5.4xlarge": 1.10, "r5.8xlarge": 1.80,
    "r6i.large": 0.28, "r6i.xlarge": 0.42, "r6i.2xlarge": 0.65,
    # GPU
    "p3.2xlarge": 1.80, "p3.8xlarge": 5.00, "p3.16xlarge": 9.00,
    "p4d.24xlarge": 18.00,
    "g4dn.xlarge": 1.00, "g4dn.2xlarge": 1.40, "g4dn.4xlarge": 2.00,
}

# Storage energy (kWh per GB per hour)
STORAGE_ENERGY_PER_GB_HOUR = 0.00000024


@dataclass
class ServiceCarbonResult:
    """Carbon breakdown for a single service / resource."""
    provider: str
    service_type: str          # EC2 | VM | S3 | AzureBlob | GCSBucket | etc.
    resource_id: str
    resource_name: str
    region: str
    status: str                # running | stopped
    usage_hours: float
    energy_kwh: float
    carbon_kg: float
    emission_factor: float
    cost_usd: float = 0.0
    carbon_saved_kg: float = 0.0   # filled in by calculate_carbon_saved


@dataclass
class TotalCarbonResult:
    """Aggregate result across all services."""
    total_carbon_kg: float
    total_carbon_saved_kg: float
    total_energy_kwh: float
    total_cost_usd: float
    services: list[ServiceCarbonResult] = field(default_factory=list)


# ──────────────────────────────────────────────────────────────────────────────
# Core functions
# ──────────────────────────────────────────────────────────────────────────────

def _get_emission_factor(
    region: str,
    provider: Literal["aws", "azure", "gcp"],
) -> float:
    """Return kgCO2/kWh for the given region and provider."""
    region_lower = (region or "").lower()
    factor_map = {
        "aws":   AWS_REGION_FACTORS,
        "azure": AZURE_REGION_FACTORS,
        "gcp":   GCP_REGION_FACTORS,
    }.get(provider, {})
    factor = factor_map.get(region_lower)
    if factor is None:
        logger.warning(
            "No emission factor for provider=%s region=%s — using global default %.3f",
            provider, region, DEFAULT_EMISSION_FACTOR,
        )
        return DEFAULT_EMISSION_FACTOR
    return factor


def _estimate_compute_energy(instance_type: str, usage_hours: float) -> float:
    """
    Return estimated energy (kWh) for a compute instance.

    Falls back to tiered defaults if instance type is not in the lookup table:
      • nano/micro          → 0.10 kWh/h
      • small               → 0.15 kWh/h
      • medium              → 0.22 kWh/h
      • large               → 0.30 kWh/h  (default)
      • xlarge              → 0.45 kWh/h
      • 2xlarge+            → 0.65 kWh/h
      • 4xlarge+            → 1.00 kWh/h
      • 8xlarge+            → 1.80 kWh/h
      • 16xlarge+           → 3.00 kWh/h
    """
    itype = (instance_type or "").lower()
    kwh_per_hour = EC2_ENERGY_MAP.get(itype)
    if kwh_per_hour is None:
        if "nano" in itype:
            kwh_per_hour = 0.10
        elif "micro" in itype:
            kwh_per_hour = 0.10
        elif "small" in itype:
            kwh_per_hour = 0.15
        elif "medium" in itype:
            kwh_per_hour = 0.22
        elif "16xlarge" in itype or "24xlarge" in itype or "metal" in itype:
            kwh_per_hour = 3.00
        elif "8xlarge" in itype or "9xlarge" in itype or "12xlarge" in itype:
            kwh_per_hour = 1.80
        elif "4xlarge" in itype:
            kwh_per_hour = 1.00
        elif "2xlarge" in itype:
            kwh_per_hour = 0.65
        elif "xlarge" in itype:
            kwh_per_hour = 0.45
        elif "large" in itype:
            kwh_per_hour = 0.30
        else:
            kwh_per_hour = 0.30  # universal fallback
    return kwh_per_hour * usage_hours


def _estimate_storage_energy(size_gb: float, usage_hours: float) -> float:
    """Return estimated energy (kWh) for object/block storage."""
    return STORAGE_ENERGY_PER_GB_HOUR * size_gb * usage_hours


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def calculate_carbon(
    usage_hours: float,
    region: str,
    provider: Literal["aws", "azure", "gcp"] = "aws",
    instance_type: str = "m5.large",
    size_gb: float = 0.0,
    service_type: str = "compute",
) -> dict:
    """
    Calculate carbon for a single service instance.

    Parameters
    ----------
    usage_hours   : hours the resource was running
    region        : cloud region identifier
    provider      : aws | azure | gcp
    instance_type : EC2/VM instance type string (compute only)
    size_gb       : storage size in GiB (storage only)
    service_type  : 'compute' | 'storage'

    Returns
    -------
    dict with keys: energy_kwh, carbon_kg, emission_factor
    """
    factor = _get_emission_factor(region, provider)
    if service_type == "storage":
        energy_kwh = _estimate_storage_energy(size_gb, usage_hours)
    else:
        energy_kwh = _estimate_compute_energy(instance_type, usage_hours)

    carbon_kg = energy_kwh * factor
    return {
        "energy_kwh": round(energy_kwh, 6),
        "carbon_kg": round(carbon_kg, 6),
        "emission_factor": factor,
    }


def calculate_total_carbon(all_services: list[dict]) -> TotalCarbonResult:
    """
    Aggregate carbon across all service records.

    Each record in all_services should be a dict with at minimum:
      provider, service_type, resource_id, resource_name, region,
      status, usage_hours, cost_usd
    Optional: instance_type, size_gb
    """
    service_results: list[ServiceCarbonResult] = []
    total_carbon = 0.0
    total_energy = 0.0
    total_cost = 0.0

    for svc in all_services:
        provider = svc.get("provider", "aws")
        region = svc.get("region", "")
        usage_hours = float(svc.get("usage_hours", 0))
        service_type = svc.get("service_type", "compute")
        instance_type = svc.get("instance_type", "m5.large")
        size_gb = float(svc.get("size_gb", 0))
        cost_usd = float(svc.get("cost_usd", 0))

        calc = calculate_carbon(
            usage_hours=usage_hours,
            region=region,
            provider=provider,
            instance_type=instance_type,
            size_gb=size_gb,
            service_type=service_type,
        )

        result = ServiceCarbonResult(
            provider=provider,
            service_type=service_type,
            resource_id=svc.get("resource_id", ""),
            resource_name=svc.get("resource_name", ""),
            region=region,
            status=svc.get("status", "running"),
            usage_hours=usage_hours,
            energy_kwh=calc["energy_kwh"],
            carbon_kg=calc["carbon_kg"],
            emission_factor=calc["emission_factor"],
            cost_usd=cost_usd,
        )
        service_results.append(result)
        total_carbon += calc["carbon_kg"]
        total_energy += calc["energy_kwh"]
        total_cost += cost_usd

    return TotalCarbonResult(
        total_carbon_kg=round(total_carbon, 4),
        total_carbon_saved_kg=0.0,
        total_energy_kwh=round(total_energy, 6),
        total_cost_usd=round(total_cost, 4),
        services=service_results,
    )


def calculate_carbon_saved(
    previous_usage: list[dict],
    current_usage: list[dict],
) -> dict:
    """
    Compare previous vs current usage and compute carbon saved.

    Logic
    -----
    • If a resource that previously existed is now absent (stopped) →
        assume the previous average usage hours and calculate
        carbon that *would* have been emitted.
    • If usage hours have been reduced →
        delta = previous_carbon - current_carbon

    Returns
    -------
    {
        "carbon_saved_kg": float,
        "details": [{"resource_id": ..., "saved_kg": ..., "reason": ...}]
    }
    """
    # Build lookup: resource_id → carbon_kg for previous period
    prev_by_id: dict[str, dict] = {r.get("resource_id", ""): r for r in previous_usage}
    curr_by_id: dict[str, dict] = {r.get("resource_id", ""): r for r in current_usage}

    total_saved = 0.0
    details = []

    # Resources that existed before
    for rid, prev_svc in prev_by_id.items():
        provider = prev_svc.get("provider", "aws")
        region = prev_svc.get("region", "")
        service_type = prev_svc.get("service_type", "compute")
        instance_type = prev_svc.get("instance_type", "m5.large")
        size_gb = float(prev_svc.get("size_gb", 0))
        prev_hours = float(prev_svc.get("usage_hours", 0))

        prev_calc = calculate_carbon(prev_hours, region, provider, instance_type, size_gb, service_type)
        prev_carbon = prev_calc["carbon_kg"]

        if rid not in curr_by_id:
            # Resource was stopped / removed
            saved = prev_carbon
            reason = "service_stopped"
        else:
            curr_svc = curr_by_id[rid]
            curr_hours = float(curr_svc.get("usage_hours", 0))
            curr_calc = calculate_carbon(curr_hours, region, provider, instance_type, size_gb, service_type)
            curr_carbon = curr_calc["carbon_kg"]
            saved = max(0.0, prev_carbon - curr_carbon)
            reason = "usage_reduced" if saved > 0 else "no_reduction"

        if saved > 0:
            total_saved += saved
            details.append({
                "resource_id": rid,
                "resource_name": prev_svc.get("resource_name", ""),
                "provider": provider,
                "saved_kg": round(saved, 6),
                "reason": reason,
            })

    return {
        "carbon_saved_kg": round(total_saved, 4),
        "details": details,
    }


def get_emission_factors_table() -> dict:
    """Return all region → factor maps (useful for UI display)."""
    return {
        "aws":   AWS_REGION_FACTORS,
        "azure": AZURE_REGION_FACTORS,
        "gcp":   GCP_REGION_FACTORS,
        "default": DEFAULT_EMISSION_FACTOR,
    }
