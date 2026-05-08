"""
azure_ext/azure_auth.py
Azure credential helper — uses centralized settings (not raw os.getenv).
"""
from azure.identity import ClientSecretCredential, DefaultAzureCredential

from config.settings import get_settings


def get_azure_credential():
    """
    Build an Azure credential from settings.
    Falls back to DefaultAzureCredential when service-principal
    fields are not configured (e.g. local dev with `az login`).
    """
    settings = get_settings()

    if settings.AZURE_TENANT_ID and settings.AZURE_CLIENT_ID and settings.AZURE_CLIENT_SECRET:
        return ClientSecretCredential(
            tenant_id=settings.AZURE_TENANT_ID,
            client_id=settings.AZURE_CLIENT_ID,
            client_secret=settings.AZURE_CLIENT_SECRET,
        )
    return DefaultAzureCredential()
