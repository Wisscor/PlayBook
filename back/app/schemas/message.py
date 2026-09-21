from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

class MessageCreate(BaseModel):
    message: str = Field(min_length=1)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    private_chat_id: UUID
    sender_id: UUID
    message: str
    is_read: bool
    created_at: datetime
