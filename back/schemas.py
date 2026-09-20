"""
Pydantic v2 schemas for ft_trancendence, matching models.py.

Convention per entity:
- <Name>Base   -> shared fields
- <Name>Create -> input for creating a new row (no id/timestamps)
- <Name>Update -> input for partial updates (all fields optional)
- <Name>Response   -> what the API returns (id + timestamps, from_attributes=True)

Requires pydantic >= 2.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field



# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    user_id: int
    expires_at: datetime


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    expires_at: datetime


# ---------------------------------------------------------------------------
# PostMedia
# ---------------------------------------------------------------------------

class PostMediaBase(BaseModel):
    media_url: str = Field(max_length=500)
    media_type: str = Field(max_length=20)  # "image" | "video"
    position: int = 0


class PostMediaCreate(PostMediaBase):
    pass


class PostMediaResponse(PostMediaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int


# ---------------------------------------------------------------------------
# Post
# ---------------------------------------------------------------------------

class PostBase(BaseModel):
    caption: Optional[str] = None
    post_type_id: int


class PostCreate(PostBase):
    media: List[PostMediaCreate] = Field(default_factory=list)


class PostUpdate(BaseModel):
    caption: Optional[str] = None
    post_type_id: Optional[int] = None


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    media: List[PostMediaResponse] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------

class CommentBase(BaseModel):
    content: str = Field(min_length=1)
    comment_reply_to_id: Optional[int] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1)


class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Like
# ---------------------------------------------------------------------------

class LikeCreate(BaseModel):
    post_id: int


class LikeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    post_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Follower
# ---------------------------------------------------------------------------

class FollowerCreate(BaseModel):
    following_id: int  # follower_id comes from the authenticated user


class FollowerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    follower_id: int
    following_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# PrivateChat
# ---------------------------------------------------------------------------

class PrivateChatCreate(BaseModel):
    user2_id: int  # user1_id comes from the authenticated user


class PrivateChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user1_id: int
    user2_id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------

class MessageCreate(BaseModel):
    message: str = Field(min_length=1)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    private_chat_id: int
    sender_id: int
    message: str
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    actor_id: int
    type: str
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime


class NotificationUpdate(BaseModel):
    is_read: bool
