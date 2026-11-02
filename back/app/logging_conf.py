import logging
import sys
import structlog

from app.core.config import settings


def format_event_and_level(logger, method_name, event_dict):
    if "timestamp" in event_dict:
        event_dict["@timestamp"] = event_dict.pop("timestamp")

    if "event" in event_dict:
        event_dict["message"] = event_dict.pop("event")

    if "level" in event_dict:
        event_dict["level"] = event_dict["level"].upper()

    log_level = event_dict.get("level", "").upper()

    if log_level == "ERROR":
        if "error_type" not in event_dict and "exc_info" in event_dict:
            exc_info = event_dict.get("exc_info")
            if isinstance(exc_info, tuple) and exc_info[0]:
                event_dict["error_type"] = exc_info[0].__name__
            elif isinstance(exc_info, Exception):
                event_dict["error_type"] = type(exc_info).__name__
    event_dict.pop("exc_info", None)
    return event_dict


def setup_logging():
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        format_event_and_level,
        structlog.processors.JSONRenderer(),
    ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            settings.log_level
        ),
        context_class=dict,
        logger_factory=structlog.WriteLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )
