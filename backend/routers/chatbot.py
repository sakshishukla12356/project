from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.chatbot_service import get_ai_response
from middleware.rate_limit import RateLimiter, Tier

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat", dependencies=[Depends(RateLimiter(Tier.AI))])
async def chat(request: ChatRequest):
    response = get_ai_response(request.message)
    return {"data": response}