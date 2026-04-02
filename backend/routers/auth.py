"""
routers/auth.py

Handles user authentication:
- Signup
- Login
Returns JWT tokens for secure API access.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database.base import get_db
from controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────
# 📥 REQUEST MODELS
# ─────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str | None = None


# ─────────────────────────────────────────────
# 📤 RESPONSE MODELS
# ─────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str


# ─────────────────────────────────────────────
# 📝 SIGNUP
# ─────────────────────────────────────────────
@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    body: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user and return JWT token.
    """
    try:
        result = await auth_controller.signup(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            db=db,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed",
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup error: {str(e)}",
        )


# ─────────────────────────────────────────────
# 🔐 LOGIN
# ─────────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login using email + password.
    Returns JWT token.
    """
    try:
        result = await auth_controller.login(
            email=form_data.username,  # username field used for email
            password=form_data.password,
            db=db,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
