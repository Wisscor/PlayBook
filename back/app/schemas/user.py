from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


# DRY Principle
class UserBase(BaseModel):
    firstname: str = Field(..., min_length=3, max_length=50)
    lastname: str = Field(..., min_length=3, max_length=50)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    avatar: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None, min_length=3, max_length=500)


# What should the client provide?
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    #
    model_config = {
        "json_schema_extra": {
            "example": {
                "firstname": "zakaria",
                "lastname": "wazrou",
                "username": "zouazrou",
                "email": "zakaria@gmail.com",
                "password": "ziko1234",
            }
        }
    }


# What should the client provide for login?
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "zakaria@gmail.com",
                "password": "ziko1234",
            }
        }
    }


# What should the client update?
class UserUpdate(BaseModel):
    firstname: Optional[str] = Field(default=None, min_length=3, max_length=50)
    lastname: Optional[str] = Field(default=None, min_length=3, max_length=50)
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    bio: Optional[str] = Field(default=None, min_length=3, max_length=500)


# Used as a response model for the user
class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# Used as a field in another Schema
class UserSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    firstname: str
    lastname: str
    avatar: Optional[str] = None


# Used for the user profile respons
class UserProfileResponse(UserResponse):
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: Optional[bool] = None
