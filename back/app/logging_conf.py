import logging
import sys
import structlog

from app.core.config import settings


def format_event_and_level(logger, method_name, event_dict):
    # 1. Rename default keys to match your target JSON schema
    if "timestamp" in event_dict:
        event_dict["@timestamp"] = event_dict.pop("timestamp")

    if "event" in event_dict:
        event_dict["message"] = event_dict.pop("event")

    # 2. Convert level string to uppercase (e.g., 'info' -> 'INFO')
    if "level" in event_dict:
        event_dict["level"] = event_dict["level"].upper()

    # 3. Handle error fields conditionally
    log_level = event_dict.get("level", "").upper()

    # Extract error_type from kwargs or exc_info if present
    if log_level == "ERROR":
        # If error_type was not passed explicitly in logger.error(), extract it from exc_info
        if "error_type" not in event_dict and "exc_info" in event_dict:
            exc_info = event_dict.get("exc_info")
            if isinstance(exc_info, tuple) and exc_info[0]:
                event_dict["error_type"] = exc_info[0].__name__
            elif isinstance(exc_info, Exception):
                event_dict["error_type"] = type(exc_info).__name__
    event_dict.pop("exc_info", None)
    # event_dict.pop("exception", None)

    return event_dict


def setup_logging():
    # Disable Uvicorn's built-in HTTP request logger
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        # Add a timestamp in ISO 8601 format.
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        # custom processor to format event and level
        format_event_and_level,
        # Render the final event dict as JSON.
        structlog.processors.JSONRenderer(),
    ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            settings.log_level
        ),
        context_class=dict,
        # Write directly to stdout (bypasses standard logging.Logger)
        logger_factory=structlog.WriteLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )
