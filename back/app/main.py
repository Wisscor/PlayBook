import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import structlog
from fastapi_pagination import add_pagination

from app.core.limiter import limiter
from app.database.database import engine, get_db
from app.database.base import Base
from app.database.seed import seed_sports
from app.core.config import settings
from .realtime import models as realtime_models
from .realtime import rest as realtime_rest
from .realtime import ws as realtime_ws
from app.routers import (
    auth,
    users,
    post,
    followers,
    sport,
    match_announcement,
    play_request,
)
from app.models import User, Session
from app.core.exception_handlers import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables if they don't exist, then seed required data.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async for db in get_db():
        await seed_sports(db)

    sweep_task = asyncio.create_task(_timeout_sweep_loop())
    yield
    sweep_task.cancel()
    await engine.dispose()


async def _timeout_sweep_loop() -> None:
    """Single global task that cleans expired timeout entries every 30s."""
    from .realtime import registry

    while True:
        await asyncio.sleep(30)
        registry.sweep_timeouts()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.debug,
)
register_exception_handlers(app)
# Stores the limiter in the app's state for global access
app.state.limiter = limiter

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
)
app.include_router(realtime_rest.router)
app.include_router(realtime_ws.router)
app.include_router(
    users.router,
)
app.include_router(
    post.router,
)
app.include_router(
    followers.router,
)
app.include_router(
    sport.router,
)
app.include_router(
    match_announcement.router,
)
app.include_router(
    play_request.router,
)
add_pagination(app)


@app.get("/health", status_code=200)
@limiter.limit("5/minute")
async def health_check(request: Request):
    """
    Health check endpoint to verify the application's status.
    Returns a 200 OK response if the application is running.
    """
    return {"status": "ok"}
