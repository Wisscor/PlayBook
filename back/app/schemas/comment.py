from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


class CommentBase(BaseModel):
    content: str = Field(min_length=1)
    comment_reply_to_id: Optional[UUID] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1)


class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
