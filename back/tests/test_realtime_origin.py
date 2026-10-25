from app.realtime.ws import _origin_is_allowed


def test_realtime_origin_allows_configured_origin():
    assert _origin_is_allowed("http://localhost:3000")


def test_realtime_origin_rejects_unconfigured_origin():
    assert not _origin_is_allowed("https://evil-website.com")


def test_realtime_origin_rejects_lookalike_origin():
    assert not _origin_is_allowed("http://localhost:3000.evil-website.com")


def test_realtime_origin_rejects_missing_origin():
    assert not _origin_is_allowed(None)