import os
from collections.abc import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# The engine will connect to the 'ft_trancendance' database using the provided credentials.

load_dotenv()  # Load environment variables from .env file
DATABASE_URL = os.environ["DATABASE_URL"]

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Check your .env file in the back/ directory."
    )

# * Engine = the actual connection pool to Postgres. One per app.
engine = create_async_engine(DATABASE_URL, echo=True)

# * Session =  a factory that produces a new AsyncSession (a "conversation"
# * with the DB, tracks pending inserts/updates until commit).
session_maker = async_sessionmaker(engine, expire_on_commit=False)


# * Base — every model inherits from this. SQLAlchemy uses Base.metadata to know
# * what tables exist across your whole app
class Base(DeclarativeBase):
    pass


# * get_async_session() — a dependency you'll plug into FastAPI routes; it opens
# * a session, hands it to your route function, and closes it after
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        yield session
