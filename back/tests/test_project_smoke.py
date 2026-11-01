from app.main import app


def test_application_registers_core_and_realtime_routes():
    routes = {
        (method.upper(), path)
        for path, operation in app.openapi()["paths"].items()
        for method in operation
        if method != "parameters"
    }

    expected = {
        ("POST", "/auth/signup"),
        ("POST", "/auth/login"),
        ("GET", "/users/me"),
        ("PATCH", "/users/me"),
        ("GET", "/realtime/notifications"),
        ("POST", "/realtime/notifications/read"),
        ("GET", "/realtime/conversations"),
    }
    assert expected <= routes


def test_uploads_mount_is_registered():
    assert any(
        getattr(route, "path", None) == "/uploads" for route in app.routes
    )
