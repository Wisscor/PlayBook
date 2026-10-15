import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database.database import engine
from app.database.base import Base
from app.core.config import settings
from .realtime import models as realtime_models
from .realtime import ws as realtime_ws
from app.routers import (
    auth,
    users,
    post,
    followers,
    like,
    comments,
    sport,
    match_announcement,
    play_request,
)
from app.models import User, Session

from app.logging_conf import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.debug,
)

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
app.include_router(
    realtime_ws.router,
)
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
    like.router,
)
app.include_router(
    comments.router,
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


@app.get("/health", status_code=200)
async def health_check():
    """
    Health check endpoint to verify the application's status.
    Returns a 200 OK response if the application is running.
    """
    return {"status": "ok"}


@app.get("/check-logging", status_code=200)
async def check_logging():
    """
    Endpoint to verify that logging is working correctly.
    Logs messages at different levels and returns a 200 OK response.
    """
    logger.debug("Check logging endpoint called.")
    logger.info("Check logging endpoint called.")
    logger.warning("Check logging endpoint called.")
    logger.error("Check logging endpoint called.")
    logger.critical("Check logging endpoint called.")
    # raise Exception("This is a test exception for logging purposes.")
    return {"status": "logging checked"}
