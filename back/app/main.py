from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database.database import engine, Base
from .core.config import settings
from .routers import auth
from .realtime import models as realtime_models
from .realtime import rest as realtime_rest
from .realtime import ws as realtime_ws
from .routers import users
from .routers import post
from .routers import followers
import logging

from .logging_conf import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):

    async with engine.begin() as connection:  # Create tables if they don't exist
        await connection.run_sync(Base.metadata.create_all)

    yield

    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.debug,
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
