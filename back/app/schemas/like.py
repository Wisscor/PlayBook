from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class LikeToggleResponse(BaseModel):
    liked: bool
    post_id: UUID


class LikeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime
