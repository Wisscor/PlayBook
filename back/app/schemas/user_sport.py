import uuid

from pydantic import BaseModel, ConfigDict

from .sport import SportResponse


class UserSportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID

    sport_id: SportResponse
