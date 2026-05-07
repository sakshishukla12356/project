"""
azure_ext/azure_services.py
Azure resource listing — uses centralized settings.
"""
from azure.mgmt.resource import ResourceManagementClient

from azure_ext.azure_auth import get_azure_credential
from config.settings import get_settings


def list_azure_resources():
    credential = get_azure_credential()
    settings = get_settings()

    client = ResourceManagementClient(
        credential,
        settings.AZURE_SUBSCRIPTION_ID,
    )

    resources = []

    for res in client.resources.list():
        resources.append({
            "name": res.name,
            "type": res.type,
            "location": res.location,
        })

    return resources
