import io
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.core.deps import get_curr_user


def test_upload_image_success(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    files = {"file": ("test.png", io.BytesIO(file_content), "image/png")}

    res = client.post("/media", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["media_type"] == "image"
    assert data["media_url"].startswith("/uploads/")
    assert data["media_url"].endswith(".png")

    # Verify static file serving
    get_res = client.get(data["media_url"])
    assert get_res.status_code == 200
    assert get_res.content == file_content

    # Clean up uploaded test file
    filename = data["media_url"].replace("/uploads/", "")
    filepath = Path("uploads") / filename
    if filepath.exists():
        filepath.unlink()

    app.dependency_overrides.clear()


def test_upload_video_success(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    file_content = b"\x00\x00\x00\x18ftypmp42"
    files = {"file": ("sample.mp4", io.BytesIO(file_content), "video/mp4")}

    res = client.post("/media", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["media_type"] == "video"
    assert data["media_url"].startswith("/uploads/")
    assert data["media_url"].endswith(".mp4")

    # Clean up uploaded test file
    filename = data["media_url"].replace("/uploads/", "")
    filepath = Path("uploads") / filename
    if filepath.exists():
        filepath.unlink()

    app.dependency_overrides.clear()


def test_upload_unsupported_media_type(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    files = {"file": ("doc.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}

    res = client.post("/media", files=files)
    assert res.status_code == 415
    assert res.json()["detail"] == "Unsupported file type"

    app.dependency_overrides.clear()


def test_upload_image_too_large(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    # Over 10 MB limit (10 * 1024 * 1024 + 10 bytes)
    oversized_content = b"X" * (10 * 1024 * 1024 + 10)
    files = {"file": ("huge.jpg", io.BytesIO(oversized_content), "image/jpeg")}

    res = client.post("/media", files=files)
    assert res.status_code == 413
    assert res.json()["detail"] == "File too large"

    app.dependency_overrides.clear()


def test_upload_unauthenticated():
    client = TestClient(app)

    files = {"file": ("test.png", io.BytesIO(b"png"), "image/png")}
    res = client.post("/media", files=files)
    assert res.status_code == 401

