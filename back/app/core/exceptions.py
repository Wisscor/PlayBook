from app.core.error_codes import ErrorCode
from typing import Optional

DEFAULT_MESSAGES = {
    ErrorCode.VALIDATION_ERROR: "The request contains invalid data.",
    ErrorCode.BAD_REQUEST: "The request is invalid.",
    ErrorCode.USER_NOT_FOUND: "User not found.",
    ErrorCode.SPORT_NOT_FOUND: "Sport not found.",
    ErrorCode.POST_NOT_FOUND: "Post not found.",
    ErrorCode.ANNOUNCEMENT_NOT_FOUND: "Match announcement not found.",
    ErrorCode.PLAY_REQUEST_NOT_FOUND: "Play request not found.",
    ErrorCode.FOLLOW_NOT_FOUND: "Follow relationship not found.",
    ErrorCode.CONVERSATION_NOT_FOUND: "Conversation not found.",
    ErrorCode.MESSAGE_NOT_FOUND: "Message not found.",
    ErrorCode.EMAIL_ALREADY_EXISTS: "A user with this email already exists.",
    ErrorCode.USERNAME_ALREADY_EXISTS: "A user with this username already exists.",
    ErrorCode.AUTHENTICATION_REQUIRED: "Authentication is required.",
    ErrorCode.PERMISSION_DENIED: "You do not have permission to perform this action.",
    ErrorCode.RESOURCE_CONFLICT: "The request conflicts with the current resource state.",
    ErrorCode.PAYLOAD_TOO_LARGE: "The uploaded payload is too large.",
    ErrorCode.UNSUPPORTED_MEDIA_TYPE: "The uploaded media type is not supported.",
    ErrorCode.RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
    ErrorCode.INVALID_CREDENTIALS: "The provided credentials are invalid.",
    ErrorCode.INTERNAL_SERVER_ERROR: "An internal server error occurred.",
    ErrorCode.INVALID_SESSION_ID_FORMAT: "The session ID format is invalid.",
    ErrorCode.CANNOT_FOLLOW_SELF: "You cannot follow yourself.",
    ErrorCode.ALREADY_FOLLOWING: "You are already following this user.",
    ErrorCode.CANNOT_UNFOLLOW_SELF: "You cannot unfollow yourself.",
    ErrorCode.ANNOUNCEMENT_NOT_ACCEPTING_REQUESTS: (
        "This announcement is not accepting play requests."
    ),
    ErrorCode.ANNOUNCEMENT_FULL: "This announcement has no open player slots.",
    ErrorCode.REQUEST_ALREADY_SENT: "You already sent a request for this announcement.",
    ErrorCode.REQUEST_ALREADY_DECIDED: "This play request has already been decided.",
    ErrorCode.ANNOUNCEMENT_ALREADY_FINISHED: "This announcement is already finished.",
}


class ApiException(Exception):
    def __init__(
        self,
        code: ErrorCode,
        field: Optional[str] = None,
        message: Optional[str] = None,
    ):
        self.code = code
        self.field = field
        self.message = message or DEFAULT_MESSAGES.get(code, code.value)
        super().__init__(self.message)
