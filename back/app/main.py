from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, Response
from .db.database import engine, Base
from .core.config import settings
from .routers import auth
from .routers import users
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
app.include_router(
    users.router,
)


@app.get("/health", status_code=200)
async def health_check():
    """
    Health check endpoint to verify the application's status.
    Returns a 200 OK response if the application is running.
    """
    logger.debug("Health check endpoint called.")
    logger.info("Health check endpoint called.")
    logger.warning("Health check endpoint called.")
    logger.error("Health check endpoint called.")
    logger.critical("Health check endpoint called.")

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
