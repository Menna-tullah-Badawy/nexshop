"""Tiny in-memory sliding-window rate limiter (per path + client IP).

Good enough for a single-process deployment; swap for Redis in a
multi-instance setup. Disabled entirely when settings.rate_limit_enabled
is False (used by the test-suite).
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from ..core.config import get_settings

_buckets: dict[str, deque] = defaultdict(deque)


def _cleanup(now: float) -> None:
    if len(_buckets) > 20000:
        stale = [k for k, dq in _buckets.items() if not dq or dq[-1] < now - 600]
        for k in stale:
            _buckets.pop(k, None)


def rate_limit(max_calls: int, window_seconds: int = 60):
    """FastAPI dependency: allow `max_calls` per `window_seconds` per client."""

    def dependency(request: Request) -> None:
        cfg = get_settings()
        if not cfg.rate_limit_enabled:
            return
        ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}|{ip}"
        now = time.monotonic()
        dq = _buckets[key]
        while dq and dq[0] < now - window_seconds:
            dq.popleft()
        if len(dq) >= max_calls:
            raise HTTPException(status_code=429, detail="Too many requests — slow down and try again")
        dq.append(now)
        _cleanup(now)

    return dependency


def reset_buckets() -> None:
    _buckets.clear()
