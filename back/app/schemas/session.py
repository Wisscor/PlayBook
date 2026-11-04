from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    expires_at: datetime
    created_at: datetime
    ip_address: Optional[str] = None
    platform: Optional[str] = None
    browser: Optional[str] = None
    user_agent: Optional[str] = None
    is_current: bool = False
