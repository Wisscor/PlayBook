from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


# DRY Principle
class UserBase(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


# What should the client provide?
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


# What should the client provide for login?
class UserLogin(BaseModel):
    username_or_email: str
    password: str


# What should the client update?
class UserUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


# What should the client see?
class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
