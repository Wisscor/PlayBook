# from pydantic import BaseModel


# class Creature(BaseModel):
#     name: str
#     country: str
#     area: str
#     description: str
#     aka: str


# thing = Creature(
#     name="yeti",
#     country="usa",
#     area="Himalayas",
#     description="Hirsute Himalayan",
#     aka="Abominable Snowman",
# )
# _creatures: list[Creature] = [
#     Creature(
#         name="yeti",
#         country="CN",
#         area="Himalayas",
#         description="Hirsute Himalayan",
#         aka="Abominable Snowman",
#     ),
#     Creature(
#         name="sasquatch",
#         country="US",
#         area="*",
#         description="Yeti's Cousin Eddie",
#         aka="Bigfoot",
#     ),
# ]


# def get_creatures() -> list[Creature]:
#     return _creatures


# from fastapi import FastAPI

# app = FastAPI()


# @app.get("/creature")
# def get_all() -> list[Creature]:
#     return get_creatures()


# from pydantic import BaseModel, Field


# class Creature(BaseModel):
#     name: str = Field(..., min_length=2)
#     country: str
#     area: str
#     description: str
#     aka: str

def user_dep(name):
    return f'my name is {ziko}'

def get_user(user = user_dep(name='ziko')):
    return user

