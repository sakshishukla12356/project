from azure.mgmt.resource import ResourceManagementClient
from azure_ext.azure_auth import get_azure_credential
import os

def list_azure_resources():
    credential = get_azure_credential()

    client = ResourceManagementClient(
        credential,
        os.getenv("AZURE_SUBSCRIPTION_ID")
    )

    resources = []

    for res in client.resources.list():
        resources.append({
            "name": res.name,
            "type": res.type,
            "location": res.location
        })

    return resources
