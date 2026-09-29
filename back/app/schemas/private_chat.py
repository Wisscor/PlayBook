from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class PrivateChatCreate(BaseModel):
    user2_id: UUID  # user1_id comes from the authenticated user


class PrivateChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user1_id: UUID
    user2_id: UUID
    created_at: datetime
