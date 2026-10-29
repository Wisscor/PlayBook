from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException

AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_AVATAR_SIZE = 5 * 1024 * 1024


def remove_avatar(path: str | Path | None) -> None:
    if path:
        Path(path).unlink(missing_ok=True)


async def store_avatar(
    file: UploadFile,
    upload_dir: Path,
) -> tuple[str, Path]:
    content_type = (file.content_type or "").lower()
    extension = AVATAR_TYPES.get(content_type)
    if extension is None:
        raise ApiException(
            code=ErrorCode.UNSUPPORTED_MEDIA_TYPE,
            field="avatar",
        )

    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    filepath = upload_dir / filename
    size = 0

    try:
        with filepath.open("wb") as destination:
            while chunk := await file.read(1024 * 64):
                size += len(chunk)
                if size > MAX_AVATAR_SIZE:
                    raise ApiException(
                        code=ErrorCode.PAYLOAD_TOO_LARGE,
                        field="avatar",
                    )
                destination.write(chunk)
    except Exception:
        remove_avatar(filepath)
        raise

    return f"uploads/{filename}", filepath
