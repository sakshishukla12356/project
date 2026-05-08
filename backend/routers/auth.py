
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from middleware.rate_limit import RateLimiter, Tier
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from config.settings import get_settings

settings = get_settings()

from database.base import get_db
from controllers import auth_controller


# =========================================================
# ROUTER CONFIG
# =========================================================
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# REQUEST MODELS
# =========================================================
class SignupRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Strong password"
    )

    full_name: str | None = Field(
        default=None,
        max_length=255
    )


class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# =========================================================
# RESPONSE MODELS
# =========================================================
class TokenResponse(BaseModel):

    access_token: str

    token_type: str

    user_id: int

    email: str


# =========================================================
# USER SIGNUP
# =========================================================
@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(Tier.AUTH))],
)
async def signup(
    body: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    Returns JWT access token.
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
                detail="Signup failed"
            )

        # Set secure cookie
        response.set_cookie(
            key="access_token",
            value=f"Bearer {result['access_token']}",
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup error: {str(e)}"
        )


# =========================================================
# USER LOGIN
# =========================================================
@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(RateLimiter(Tier.AUTH))],
)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user using email + password.
    Swagger OAuth2 compatible.
    """

    try:

        result = await auth_controller.login(
            email=form_data.username,
            password=form_data.password,
            db=db,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Set secure cookie
        response.set_cookie(
            key="access_token",
            value=f"Bearer {result['access_token']}",
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
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
# =========================================================
# HEALTH CHECK
# =========================================================
@router.get("/health")
async def auth_health():
    """
    Authentication service health check.
    """

    return {
        "status": "healthy",
        "service": "authentication",
    }

# ─────────────────────────────────────────────
# 🚪 LOGOUT
# ─────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    """
    Clear the HttpOnly authentication cookie.
    """
    response.delete_cookie(
        key="access_token",
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )
    return {"detail": "Logged out successfully"}
