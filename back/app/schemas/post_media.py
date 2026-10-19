from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
import uuid

class PostMediaBase(BaseModel):
    media_url: str
    media_type: Literal["image"]
    # for ordering media items in a post, default is 0
    position: int = 0


class PostMediaCreate(PostMediaBase):
    pass


class PostMediaUpdate(BaseModel):
    media_url: Optional[str] = None
    media_type: Optional[Literal["image"]] = None
    position: Optional[int] = None


class PostMediaResponse(PostMediaBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    post_id: uuid.UUID


class UploadedMedia(BaseModel):
    media_url: str
    media_type: Literal["image"]