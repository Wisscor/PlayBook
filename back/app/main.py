import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import structlog
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

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
from app.logging_conf import setup_logging

setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Create database tables if they don't exist, then seed required data.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async for db in get_db():
            await seed_sports(db)
    except Exception as e:
        logger.error(
            "Failed to create database tables",
            error_type=type(e).__name__,
            exc_info=True,
        )
        raise e
    yield
    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.debug,
)
# Stores the limiter in the app's state for global access
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def structlog_middleware(request: Request, call_next):
    structlog.contextvars.clear_contextvars()

    structlog.contextvars.bind_contextvars(
        service=settings.app_name,
        method=request.method,  # !!!!!!
        path=request.url.path,  # !!!!!!
    )

    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        process_time = time.perf_counter() - start_time

        logger.info(
            "HTTP request_completed",
            status_code=response.status_code,
            duration_ms=round(process_time * 1000, 1),
        )
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 1)

        # ERROR LOG (Includes error_type)
        logger.error(
            "HTTP request failed",
            status_code=500,
            duration_ms=duration_ms,
            error_type=type(exc).__name__,  # Explicit error_type
            exc_info=True,  # (Optional) includes stack trace
        )
        raise exc


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


@app.get("/health", status_code=200)
@limiter.limit("5/minute")
async def health_check(request: Request):
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


# !!! REMOVE ME AFTER TESTING
@app.post("/api/games")
async def create_game():
    return {"status": "created"}


@app.get("/api/fail")
async def trigger_failure():
    raise DatabaseError("Connection timeout [FOR TEST]")


class DatabaseError(Exception):
    pass
