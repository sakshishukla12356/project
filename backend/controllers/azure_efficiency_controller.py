"""
controllers/azure_efficiency_controller.py

Coordinates Azure energy efficiency analysis.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from services.azure_efficiency_service import AzureEfficiencyService
from controllers.azure_controller import get_user_azure_credentials
import logging

logger = logging.getLogger(__name__)

async def get_azure_energy_efficiency(user_id: int, db: AsyncSession):
    """
    Fetches Azure credentials and returns efficiency analysis.
    """
    try:
        # 1. Fetch Azure Credentials
        account = await get_user_azure_credentials(user_id, db)
        
        if not account or not account.extra_config:
            return {
                "error": "Azure account not connected",
                "efficiency_score": 0,
                "recommendations": ["Connect your Azure account to see efficiency insights"]
            }
            
        config = account.extra_config
        
        # 2. Initialize Service
        service = AzureEfficiencyService(
            subscription_id=config.get("subscription_id"),
            tenant_id=config.get("tenant_id"),
            client_id=config.get("client_id"),
            client_secret=config.get("client_secret")
        )
        
        # 3. Perform Analysis
        analysis = service.fetch_metrics()
        
        return analysis

    except Exception as e:
        logger.error(f"Controller error fetching Azure efficiency: {str(e)}")
        return {
            "error": "Internal server error during Azure analysis",
            "efficiency_score": 0
        }
