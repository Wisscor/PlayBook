from uuid import UUID
from pydantic import BaseModel


class ConversationCreate(BaseModel):
	peer_id: UUID
