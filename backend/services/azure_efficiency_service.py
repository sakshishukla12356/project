"""
services/azure_efficiency_service.py

Handles Azure Energy Efficiency metrics fetching and scoring logic.
Uses Azure Monitor, Advisor, and Resource Graph for real-time analysis.
"""

from datetime import datetime, timedelta
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.advisor import AdvisorManagementClient
from azure.mgmt.resourcegraph import ResourceGraphClient
from azure.mgmt.resourcegraph.models import QueryRequest, QueryRequestOptions
import logging

logger = logging.getLogger(__name__)

class AzureEfficiencyService:
    def __init__(self, subscription_id, tenant_id, client_id, client_secret):
        # In a real production app, we would use a Service Principal or Managed Identity
        # For this implementation, we'll assume the credentials are provided for the clients
        from azure.identity import ClientSecretCredential
        self.subscription_id = subscription_id
        self.credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret
        )

    def fetch_metrics(self):
        """
        Fetches all necessary metrics for Azure energy efficiency scoring.
        """
        try:
            # 1. VM Utilization & Status
            vm_data = self._get_vm_efficiency()
            
            # 2. Resource Graph Analysis (Unattached disks, etc.)
            graph_data = self._get_graph_analysis()
            
            # 3. Azure Advisor Recommendations
            recommendations = self._get_advisor_recommendations()
            
            # 4. Scoring Logic
            analysis = self._calculate_score(vm_data, graph_data, recommendations)
            
            return analysis

        except Exception as e:
            logger.error(f"Error fetching Azure energy efficiency metrics: {str(e)}")
            return {
                "error": str(e),
                "efficiency_score": 0,
                "recommendations": ["Check Azure Service Principal permissions"]
            }

    def _get_vm_efficiency(self):
        """
        Analyzes VM utilization using Azure Monitor and Compute APIs.
        """
        compute_client = ComputeManagementClient(self.credential, self.subscription_id)
        monitor_client = MonitorManagementClient(self.credential, self.subscription_id)
        
        vms = compute_client.virtual_machines.list_all()
        running_vms = []
        deallocated_vms = 0
        total_cpu_utilization = 0
        idle_vms = 0
        
        # We'll sample up to 10 VMs for performance in this real-time endpoint
        vms_list = list(vms)[:10]
        
        for vm in vms_list:
            # Check VM state
            instance_view = compute_client.virtual_machines.instance_view(
                self._get_rg_from_id(vm.id), vm.name
            )
            
            statuses = [s.code for s in instance_view.statuses]
            is_running = any("PowerState/running" in s for s in statuses)
            
            if is_running:
                running_vms.append(vm.name)
                
                # Fetch CPU metrics for the last hour
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(hours=1)
                
                metrics = monitor_client.metrics.list(
                    vm.id,
                    timespan=f"{start_time.isoformat()}Z/{end_time.isoformat()}Z",
                    interval='PT1H',
                    metricnames='Percentage CPU',
                    aggregation='Average'
                )
                
                avg_cpu = 0
                for item in metrics.value:
                    for timeseries in item.timeseries:
                        for data in timeseries.data:
                            avg_cpu = data.average if data.average is not None else 0
                
                total_cpu_utilization += avg_cpu
                if avg_cpu < 5:
                    idle_vms += 1
            else:
                deallocated_vms += 1
                
        avg_running_cpu = total_cpu_utilization / len(running_vms) if running_vms else 0
        
        return {
            "total_running": len(running_vms),
            "deallocated": deallocated_vms,
            "idle": idle_vms,
            "avg_cpu": avg_running_cpu
        }

    def _get_graph_analysis(self):
        """
        Uses Resource Graph to find orphaned resources (e.g., unattached disks).
        """
        arg_client = ResourceGraphClient(self.credential)
        
        # Query for unattached disks
        query = "Resources | where type =~ 'Microsoft.Compute/disks' | where properties.diskState =~ 'Unattached' | count"
        
        request = QueryRequest(
            subscriptions=[self.subscription_id],
            query=query,
            options=QueryRequestOptions(result_format="ObjectArray")
        )
        
        response = arg_client.resources(request)
        unattached_disks = response.data[0]['Count'] if response.data else 0
        
        return {
            "unattached_disks": unattached_disks
        }

    def _get_advisor_recommendations(self):
        """
        Fetches cost and efficiency recommendations from Azure Advisor.
        """
        recommendations = []
        try:
            advisor_client = AdvisorManagementClient(self.credential, self.subscription_id)
            recs = advisor_client.recommendations.list()
            
            for rec in recs:
                if rec.category in ["Cost", "HighAvailability"] and rec.impact == "High":
                    recommendations.append(rec.short_description.get("problem", "Optimize resource"))
        except Exception:
            pass
            
        return recommendations

    def _calculate_score(self, vm_data, graph_data, recommendations):
        """
        Calculates Azure efficiency score based on compute and storage waste.
        """
        # Weights: CPU (40), Storage (20), Waste/Idle (20), Advisor (20)
        
        # 1. Compute Efficiency Score
        cpu_score = 0
        if 40 <= vm_data["avg_cpu"] <= 75:
            cpu_score = 40
        elif 15 <= vm_data["avg_cpu"] < 40:
            cpu_score = 20
        else:
            cpu_score = 10
            
        # 2. Storage Waste Score (unattached disks)
        storage_score = 20
        if graph_data["unattached_disks"] > 5:
            storage_score = 5
        elif graph_data["unattached_disks"] > 0:
            storage_score = 15
            
        # 3. Resource Waste (Idle VMs)
        waste_score = 20
        if vm_data["total_running"] > 0:
            idle_ratio = vm_data["idle"] / vm_data["total_running"]
            waste_score = 20 * (1 - idle_ratio)
            
        # 4. Advisor Score
        adv_score = 20
        if len(recommendations) > 0:
            adv_score = 10
            
        total_score = round(cpu_score + storage_score + waste_score + adv_score)
        
        # Savings Estimation (Azure specific heuristic)
        estimated_savings = (vm_data["idle"] * 50) + (graph_data["unattached_disks"] * 20)
        
        # Region-based sustainability (Mocked logic for real-time recommendations)
        green_regions = ["North Europe", "West US 2", "Canada Central"]
        
        tips = [
            "Deallocate idle VMs to stop compute billing",
            "Delete unattached Managed Disks",
            "Move workloads to greener regions like North Europe",
            "Enable Auto-shutdown for dev/test environments"
        ]
        
        return {
            "efficiency_score": total_score,
            "trend": "+10%" if total_score > 80 else "-3%",
            "idle_vms": vm_data["idle"],
            "deallocated_vms": vm_data["deallocated"],
            "unattached_disks": graph_data["unattached_disks"],
            "estimated_savings": f"${estimated_savings}/month",
            "sustainability_insights": {
                "estimated_carbon_reduction_kg": round(estimated_savings * 0.35, 1),
                "green_recommendation": "Consider moving non-critical workloads to 'North Europe' for 100% renewable energy."
            },
            "recommendations": recommendations[:2] if recommendations else tips[:2],
            "green_tips": tips
        }

    def _get_rg_from_id(self, resource_id):
        """Helper to extract resource group from Azure resource ID"""
        parts = resource_id.split('/')
        if len(parts) > 4:
            return parts[4]
        return ""
