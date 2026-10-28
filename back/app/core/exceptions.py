from app.core.error_codes import ErrorCode


class ApiException(Exception):
    def __init__(
        self,
        code: ErrorCode,
        field: str | None = None,
    ):
        self.code = code
        self.field = field
        super().__init__(code.value)