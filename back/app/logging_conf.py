import logging
import sys
from pythonjsonlogger import jsonlogger
from .core.config import settings

def setup_logging():
    # 1. Root logger
    logger = logging.getLogger()

    logger.setLevel(settings.log_level)
    
    # 2. Console stream handler (stdout for Docker)
    log_handler = logging.StreamHandler(sys.stdout)

    # 3. JSON Formatter specifying the fields you want
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        rename_fields={"levelname": "level", "asctime": "timestamp"},
    )
    log_handler.setFormatter(formatter)

    # Clear existing default handlers and add our JSON handler
    logger.handlers.clear()
    logger.addHandler(log_handler)

    # Intercept Uvicorn default loggers so server logs are also JSON
    for name in (
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "sqlalchemy.engine",
    ):
        lg = logging.getLogger(name)
        lg.setLevel(settings.log_level)
        lg.handlers.clear()
        lg.addHandler(log_handler)
        lg.propagate = False
