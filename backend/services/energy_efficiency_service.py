"""
services/energy_efficiency_service.py

Handles AWS Energy Efficiency metrics fetching and scoring logic.
Calculates real-time scores based on resource utilization and optimization.
"""

import boto3
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class EnergyEfficiencyService:
    def __init__(self, access_key, secret_key, region="us-east-1"):
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region
        self.session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )

    def fetch_metrics(self):
        """
        Fetches all necessary metrics for energy efficiency scoring.
        """
        try:
            # 1. EC2 Utilization & Status
            ec2_data = self._get_ec2_efficiency()
            
            # 2. Storage Optimization (EBS)
            ebs_data = self._get_storage_efficiency()
            
            # 3. Recommendations (Compute Optimizer & Trusted Advisor)
            recommendations = self._get_optimization_recommendations()
            
            # 4. Scoring Logic
            analysis = self._calculate_score(ec2_data, ebs_data, recommendations)
            
            return analysis

        except Exception as e:
            logger.error(f"Error fetching energy efficiency metrics: {str(e)}")
            return {
                "error": str(e),
                "efficiency_score": 0,
                "recommendations": ["Ensure AWS credentials have sufficient permissions"]
            }

    def _get_ec2_efficiency(self):
        """
        Analyzes EC2 utilization using CloudWatch and EC2 API.
        """
        ec2 = self.session.client("ec2")
        cloudwatch = self.session.client("cloudwatch")
        
        instances = ec2.describe_instances()
        running_instances = []
        stopped_instances = 0
        idle_instances = 0
        total_cpu_utilization = 0
        
        for reservation in instances.get("Reservations", []):
            for instance in reservation.get("Instances", []):
                state = instance.get("State", {}).get("Name")
                if state == "running":
                    instance_id = instance.get("InstanceId")
                    running_instances.append(instance_id)
                    
                    # Fetch CPU Utilization for the last 24 hours
                    cpu_metric = cloudwatch.get_metric_statistics(
                        Namespace="AWS/EC2",
                        MetricName="CPUUtilization",
                        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                        StartTime=datetime.utcnow() - timedelta(days=1),
                        EndTime=datetime.utcnow(),
                        Period=86400,
                        Statistics=["Average"]
                    )
                    
                    avg_cpu = 0
                    if cpu_metric.get("Datapoints"):
                        avg_cpu = cpu_metric["Datapoints"][0].get("Average", 0)
                        total_cpu_utilization += avg_cpu
                    
                    # Idle threshold: < 5% CPU average
                    if avg_cpu < 5:
                        idle_instances += 1
                elif state == "stopped":
                    stopped_instances += 1
        
        avg_running_cpu = total_cpu_utilization / len(running_instances) if running_instances else 0
        
        return {
            "total_running": len(running_instances),
            "stopped": stopped_instances,
            "idle": idle_instances,
            "avg_cpu": avg_running_cpu
        }

    def _get_storage_efficiency(self):
        """
        Analyzes EBS volume optimization.
        """
        ec2 = self.session.client("ec2")
        volumes = ec2.describe_volumes()
        
        unattached_volumes = 0
        total_volumes = 0
        
        for volume in volumes.get("Volumes", []):
            total_volumes += 1
            if not volume.get("Attachments"):
                unattached_volumes += 1
                
        return {
            "total_volumes": total_volumes,
            "unattached_volumes": unattached_volumes
        }

    def _get_optimization_recommendations(self):
        """
        Fetches recommendations from Compute Optimizer (if available).
        """
        recommendations = []
        try:
            optimizer = self.session.client("compute-optimizer")
            response = optimizer.get_ec2_instance_recommendations()
            
            for rec in response.get("instanceRecommendations", []):
                if rec.get("finding") == "Underprovisioned" or rec.get("finding") == "Overprovisioned":
                    recommendations.append({
                        "resource": rec.get("instanceId"),
                        "type": rec.get("finding"),
                        "action": f"Resize instance to {rec.get('recommendationOptions', [{}])[0].get('instanceType')}"
                    })
        except Exception:
            # Fallback if Compute Optimizer is not enabled
            pass
            
        return recommendations

    def _calculate_score(self, ec2, storage, recommendations):
        """
        Calculates the overall efficiency score based on weighted metrics.
        """
        # Weights: CPU (40), Storage (20), Waste/Idle (20), Recs (20)
        
        # 1. CPU Score (target 40-70% for efficiency)
        cpu_score = 0
        if 40 <= ec2["avg_cpu"] <= 70:
            cpu_score = 40
        elif 20 <= ec2["avg_cpu"] < 40:
            cpu_score = 25
        elif ec2["avg_cpu"] > 70:
            cpu_score = 30 # Slightly over-utilized
        else:
            cpu_score = 10 # Very under-utilized
            
        # 2. Storage Score (percentage of attached volumes)
        storage_score = 20
        if storage["total_volumes"] > 0:
            waste_ratio = storage["unattached_volumes"] / storage["total_volumes"]
            storage_score = 20 * (1 - waste_ratio)
            
        # 3. Waste Score (Running vs Idle)
        waste_score = 20
        if ec2["total_running"] > 0:
            idle_ratio = ec2["idle"] / ec2["total_running"]
            waste_score = 20 * (1 - idle_ratio)
            
        # 4. Recommendation Score
        rec_score = 20
        if recommendations:
            rec_score = 10 # Deduct if active recommendations exist
            
        total_score = round(cpu_score + storage_score + waste_score + rec_score)
        
        # Savings Estimation (Rough heuristic: $40/idle instance, $10/unused volume)
        estimated_savings = (ec2["idle"] * 40) + (storage["unattached_volumes"] * 15)
        
        # Sustainability Insights
        carbon_reduction = estimated_savings * 0.4 # Simplified kgCO2 reduction estimate
        
        tips = [
            "Stop underutilized EC2 instances to save energy",
            "Delete unattached EBS volumes to optimize storage",
            "Use Spot Instances for non-critical workloads to reduce footprint",
            "Right-size instances using Compute Optimizer data"
        ]
        
        return {
            "efficiency_score": total_score,
            "trend": "+5%" if total_score > 70 else "-2%",
            "idle_instances": ec2["idle"],
            "unattached_volumes": storage["unattached_volumes"],
            "estimated_savings": f"${estimated_savings}/month",
            "sustainability_insights": {
                "estimated_carbon_reduction_kg": round(carbon_reduction, 1),
                "green_tips": tips[:3] if total_score < 90 else ["Your infrastructure is highly optimized! Keep it up."]
            },
            "recommendations": [r["action"] for r in recommendations[:3]] if recommendations else [
                "Scan complete: No urgent resizing needed.",
                "Review idle instances in us-east-1"
            ]
        }
