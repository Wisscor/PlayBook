from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from .post_media import PostMediaResponse, PostMediaCreate
from .user import UserSummaryResponse


class PostCreate(BaseModel):
    media: Optional[List[PostMediaCreate]] = None
    caption: str = Field(..., min_length=1, max_length=2000)


class PostUpdate(BaseModel):
    caption: Optional[str] = Field(default=None, min_length=1, max_length=2000)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    caption: str = Field(..., min_length=1, max_length=2000)
    id: UUID
    user_id: UUID
    user: Optional[UserSummaryResponse] = None
    media: List[PostMediaResponse] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    created_at: datetime
    updated_at: datetime
