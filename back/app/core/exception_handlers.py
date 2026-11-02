import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.error_codes import ErrorCode, ERROR_STATUS
from app.core.exceptions import ApiException

logger = logging.getLogger(__name__)

code_by_status = {
    401: ErrorCode.AUTHENTICATION_REQUIRED,
    403: ErrorCode.PERMISSION_DENIED,
    404: ErrorCode.USER_NOT_FOUND,
}


async def _api_exception_handler(
    request: Request,
    exc: ApiException,
) -> JSONResponse:
    status = ERROR_STATUS.get(exc.code, 500)
    error = {
        "code": exc.code.value,
        "field": exc.field,
        "message": exc.message,
        "url": str(request.url),
    }
    return JSONResponse(
        status_code=int(status),
        content={"error": error},
    )


async def _validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    details = [
        {
            "field": ".".join(str(part) for part in err["loc"][1:]),
            "code": err["type"].upper(),
            "message": err["msg"],
        }
        for err in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": ErrorCode.VALIDATION_ERROR.value,
                "message": "Request validation failed",
                "url": str(request.url),
                "details": details,
            }
        },
    )


async def _http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:

    code = code_by_status.get(
        exc.status_code,
        (
            ErrorCode.INTERNAL_SERVER_ERROR
            if exc.status_code >= 500
            else f"HTTP_{exc.status_code}"
        ),
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code.value if isinstance(code, ErrorCode) else code,
                "message": str(exc.detail),
                "url": str(request.url),
            }
        },
    )


async def _unexpected_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception("Unhandled API exception", exc_info=exc)

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": ErrorCode.INTERNAL_SERVER_ERROR.value,
                "message": "Internal server error",
                "url": str(request.url),
            }
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler,
    )

    app.add_exception_handler(
        ApiException,
        _api_exception_handler,
    )
    app.add_exception_handler(
        RequestValidationError,
        _validation_exception_handler,
    )
    app.add_exception_handler(
        HTTPException,
        _http_exception_handler,
    )
    app.add_exception_handler(
        Exception,
        _unexpected_exception_handler,
    )
