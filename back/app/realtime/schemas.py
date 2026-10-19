from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
	peer_id: UUID

class MessageSend(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    conversation_id: UUID
    body: str = Field(min_length=1, max_length=2000)