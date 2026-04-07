from services.aws_service import get_running_instances
from services.azure_service import get_running_vms

from models.cloud_account import CloudAccount
from sqlalchemy.orm import Session


# ─── Main function ──────────────────────────────
def get_ai_response(user_message: str, user_id: int, db: Session):

    user_message = user_message.lower()

    # ─── Detect user intent ───
    show_aws = "aws" in user_message
    show_azure = "azure" in user_message

    # default → show both
    if not show_aws and not show_azure:
        show_aws = True
        show_azure = True

    # 🔥 FETCH USER ACCOUNTS FROM DB
    accounts = db.query(CloudAccount).filter(
        CloudAccount.user_id == user_id
    ).all()

    aws_account = next((a for a in accounts if a.provider == "aws"), None)
    azure_account = next((a for a in accounts if a.provider == "azure"), None)

    # ─── Fetch AWS data ───
    aws_instances = []
    if show_aws and aws_account:
        try:
            aws_instances = get_running_instances(
                aws_account.access_key,
                aws_account.secret_key,
                aws_account.default_region or "us-east-1"
            )
        except Exception:
            aws_instances = []

    # ─── Fetch Azure data ───
    azure_vms = []
    if show_azure and azure_account:
        try:
            extra = azure_account.extra_config or {}

            azure_vms = get_running_vms(
                subscription_id=extra.get("subscription_id"),
                tenant_id=extra.get("tenant_id"),
                client_id=extra.get("client_id"),
                client_secret=extra.get("client_secret"),
            )
        except Exception:
            azure_vms = []

    total_resources = len(aws_instances) + len(azure_vms)

    # ─── Insights ───
    insights = []

    for inst in aws_instances:
        insights.append(f"AWS EC2 instance {inst} is running")

    for vm in azure_vms:
        insights.append(f"Azure VM {vm} is running")

    # ─── Actions ───
    actions = []

    for inst in aws_instances:
        actions.append({
            "label": f"Stop AWS Instance {inst}",
            "type": "stop",
            "provider": "aws",
            "resource_id": inst,
            "user_id": user_id   # 🔥 IMPORTANT
        })

    for vm in azure_vms:
        actions.append({
            "label": f"Stop Azure VM {vm}",
            "type": "stop",
            "provider": "azure",
            "resource_id": vm,
            "user_id": user_id   # 🔥 IMPORTANT
        })

    # ─── Savings ───
    monthly = total_resources * 500
    yearly = monthly * 12

    # ─── Provider message ───
    if show_aws and show_azure:
        provider_msg = "AWS and Azure"
    elif show_aws:
        provider_msg = "AWS"
    else:
        provider_msg = "Azure"

    # ─── Final response ───
    return {
        "message": f"You have {total_resources} running resources in {provider_msg}.",
        "insights": insights,
        "actions": actions,
        "savings": {
            "monthly": f"₹{monthly}",
            "yearly": f"₹{yearly}"
        },
        "finance_advice": [
            "Reduce unused resources to save cost",
            "Invest saved money in smart financial plans"
        ]
    }