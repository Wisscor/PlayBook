from collections.abc import AsyncGenerator
from app.core.config import settings
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase

# The engine will connect to the 'ft_trancendance' database using the provided credentials.

# * Engine = the actual connection pool to Postgres. One per app.
engine = create_async_engine(
    settings.database_url,
    echo=True,
)

# * Session =  a factory that produces a new AsyncSession (a "conversation"
# * with the DB, tracks pending inserts/updates until commit).
session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


# * Base — every model inherits from this. SQLAlchemy uses Base.metadata to know
# * what tables exist across your whole app
class Base(DeclarativeBase):
    pass


# * get_async_session() — a dependency you'll plug into FastAPI routes; it opens
# * a session, hands it to your route function, and closes it after
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        yield session
