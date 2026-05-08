"""
controllers/energy_efficiency_controller.py

Coordinates energy efficiency analysis between routes and the service layer.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from services.energy_efficiency_service import EnergyEfficiencyService
from controllers.aws_controller import get_user_aws_credentials
import logging

logger = logging.getLogger(__name__)

async def get_aws_energy_efficiency(user_id: int, db: AsyncSession):
    """
    Fetches user credentials, initializes the service, and returns efficiency analysis.
    """
    try:
        # 1. Fetch AWS Credentials
        account = await get_user_aws_credentials(user_id, db)
        
        if not account:
            return {
                "error": "AWS account not connected",
                "efficiency_score": 0,
                "recommendations": ["Connect your AWS account to see efficiency insights"]
            }
            
        # 2. Initialize Service
        service = EnergyEfficiencyService(
            access_key=account.access_key,
            secret_key=account.secret_key,
            region=account.default_region
        )
        
        # 3. Perform Analysis
        # Note: This is a synchronous call to boto3, we could wrap it in run_in_executor 
        # if it becomes a bottleneck, but for now we'll keep it simple.
        analysis = service.fetch_metrics()
        
        return analysis

    except Exception as e:
        logger.error(f"Controller error fetching efficiency: {str(e)}")
        return {
            "error": "Internal server error during analysis",
            "efficiency_score": 0
        }
