from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid

class PostMediaBase(BaseModel):
    media_url: str
    media_type: str  # "image" | "video"
    # for ordering media items in a post, default is 0
    position: int = 0


class PostMediaCreate(PostMediaBase):
    pass


class PostMediaUpdate(BaseModel):
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    position: Optional[int] = None


class PostMediaResponse(PostMediaBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    post_id: uuid.UUID