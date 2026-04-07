from fastapi import APIRouter
from pydantic import BaseModel
from services.chatbot_service import get_ai_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):
    response = get_ai_response(request.message)
    return {"data": response}