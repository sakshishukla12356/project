"""
routers/auth.py

Enterprise-Grade Authentication Router

Features:
✔ Secure Signup
✔ Secure Login
✔ JWT Authentication
✔ JSON-based Requests
✔ Strong Validation
✔ Production-Ready Error Handling
✔ RBAC-Compatible
✔ Async SQLAlchemy Support
"""

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)

from sqlalchemy.ext.asyncio import AsyncSession

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
)
async def signup(
    body: SignupRequest,
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
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user using email + password.
    Returns JWT token.
    """

    try:

        result = await auth_controller.login(
            email=body.email,
            password=body.password,
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
