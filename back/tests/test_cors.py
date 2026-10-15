from fastapi.testclient import TestClient
from app.main import app


def test_cors_preflight_authorized_origin():
    client = TestClient(app)
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    res = client.options("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert res.headers.get("access-control-allow-credentials") == "true"
    assert "POST" in res.headers.get("access-control-allow-methods", "")


def test_cors_preflight_unauthorized_origin():
    client = TestClient(app)
    headers = {
        "Origin": "http://evil-website.com",
        "Access-Control-Request-Method": "POST",
    }
    res = client.options("/health", headers=headers)
    assert res.headers.get("access-control-allow-origin") is None


def test_cors_get_authorized_origin():
    client = TestClient(app)
    headers = {"Origin": "http://localhost:5173"}
    res = client.get("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_get_unauthorized_origin():
    client = TestClient(app)
    headers = {"Origin": "http://unauthorized-domain.com"}
    res = client.get("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") is None

