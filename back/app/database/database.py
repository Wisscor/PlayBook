from collections.abc import AsyncGenerator
from app.core.config import settings
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# ? The engine will connect with database using the provided credentials.

# * Engine = the actual connection pool to Postgres. One per app.
engine = create_async_engine(
    settings.database_url,
    # echo=True,
)

# * Session =  a factory that produces a new AsyncSession (a "conversation"
# * with the DB, tracks pending inserts/updates until commit).
session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)



# Create a new async session for each request
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        yield session
