from __future__ import annotations

import re
import time
from collections import defaultdict
from html import escape

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.cloud_account import CloudAccount
from services.aws_service import get_running_instances
from services.azure_service import get_running_vms


# ─────────────────────────────────────────────
# 🔐 RATE LIMITING
# ─────────────────────────────────────────────
REQUEST_LOG = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60


# ─────────────────────────────────────────────
# 🔐 BLOCKED PATTERNS
# ─────────────────────────────────────────────
BLOCKED_PATTERNS = [
    "ignore previous instructions",
    "ignore all instructions",
    "reveal secrets",
    "show secrets",
    "give credentials",
    "access tokens",
    "delete database",
    "drop table",
    "execute command",
    "run script",
    "shutdown server",
    "bypass security",
    "hack",
    "inject",
    "sudo",
    "rm -rf",
    "system prompt",
    "developer prompt",
]


# ─────────────────────────────────────────────
# 🔐 RATE LIMIT CHECK
# ─────────────────────────────────────────────
def check_rate_limit(user_id: int):

    current_time = time.time()

    REQUEST_LOG[user_id] = [
        t for t in REQUEST_LOG[user_id]
        if current_time - t < RATE_WINDOW
    ]

    if len(REQUEST_LOG[user_id]) >= RATE_LIMIT:
        raise ValueError("Too many requests. Please try again later.")

    REQUEST_LOG[user_id].append(current_time)


# ─────────────────────────────────────────────
# 🔐 INPUT SANITIZATION
# ─────────────────────────────────────────────
def sanitize_user_input(user_message: str) -> str:

    if not user_message:
        raise ValueError("Message cannot be empty")

    user_message = user_message.strip()

    if len(user_message) > 300:
        raise ValueError("Message too long")

    user_message = escape(user_message)

    user_message = re.sub(r"[<>;$`|{}]", "", user_message)

    lower_msg = user_message.lower()

    for pattern in BLOCKED_PATTERNS:
        if pattern in lower_msg:
            raise ValueError("Suspicious request detected")

    return lower_msg


# ─────────────────────────────────────────────
# 🔐 SAFE RESPONSE CLEANER
# ─────────────────────────────────────────────
def safe_response(text: str) -> str:

    text = text.replace("access_key", "[PROTECTED]")
    text = text.replace("secret_key", "[PROTECTED]")
    text = text.replace("client_secret", "[PROTECTED]")

    return text


# ─────────────────────────────────────────────
# 🤖 MAIN CHATBOT FUNCTION
# ─────────────────────────────────────────────
async def get_ai_response(
    user_message: str,
    user_id: int,
    db: AsyncSession,
):

    # 🔐 Rate limiting
    check_rate_limit(user_id)

    # 🔐 Sanitize input
    user_message = sanitize_user_input(user_message)

    # ☁️ Provider detection
    show_aws = "aws" in user_message
    show_azure = "azure" in user_message

    if not show_aws and not show_azure:
        show_aws = True
        show_azure = True

    # 🔥 Fetch accounts
    res = await db.execute(select(CloudAccount).where(CloudAccount.user_id == user_id))
    accounts = res.scalars().all()

    aws_account = next(
        (a for a in accounts if a.provider == "aws"),
        None,
    )

    azure_account = next(
        (a for a in accounts if a.provider == "azure"),
        None,
    )

    # ☁️ AWS resources
    aws_instances = []

    if show_aws and aws_account:
        try:
            aws_instances = get_running_instances(
                aws_account.access_key,
                aws_account.secret_key,
                aws_account.default_region or "us-east-1",
            )

        except Exception:
            aws_instances = []

    # ☁️ Azure resources
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

    # 📊 Insights
    insights = []

    for inst in aws_instances:
        insights.append(
            safe_response(
                f"AWS EC2 instance {inst} is running"
            )
        )

    for vm in azure_vms:
        insights.append(
            safe_response(
                f"Azure VM {vm} is running"
            )
        )

    total_resources = len(aws_instances) + len(azure_vms)

    # ⚠️ Safe suggestions only
    actions = []

    for inst in aws_instances:
        actions.append({
            "label": f"Suggest stopping AWS instance {inst}",
            "type": "suggestion",
            "provider": "aws",
            "resource_id": inst,
        })

    for vm in azure_vms:
        actions.append({
            "label": f"Suggest stopping Azure VM {vm}",
            "type": "suggestion",
            "provider": "azure",
            "resource_id": vm,
        })

    # ☁️ Provider message
    if show_aws and show_azure:
        provider_msg = "AWS and Azure"

    elif show_aws:
        provider_msg = "AWS"

    else:
        provider_msg = "Azure"

    # ✅ Final response (no fabricated savings estimates)
    if total_resources == 0:
        message = "No running resources detected. Connect a cloud account to begin monitoring."
    else:
        message = f"Detected {total_resources} running resources in {provider_msg}."

    return {
        "message": safe_response(message),
        "insights": insights,
        "actions": actions,
        "note": "Savings estimates are unavailable until an optimization engine is configured.",
    }