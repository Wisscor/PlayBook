from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from ..models.post import PostTypeEnum
from .post_media import PostMediaResponse, PostMediaCreate
from .user import UserSummaryResponse


class PostBase(BaseModel):
    caption: str = Field(..., min_length=1, max_length=2000)
    post_type: PostTypeEnum = PostTypeEnum.post
    sport: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=100)
    event_date: Optional[datetime] = None


class PostCreate(PostBase):
    media: Optional[List[PostMediaCreate]] = None


class PostUpdate(BaseModel):
    caption: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    sport: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=100)
    event_date: Optional[datetime] = None


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    user: Optional[UserSummaryResponse] = None
    media: List[PostMediaResponse] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    created_at: datetime
    updated_at: datetime
