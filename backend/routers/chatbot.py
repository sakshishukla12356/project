<<<<<<< HEAD
=======
"""
routers/chatbot.py

Handles AI chatbot interactions (secured).
"""

>>>>>>> 8d46b5d8900a7173bc7df5d73464820da1297500
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from middleware.auth import get_current_user
from models.user import User
from services.chatbot_service import get_ai_response
from middleware.rate_limit import RateLimiter, Tier

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ─────────────────────────────────────────────
# 📥 REQUEST MODEL
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

<<<<<<< HEAD
@router.post("/chat", dependencies=[Depends(RateLimiter(Tier.AI))])
async def chat(request: ChatRequest):
=======

# ─────────────────────────────────────────────
# 🤖 CHAT ENDPOINT (SECURED)
# ─────────────────────────────────────────────
@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),  # optional (for logging/chat history)
):
    """
    Secure AI chatbot endpoint.
    Only authenticated users can access.
    """

>>>>>>> 8d46b5d8900a7173bc7df5d73464820da1297500
    response = get_ai_response(request.message)

    return {
        "user_id": current_user.id,
        "response": response,
    }