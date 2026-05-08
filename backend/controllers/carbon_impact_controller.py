"""
controllers/carbon_impact_controller.py

Coordinates carbon impact analytics between providers.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from services.carbon_impact_service import CarbonImpactService
from controllers.aws_controller import get_user_aws_credentials
from controllers.azure_controller import get_user_azure_credentials
import logging

logger = logging.getLogger(__name__)

async def get_carbon_impact_analytics(user_id: int, db: AsyncSession):
    """
    Orchestrates the carbon impact analysis across all connected cloud accounts.
    """
    try:
        # 1. Fetch AWS Credentials
        aws_account = await get_user_aws_credentials(user_id, db)
        aws_creds = None
        if aws_account:
            aws_creds = {
                "access_key": aws_account.access_key,
                "secret_key": aws_account.secret_key,
                "region": aws_account.default_region
            }
            
        # 2. Fetch Azure Credentials
        azure_account = await get_user_azure_credentials(user_id, db)
        azure_creds = None
        if azure_account and azure_account.extra_config:
            azure_creds = azure_account.extra_config
            
        # 3. Initialize Service and Run Analysis
        service = CarbonImpactService(aws_creds=aws_creds, azure_creds=azure_creds)
        impact_data = await service.get_total_impact()
        
        return impact_data

    except Exception as e:
        logger.error(f"Carbon analytics controller error: {str(e)}")
        return {
            "error": "Failed to generate carbon impact analytics",
            "estimated_co2_kg": 0,
            "carbon_cost": "$0"
        }
