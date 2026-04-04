from fastapi import APIRouter
from controllers.azure_controller import get_azure_resources_controller

router = APIRouter()

@router.get("/azure/resources")
def get_resources():
    return get_azure_resources_controller()
