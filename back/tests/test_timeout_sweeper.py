import asyncio
from unittest.mock import Mock

import pytest

from app import main
from app.realtime import registry


def test_timeout_sweeper_runs_every_30_seconds(monkeypatch):
    sleep_calls = []
    sweep = Mock()

    async def stop_after_two_sweeps(seconds):
        sleep_calls.append(seconds)
        if len(sleep_calls) == 3:
            raise asyncio.CancelledError

    monkeypatch.setattr(main.asyncio, "sleep", stop_after_two_sweeps)
    monkeypatch.setattr(registry, "sweep_timeouts", sweep)

    with pytest.raises(asyncio.CancelledError):
        asyncio.run(main._timeout_sweep_loop())

    assert sleep_calls == [30, 30, 30]
    assert sweep.call_count == 2