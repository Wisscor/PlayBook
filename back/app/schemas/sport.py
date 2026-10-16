import uuid

from pydantic import BaseModel, ConfigDict


class SportResponse(BaseModel):
    # Allow Pydantic to read data from obj attr (ORM Models)
    # 'model_config' : the name is strictly necessary!
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)
    name: str
