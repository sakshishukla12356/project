"""
schemas/user.py

Secure User Schemas for Authentication + RBAC
"""

from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


# =========================================================
# PASSWORD VALIDATION
# =========================================================
class PasswordValidator:

    @staticmethod
    def validate_password(password: str) -> str:
        """
        Strong password validation
        """

        if len(password) < 8:
            raise ValueError(
                "Password must be at least 8 characters long"
            )

        if not any(char.isupper() for char in password):
            raise ValueError(
                "Password must contain at least one uppercase letter"
            )

        if not any(char.islower() for char in password):
            raise ValueError(
                "Password must contain at least one lowercase letter"
            )

        if not any(char.isdigit() for char in password):
            raise ValueError(
                "Password must contain at least one number"
            )

        special_characters = "!@#$%^&*()-_=+[]{}|;:,.<>?/"

        if not any(char in special_characters for char in password):
            raise ValueError(
                "Password must contain at least one special character"
            )

        return password


# =========================================================
# USER REGISTRATION SCHEMA
# =========================================================
class UserCreate(BaseModel):

    email: EmailStr

    full_name: Optional[str] = Field(
        default=None,
        max_length=255
    )

    password: str = Field(
        min_length=8,
        max_length=128
    )

    role: Optional[str] = Field(
        default="user"
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str):
        return PasswordValidator.validate_password(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str):

        allowed_roles = [
            "user",
            "admin",
            "manager",
            "security_analyst",
        ]

        if value not in allowed_roles:
            raise ValueError(
                f"Role must be one of: {allowed_roles}"
            )

        return value


# =========================================================
# USER LOGIN SCHEMA
# =========================================================
class UserLogin(BaseModel):

    email: EmailStr

    password: str


# =========================================================
# USER RESPONSE SCHEMA
# =========================================================
class UserResponse(BaseModel):

    id: int

    email: EmailStr

    full_name: Optional[str]

    role: str

    is_active: bool

    is_verified: bool

    is_superuser: bool

    mfa_enabled: bool

    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# TOKEN RESPONSE SCHEMA
# =========================================================
class TokenResponse(BaseModel):

    access_token: str

    refresh_token: Optional[str]

    token_type: str = "bearer"


# =========================================================
# PASSWORD RESET REQUEST
# =========================================================
class PasswordResetRequest(BaseModel):

    email: EmailStr


# =========================================================
# PASSWORD RESET CONFIRM
# =========================================================
class PasswordResetConfirm(BaseModel):

    token: str

    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str):
        return PasswordValidator.validate_password(value)


# =========================================================
# EMAIL VERIFICATION
# =========================================================
class EmailVerification(BaseModel):

    token: str


# =========================================================
# MFA VERIFICATION
# =========================================================
class MFAVerification(BaseModel):

    otp_code: str = Field(
        min_length=6,
        max_length=6
    )