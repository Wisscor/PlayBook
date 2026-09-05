from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID


class PostBase(BaseModel):
    content: str = Field(..., max_length=500)
    image_url: str | None = Field(default=None, max_length=500)


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    content: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
