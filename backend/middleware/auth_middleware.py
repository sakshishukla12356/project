"""
middleware/auth_middleware.py

Enterprise-Grade Authentication + Authorization Middleware

Features:
✔ JWT Authentication
✔ Access Token Validation
✔ Active User Validation
✔ Account Lock Protection
✔ Role-Based Access Control (RBAC)
✔ Admin Protection
✔ Security Analyst Protection
✔ Manager Protection
✔ Proper HTTP Security Responses
"""

from typing import List

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database.session import get_db
from models.user import User
from services.auth_service import decode_access_token


# =========================================================
# OAUTH2 SCHEME
# =========================================================
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# =========================================================
# GET CURRENT USER
# =========================================================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Validate JWT token and return authenticated user.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # =================================================
        # DECODE JWT TOKEN
        # =================================================
        payload = decode_access_token(token)

        # =================================================
        # EXTRACT USER ID
        # =================================================
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        # =================================================
        # FETCH USER FROM DATABASE
        # =================================================
        user = db.query(User).filter(
            User.id == int(user_id)
        ).first()

        if user is None:
            raise credentials_exception

        return user

    except JWTError:
        raise credentials_exception


# =========================================================
# ACTIVE USER CHECK
# =========================================================
async def get_current_active_user(
    current_user: User = Depends(get_current_user),
):
    """
    Ensure user account is active.
    """

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    return current_user


# =========================================================
# EMAIL VERIFIED CHECK
# =========================================================
async def get_verified_user(
    current_user: User = Depends(get_current_active_user),
):
    """
    Ensure email is verified.
    """

    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )

    return current_user


# =========================================================
# ACCOUNT LOCK CHECK
# =========================================================
async def get_unlocked_user(
    current_user: User = Depends(get_verified_user),
):
    """
    Prevent locked accounts from accessing APIs.
    """

    if current_user.account_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to multiple failed login attempts"
        )

    return current_user


# =========================================================
# ROLE-BASED ACCESS CONTROL (RBAC)
# =========================================================
def require_roles(allowed_roles: List[str]):
    """
    Restrict route access based on user role.

    Example:
        Depends(require_roles(["admin"]))
    """

    async def role_checker(
        current_user: User = Depends(get_unlocked_user),
    ):

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# =========================================================
# ADMIN ONLY ACCESS
# =========================================================
async def require_admin(
    current_user: User = Depends(get_unlocked_user),
):
    """
    Allow only admin users.
    """

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# =========================================================
# MANAGER ONLY ACCESS
# =========================================================
async def require_manager(
    current_user: User = Depends(get_unlocked_user),
):
    """
    Allow only managers.
    """

    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )

    return current_user


# =========================================================
# SECURITY ANALYST ACCESS
# =========================================================
async def require_security_analyst(
    current_user: User = Depends(get_unlocked_user),
):
    """
    Allow only security analysts.
    """

    if current_user.role != "security_analyst":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security analyst access required"
        )

    return current_user


# =========================================================
# ADMIN OR MANAGER ACCESS
# =========================================================
async def require_admin_or_manager(
    current_user: User = Depends(get_unlocked_user),
):
    """
    Allow admin or manager access.
    """

    allowed_roles = ["admin", "manager"]

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or manager access required"
        )

    return current_user


# =========================================================
# SUPERUSER ACCESS
# =========================================================
async def require_superuser(
    current_user: User = Depends(get_unlocked_user),
):
    """
    Allow only superusers.
    """

    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required"
        )

    return current_user