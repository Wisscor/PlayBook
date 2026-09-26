from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from .user import UserSummaryResponse


class FollowerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    follower_id: UUID
    following_id: UUID
    created_at: datetime


# Alias for backward compatibility
FollwerResponse = FollowerResponse


class FollowToggleResponse(BaseModel):
    following: bool
    user_id: UUID


class FollowUserResponse(BaseModel):
    user: UserSummaryResponse
    created_at: datetime