from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID


# DRY Principle
class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    email: EmailStr = Field(..., max_length=100)
    bio: str | None = Field(default=None, max_length=500)


class UserSigup(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    bio: str | None = Field(default=None, max_length=500)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# # Token and Refresh Request Schemas
# class TokenPair(BaseModel):
#     access_token: str
#     refresh_token: str
#     token_type: str = "bearer"


# class RefreshRequest(BaseModel):
#     refresh_token: str
