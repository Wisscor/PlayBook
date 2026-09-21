from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class FollwerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    follower_id: UUID
    following_id: UUID
    created_at: datetime