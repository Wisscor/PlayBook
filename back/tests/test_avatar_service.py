from pathlib import Path
from unittest.mock import AsyncMock

import pytest

from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.services.avatar_service import MAX_AVATAR_SIZE, remove_avatar, store_avatar


def make_upload(content_type, chunks):
    upload = AsyncMock()
    upload.content_type = content_type
    upload.read.side_effect = [*chunks, b""]
    return upload


@pytest.mark.asyncio
async def test_store_avatar_writes_supported_upload(tmp_path):
    upload = make_upload("image/png", [b"png-data"])

    relative_path, filepath = await store_avatar(upload, tmp_path)

    assert relative_path.startswith("uploads/")
    assert filepath.exists()
    assert filepath.read_bytes() == b"png-data"


def test_remove_avatar_deletes_existing_file(tmp_path):
    filepath = Path(tmp_path) / "old.png"
    filepath.write_bytes(b"old")

    remove_avatar(filepath)

    assert not filepath.exists()


@pytest.mark.asyncio
async def test_store_avatar_rejects_unsupported_media(tmp_path):
    upload = make_upload("application/pdf", [b"pdf"])

    with pytest.raises(ApiException) as caught:
        await store_avatar(upload, tmp_path)

    assert caught.value.code == ErrorCode.UNSUPPORTED_MEDIA_TYPE
    assert list(tmp_path.iterdir()) == []


@pytest.mark.asyncio
async def test_store_avatar_removes_partial_oversized_file(tmp_path):
    upload = make_upload("image/jpeg", [b"x" * (MAX_AVATAR_SIZE + 1)])

    with pytest.raises(ApiException) as caught:
        await store_avatar(upload, tmp_path)

    assert caught.value.code == ErrorCode.PAYLOAD_TOO_LARGE
    assert list(tmp_path.iterdir()) == []
