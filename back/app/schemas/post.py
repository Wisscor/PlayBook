from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from .user import UserSummaryResponse


class PostCreate(BaseModel):
    caption: str = Field(..., min_length=1, max_length=2000)


class PostUpdate(BaseModel):
    caption: Optional[str] = Field(default=None, min_length=1, max_length=2000)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    caption: str = Field(..., min_length=1, max_length=2000)
    user_id: UUID
    author: Optional[UserSummaryResponse] = None
    created_at: datetime
    updated_at: datetime


class PostPage(BaseModel):
    items: list[PostResponse]
    next_offset: Optional[int] = None
