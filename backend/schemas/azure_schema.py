from pydantic import BaseModel
from typing import Optional

class AzureConnectRequest(BaseModel):
    subscription_id: str
    tenant_id: str
    client_id: str
    client_secret: str
    account_label: Optional[str] = "My Azure Account"
