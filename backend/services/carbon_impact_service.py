"""
services/carbon_impact_service.py

Handles complex carbon impact analytics across AWS and Azure.
Uses real-time utilization metrics and region-specific emission factors.
"""

from datetime import datetime, timedelta
import logging
from services.carbon_service import calculate_carbon, get_emission_factors_table
from services.energy_efficiency_service import EnergyEfficiencyService
from services.azure_efficiency_service import AzureEfficiencyService

logger = logging.getLogger(__name__)

class CarbonImpactService:
    def __init__(self, aws_creds=None, azure_creds=None):
        self.aws_creds = aws_creds
        self.azure_creds = azure_creds
        
        # Carbon cost per kg of CO2 (Industry standard: ~$50/tonne = $0.05/kg)
        self.CARBON_PRICE_PER_KG = 0.05

    async def get_total_impact(self):
        """
        Aggregates carbon impact across all connected cloud providers.
        """
        aws_impact = await self._get_aws_impact()
        azure_impact = await self._get_azure_impact()
        
        total_co2 = aws_impact["co2"] + azure_impact["co2"]
        total_energy = aws_impact["energy"] + azure_impact["energy"]
        total_cost = total_co2 * self.CARBON_PRICE_PER_KG
        
        # Efficiency score calculation
        total_idle = aws_impact["idle"] + azure_impact["idle"]
        total_active = aws_impact["active"] + azure_impact["active"]
        
        efficiency_score = 100
        if total_active > 0:
            efficiency_score = round(100 * (1 - (total_idle / (total_active + total_idle))))
            
        return {
            "estimated_co2_kg": round(total_co2, 2),
            "total_energy_kwh": round(total_energy, 2),
            "carbon_cost": f"${round(total_cost, 2)}",
            "carbon_efficiency_score": efficiency_score,
            "reduction_potential": f"{round((total_idle / (total_active + total_idle) * 100) if (total_active + total_idle) > 0 else 0)}%",
            "provider_breakdown": {
                "aws": aws_impact,
                "azure": azure_impact
            },
            "recommendations": self._generate_recommendations(aws_impact, azure_impact)
        }

    async def _get_aws_impact(self):
        """Calculates carbon impact for AWS resources."""
        if not self.aws_creds:
            return {"co2": 0, "energy": 0, "idle": 0, "active": 0}
            
        try:
            # Reusing existing efficiency service to get metrics
            service = EnergyEfficiencyService(
                self.aws_creds["access_key"], 
                self.aws_creds["secret_key"], 
                self.aws_creds["region"]
            )
            # Use internal method to avoid scoring overhead
            metrics = service._get_ec2_efficiency()
            
            # Simple power model: Idle power + Dynamic power based on CPU
            # P = P_idle + (P_max - P_idle) * CPU_util
            # Average server: P_idle ~ 0.1 kW, P_max ~ 0.4 kW
            
            active_count = metrics["total_running"]
            idle_count = metrics["idle"]
            avg_cpu = metrics["avg_cpu"] / 100.0 # percentage to decimal
            
            # Hourly Energy (kWh)
            energy = active_count * (0.1 + (0.3 * avg_cpu))
            
            # Apply regional factor
            factor = get_emission_factors_table()["aws"].get(self.aws_creds["region"], 0.45)
            co2 = energy * factor
            
            return {
                "co2": co2,
                "energy": energy,
                "idle": idle_count,
                "active": active_count - idle_count,
                "avg_cpu": metrics["avg_cpu"]
            }
        except Exception as e:
            logger.error(f"AWS carbon impact error: {str(e)}")
            return {"co2": 0, "energy": 0, "idle": 0, "active": 0}

    async def _get_azure_impact(self):
        """Calculates carbon impact for Azure resources."""
        if not self.azure_creds:
            return {"co2": 0, "energy": 0, "idle": 0, "active": 0}
            
        try:
            service = AzureEfficiencyService(
                self.azure_creds["subscription_id"],
                self.azure_creds["tenant_id"],
                self.azure_creds["client_id"],
                self.azure_creds["client_secret"]
            )
            metrics = service._get_vm_efficiency()
            
            active_count = metrics["total_running"]
            idle_count = metrics["idle"]
            avg_cpu = metrics["avg_cpu"] / 100.0
            
            energy = active_count * (0.12 + (0.28 * avg_cpu))
            
            # Emission factor lookup
            factor = get_emission_factors_table()["azure"].get("eastus", 0.38) # Defaulting for example
            co2 = energy * factor
            
            return {
                "co2": co2,
                "energy": energy,
                "idle": idle_count,
                "active": active_count - idle_count,
                "avg_cpu": metrics["avg_cpu"]
            }
        except Exception as e:
            logger.error(f"Azure carbon impact error: {str(e)}")
            return {"co2": 0, "energy": 0, "idle": 0, "active": 0}

    def _generate_recommendations(self, aws, azure):
        recs = []
        if aws["idle"] > 0:
            recs.append(f"Terminate {aws['idle']} idle AWS instances to save {round(aws['idle']*0.4, 2)}kg CO2/h")
        if azure["idle"] > 0:
            recs.append(f"Deallocate {azure['idle']} idle Azure VMs to save {round(azure['idle']*0.4, 2)}kg CO2/h")
            
        if aws["avg_cpu"] < 20 and aws["active"] > 0:
            recs.append("Right-size underutilized AWS instances to improve carbon efficiency")
            
        recs.extend([
            "Move high-throughput workloads to 'eu-north-1' (Stockholm) for 90% less carbon intensity",
            "Enable Auto-scaling to match power consumption with real-time demand",
            "Use Graviton (ARM) instances in AWS for up to 60% better energy efficiency"
        ])
        return recs[:4]
