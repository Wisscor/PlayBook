from contextlib import asynccontextmanager
from fastapi import FastAPI
from .db.database import engine, Base
from .core.config import settings
from .routers import auth
from .realtime import models as realtime_models
from .realtime import ws as realtime_ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on application startup
    async with engine.begin() as connection:  # Create tables if they don't exist
        await connection.run_sync(Base.metadata.create_all)
    yield
    # Dispose of the engine on application shutdown
    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.debug,
)

app.include_router(
    auth.router,
)
app.include_router(realtime_ws.router)
# Create DB tables if they don't exist


# Base.metadata.create_all(bind=engine)  # Create tables if they don't exist
# Or use the lifespan event to create tables on startup and dispose of the engine on shutdown


@app.get("/")
async def root():
    return {
        "message": "Social Media API is running!",
    }
    