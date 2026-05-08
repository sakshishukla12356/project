"""
services/aws_service.py

AWS telemetry fetcher:
- Live resource inventory (EC2, RDS, S3, Lambda)
- Live Cost Explorer totals and trends
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Any

import boto3

# 🔹 LIMIT REGIONS (performance control)
MAX_REGIONS = 10


# ─────────────────────────────────────────────
# 🔹 GET ALL REGIONS (AUTO)
# ─────────────────────────────────────────────
def get_all_regions(access_key, secret_key):
    try:
        ec2 = boto3.client(
            "ec2",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="us-east-1",
        )

        regions = ec2.describe_regions()["Regions"]
        return [r["RegionName"] for r in regions][:MAX_REGIONS]

    except Exception:
        return ["us-east-1"]


# ─────────────────────────────────────────────
# 🔹 EC2 FETCH (ONLY RUNNING)
# ─────────────────────────────────────────────
def fetch_ec2(region, access_key, secret_key):
    data = []

    try:
        ec2 = boto3.client(
            "ec2",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

        response = ec2.describe_instances()

        for r in response.get("Reservations", []):
            for i in r.get("Instances", []):
                state = i.get("State", {}).get("Name")

                # 🔥 ONLY RUNNING INSTANCES
                if state == "running":
                    data.append({
                        "service": "EC2",
                        "id": i.get("InstanceId"),
                        "state": state,
                        "region": region,
                    })

    except Exception as e:
        print(f"EC2 error in {region}:", e)

    return data


# ─────────────────────────────────────────────
# 🔹 RDS FETCH
# ─────────────────────────────────────────────
def fetch_rds(region, access_key, secret_key):
    data = []

    try:
        rds = boto3.client(
            "rds",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

        response = rds.describe_db_instances()

        for db in response.get("DBInstances", []):
            data.append({
                "service": "RDS",
                "id": db.get("DBInstanceIdentifier"),
                "state": db.get("DBInstanceStatus"),
                "region": region,
            })

    except Exception:
        pass

    return data


def fetch_lambda(region, access_key, secret_key):
    data = []
    try:
        client = boto3.client(
            "lambda",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        paginator = client.get_paginator("list_functions")
        for page in paginator.paginate():
            for fn in page.get("Functions", []):
                data.append({
                    "service": "Lambda",
                    "id": fn.get("FunctionName"),
                    "state": "active",
                    "region": region,
                })
    except Exception:
        pass
    return data


# ─────────────────────────────────────────────
# 🔹 SINGLE REGION SCAN
# ─────────────────────────────────────────────
def scan_region(region, access_key, secret_key):
    results = []

    results.extend(fetch_ec2(region, access_key, secret_key))
    results.extend(fetch_rds(region, access_key, secret_key))
    results.extend(fetch_lambda(region, access_key, secret_key))

    return results


# ─────────────────────────────────────────────
# 🔹 MAIN FETCH (AUTO REGION + PARALLEL)
# ─────────────────────────────────────────────
def fetch_aws_all(access_key, secret_key, region):
    all_resources = []

    try:
        regions = get_all_regions(access_key, secret_key)

        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [
                executor.submit(scan_region, r, access_key, secret_key)
                for r in regions
            ]

            for future in as_completed(futures, timeout=15):
                try:
                    all_resources.extend(future.result())
                except Exception:
                    pass

        # 🔹 S3 (GLOBAL SERVICE)
        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
            )

            response = s3.list_buckets()

            for bucket in response.get("Buckets", []):
                all_resources.append({
                    "service": "S3",
                    "id": bucket.get("Name"),
                    "state": "active",
                    "region": "global",
                })

        except Exception:
            pass

        return {
            "total_resources": len(all_resources),
            "resources": all_resources,
        }

    except Exception as e:
        return {
            "error": str(e),
            "resources": [],
        }


# ─────────────────────────────────────────────
# 🔹 COST EXPLORER HELPERS
# ─────────────────────────────────────────────
def _normalize_ce_amount(value: Any) -> float:
    try:
        return float(value)
    except Exception:
        return 0.0


def fetch_aws_costs(access_key, secret_key, region):
    """
    Live AWS costs from Cost Explorer (last 30 complete days).
    Falls back to zeroed payload if CE is unavailable.
    """
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=30)).isoformat()
    end = today.isoformat()

    try:
        ce = boto3.client(
            "ce",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="us-east-1",  # Cost Explorer is in us-east-1
        )
        result = ce.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}],
        )
        groups = (result.get("ResultsByTime") or [{}])[0].get("Groups", [])
        by_service = []
        total = 0.0
        for grp in groups:
            amount = _normalize_ce_amount(
                grp.get("Metrics", {}).get("UnblendedCost", {}).get("Amount", 0)
            )
            service_name = (grp.get("Keys") or ["Unknown"])[0]
            total += amount
            by_service.append({"service": service_name, "cost_usd": round(amount, 4)})

        by_service.sort(key=lambda x: x.get("cost_usd", 0), reverse=True)
        return {
            "start": start,
            "end": end,
            "total_cost_usd": round(total, 4),
            "total_services": len(by_service),
            "by_service": by_service,
        }
    except Exception as e:
        return {
            "error": str(e),
            "start": start,
            "end": end,
            "total_cost_usd": 0.0,
            "total_services": 0,
            "by_service": [],
        }


def fetch_aws_cost_trend(access_key, secret_key, days: int = 7):
    """
    Daily AWS cost trend for the last `days` complete days.
    """
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=days)).isoformat()
    end = today.isoformat()

    try:
        ce = boto3.client(
            "ce",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="us-east-1",
        )
        result = ce.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="DAILY",
            Metrics=["UnblendedCost"],
        )
        trend = []
        for row in result.get("ResultsByTime", []):
            amount = _normalize_ce_amount(
                row.get("Total", {}).get("UnblendedCost", {}).get("Amount", 0)
            )
            day = row.get("TimePeriod", {}).get("Start", "")
            label = day[-2:] if day else ""
            trend.append({"date": label, "cost": round(amount, 4)})
        return trend
    except Exception:
        return [{"date": str(i + 1), "cost": 0.0} for i in range(days)]


def summarize_aws_resources(resources: list[dict]) -> dict[str, int]:
    """
    Aggregate AWS resource counts for dashboard charts/cards.
    """
    summary = {"ec2": 0, "rds": 0, "s3": 0, "lambda": 0, "other": 0, "active_resources": 0}
    for r in resources:
        service = (r.get("service") or "").lower()
        state = (r.get("state") or "").lower()
        is_active = state in {"running", "active", "available"} or service == "s3"
        if is_active:
            summary["active_resources"] += 1

        if service == "ec2":
            summary["ec2"] += 1
        elif service == "rds":
            summary["rds"] += 1
        elif service == "s3":
            summary["s3"] += 1
        elif service == "lambda":
            summary["lambda"] += 1
        else:
            summary["other"] += 1

    return summary


# ─────────────────────────────────────────────
# 🔥 NEW: CHATBOT HELPER FUNCTION (NO BREAKAGE)
# ─────────────────────────────────────────────
def get_running_instances(access_key, secret_key, region):
    """
    Returns ONLY running EC2 instance IDs for chatbot usage
    """
    data = fetch_aws_all(access_key, secret_key, region)

    instances = []

    for r in data.get("resources", []):
        if r["service"] == "EC2" and r["state"] == "running":
            instances.append(r["id"])

    return instances

def stop_instance(instance_id, access_key=None, secret_key=None, region="us-east-1"):
    import boto3

    ec2 = boto3.client(
        "ec2",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

    ec2.stop_instances(InstanceIds=[instance_id])