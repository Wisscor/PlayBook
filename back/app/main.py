import asyncio
import time
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
from app.logging_conf import setup_logging
from app.core.exception_handlers import register_exception_handlers

setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
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
app.state.limiter = limiter

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def structlog_middleware(request: Request, call_next):
    structlog.contextvars.clear_contextvars()

    structlog.contextvars.bind_contextvars(
        service=settings.app_name,
        method=request.method,
        path=request.url.path,
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
add_pagination(app)


@app.get("/health", status_code=200)
async def health_check(request: Request):
    """
    Health check endpoint to verify the application's status.
    Returns a 200 OK response if the application is running.
    """
    return {"status": "ok"}
