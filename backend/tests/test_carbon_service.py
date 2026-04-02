"""
tests/test_carbon_service.py
Unit tests for the carbon calculation engine.
Run with: pytest tests/
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.carbon_service import (
    calculate_carbon,
    calculate_total_carbon,
    calculate_carbon_saved,
    get_emission_factors_table,
    AWS_REGION_FACTORS,
    AZURE_REGION_FACTORS,
    GCP_REGION_FACTORS,
)


# ─── calculate_carbon ────────────────────────────────────────────────────────

class TestCalculateCarbon:
    def test_known_instance_known_region(self):
        result = calculate_carbon(
            usage_hours=720,
            region="us-east-1",
            provider="aws",
            instance_type="m5.large",
            service_type="compute",
        )
        # m5.large = 0.28 kWh/h, us-east-1 factor = 0.386
        expected_energy = 0.28 * 720
        expected_carbon = expected_energy * 0.386
        assert abs(result["energy_kwh"] - expected_energy) < 0.001
        assert abs(result["carbon_kg"] - expected_carbon) < 0.001
        assert result["emission_factor"] == 0.386

    def test_unknown_instance_fallback(self):
        result = calculate_carbon(
            usage_hours=100,
            region="us-east-1",
            provider="aws",
            instance_type="m99.custom",
            service_type="compute",
        )
        # Should use 0.30 kWh/h fallback for unknown "large-ish" type
        assert result["energy_kwh"] > 0
        assert result["carbon_kg"] > 0

    def test_unknown_region_uses_default(self):
        result = calculate_carbon(
            usage_hours=100,
            region="zz-unknown-99",
            provider="aws",
            instance_type="m5.large",
            service_type="compute",
        )
        assert result["emission_factor"] == 0.450  # default fallback

    def test_storage_service(self):
        result = calculate_carbon(
            usage_hours=720,
            region="us-east-1",
            provider="aws",
            size_gb=1000,
            service_type="storage",
        )
        expected_energy = 0.00000024 * 1000 * 720
        assert abs(result["energy_kwh"] - expected_energy) < 1e-6
        assert result["carbon_kg"] > 0

    def test_zero_hours_yields_zero_carbon(self):
        result = calculate_carbon(usage_hours=0, region="us-east-1", provider="aws")
        assert result["carbon_kg"] == 0.0
        assert result["energy_kwh"] == 0.0

    def test_azure_provider(self):
        result = calculate_carbon(
            usage_hours=100,
            region="eastus",
            provider="azure",
            instance_type="Standard_D4s_v3",
            service_type="compute",
        )
        assert result["emission_factor"] == AZURE_REGION_FACTORS["eastus"]
        assert result["carbon_kg"] > 0

    def test_gcp_provider(self):
        result = calculate_carbon(
            usage_hours=100,
            region="us-central1",
            provider="gcp",
            instance_type="n1-standard-4",
            service_type="compute",
        )
        assert result["emission_factor"] == GCP_REGION_FACTORS["us-central1"]

    def test_green_region_lower_carbon(self):
        """Stockholm (eu-north-1) should emit far less than Sydney (ap-southeast-2)."""
        green = calculate_carbon(720, "eu-north-1", "aws", "m5.large", service_type="compute")
        dirty = calculate_carbon(720, "ap-southeast-2", "aws", "m5.large", service_type="compute")
        assert green["carbon_kg"] < dirty["carbon_kg"]

    def test_gpu_instance_higher_energy(self):
        gpu = calculate_carbon(100, "us-east-1", "aws", "p3.8xlarge", service_type="compute")
        std = calculate_carbon(100, "us-east-1", "aws", "m5.large", service_type="compute")
        assert gpu["energy_kwh"] > std["energy_kwh"]


# ─── calculate_total_carbon ───────────────────────────────────────────────────

class TestCalculateTotalCarbon:
    def _make_service(self, rid, hours, region="us-east-1", status="running"):
        return {
            "provider": "aws",
            "service_type": "compute",
            "resource_id": rid,
            "resource_name": f"instance-{rid}",
            "instance_type": "m5.large",
            "region": region,
            "status": status,
            "usage_hours": hours,
            "cost_usd": 10.0,
            "size_gb": 0.0,
        }

    def test_empty_input(self):
        result = calculate_total_carbon([])
        assert result.total_carbon_kg == 0.0
        assert result.services == []

    def test_single_service(self):
        svc = self._make_service("i-001", 720)
        result = calculate_total_carbon([svc])
        assert result.total_carbon_kg > 0
        assert len(result.services) == 1
        assert result.total_cost_usd == 10.0

    def test_multiple_services_sum(self):
        services = [self._make_service(f"i-{i}", 100) for i in range(5)]
        result = calculate_total_carbon(services)
        expected = sum(s.carbon_kg for s in result.services)
        assert abs(result.total_carbon_kg - expected) < 0.0001

    def test_mixed_providers(self):
        services = [
            {**self._make_service("i-001", 100), "provider": "aws"},
            {**self._make_service("vm-001", 100), "provider": "azure", "region": "eastus"},
            {**self._make_service("gce-001", 100), "provider": "gcp", "region": "us-central1"},
        ]
        result = calculate_total_carbon(services)
        assert len(result.services) == 3
        assert result.total_carbon_kg > 0

    def test_stopped_service_zero_carbon(self):
        svc = self._make_service("i-stopped", 0, status="stopped")
        result = calculate_total_carbon([svc])
        assert result.total_carbon_kg == 0.0


# ─── calculate_carbon_saved ───────────────────────────────────────────────────

class TestCalculateCarbonSaved:
    def _svc(self, rid, hours, region="us-east-1"):
        return {
            "provider": "aws",
            "service_type": "compute",
            "resource_id": rid,
            "resource_name": f"inst-{rid}",
            "instance_type": "m5.large",
            "region": region,
            "status": "running",
            "usage_hours": hours,
        }

    def test_stopped_service_saves_all_carbon(self):
        prev = [self._svc("i-001", 720)]
        curr = []  # stopped
        result = calculate_carbon_saved(prev, curr)
        assert result["carbon_saved_kg"] > 0
        assert result["details"][0]["reason"] == "service_stopped"

    def test_reduced_usage_saves_delta(self):
        prev = [self._svc("i-001", 720)]
        curr = [self._svc("i-001", 360)]
        result = calculate_carbon_saved(prev, curr)
        assert result["carbon_saved_kg"] > 0
        assert result["details"][0]["reason"] == "usage_reduced"

    def test_same_usage_saves_nothing(self):
        prev = [self._svc("i-001", 720)]
        curr = [self._svc("i-001", 720)]
        result = calculate_carbon_saved(prev, curr)
        assert result["carbon_saved_kg"] == 0.0
        assert result["details"] == []

    def test_increased_usage_saves_nothing(self):
        prev = [self._svc("i-001", 100)]
        curr = [self._svc("i-001", 200)]
        result = calculate_carbon_saved(prev, curr)
        assert result["carbon_saved_kg"] == 0.0

    def test_empty_previous(self):
        result = calculate_carbon_saved([], [self._svc("i-001", 100)])
        assert result["carbon_saved_kg"] == 0.0

    def test_multiple_stopped(self):
        prev = [self._svc(f"i-{i}", 720) for i in range(3)]
        curr = []
        result = calculate_carbon_saved(prev, curr)
        assert len(result["details"]) == 3
        assert result["carbon_saved_kg"] > 0

    def test_partial_stop(self):
        prev = [self._svc("i-001", 720), self._svc("i-002", 720)]
        curr = [self._svc("i-001", 720)]  # i-002 stopped
        result = calculate_carbon_saved(prev, curr)
        # Only i-002 stopped
        assert len(result["details"]) == 1
        assert result["details"][0]["resource_id"] == "i-002"


# ─── Emission factors table ───────────────────────────────────────────────────

class TestEmissionFactors:
    def test_all_providers_present(self):
        table = get_emission_factors_table()
        assert "aws" in table
        assert "azure" in table
        assert "gcp" in table

    def test_factors_are_positive(self):
        table = get_emission_factors_table()
        for provider in ("aws", "azure", "gcp"):
            for region, factor in table[provider].items():
                assert factor > 0, f"{provider}/{region} factor must be positive"

    def test_key_regions_present(self):
        assert "us-east-1" in AWS_REGION_FACTORS
        assert "eu-north-1" in AWS_REGION_FACTORS
        assert "eastus" in AZURE_REGION_FACTORS
        assert "us-central1" in GCP_REGION_FACTORS


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
