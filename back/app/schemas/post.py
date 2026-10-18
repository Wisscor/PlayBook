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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    caption: str = Field(..., min_length=1, max_length=2000)
    user_id: UUID
    author: Optional[UserSummaryResponse] = None
    user: Optional[UserSummaryResponse] = None
    media: List[PostMediaResponse] = []
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
    is_liked_by_me: bool = False
    created_at: datetime
    updated_at: datetime


class PostPage(BaseModel):
    items: List[PostResponse]
    next_cursor: Optional[str] = None
