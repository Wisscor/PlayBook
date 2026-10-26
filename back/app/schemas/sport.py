import uuid

from pydantic import BaseModel, ConfigDict, Field


class SportCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    max_players: int = Field(ge=1)


class SportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    max_players: int
