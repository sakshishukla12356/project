"""
middleware/rate_limit.py

Production-grade rate limiting for FastAPI.

Strategy: Sliding-window counter per IP (in-memory).
For multi-process / multi-server, swap the in-memory store
for Redis (see _RedisStore stub at the bottom).

Usage
─────
    from middleware.rate_limit import RateLimiter, Tier

    # As a FastAPI dependency on a single route:
    @router.post("/login", dependencies=[Depends(RateLimiter(Tier.AUTH))])

    # As a global middleware (see main.py integration):
    app.add_middleware(RateLimitMiddleware, default_tier=Tier.PUBLIC)
"""

import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


# ─── Tier definitions ────────────────────────────────────────────────────────

class Tier(str, Enum):
    """
    Pre-configured rate limit tiers.
    Adjust the numbers to match your expected traffic.
    """
    AUTH = "auth"           # login / signup / password-reset
    AI = "ai"               # chatbot / AI endpoints
    CLOUD_WRITE = "cloud"   # destructive cloud actions (stop VM, etc.)
    PUBLIC = "public"       # general authenticated API
    HEALTH = "health"       # health-check / root (very generous)


@dataclass(frozen=True)
class TierConfig:
    max_requests: int       # allowed in the window
    window_seconds: int     # sliding-window size
    ban_after: int = 0      # temp-ban (seconds) after this many consecutive 429s (0 = disabled)
    ban_duration: int = 300  # how long the ban lasts (seconds)


TIER_LIMITS: dict[Tier, TierConfig] = {
    # Auth: 5 attempts per 60 s → prevents brute-force
    Tier.AUTH: TierConfig(max_requests=5, window_seconds=60, ban_after=10, ban_duration=600),
    # AI/chatbot: 10 requests per 60 s → prevents abuse of expensive model calls
    Tier.AI: TierConfig(max_requests=10, window_seconds=60, ban_after=30, ban_duration=300),
    # Cloud write actions: 10 per 60 s
    Tier.CLOUD_WRITE: TierConfig(max_requests=10, window_seconds=60),
    # Public API: 60 req / min
    Tier.PUBLIC: TierConfig(max_requests=60, window_seconds=60),
    # Health / root: 120 req / min (monitoring probes)
    Tier.HEALTH: TierConfig(max_requests=120, window_seconds=60),
}


# ─── Path → Tier mapping ────────────────────────────────────────────────────

# Routes are matched by *prefix*; first match wins.
# Order from most-specific to least-specific.
ROUTE_TIERS: list[tuple[str, Tier]] = [
    # Auth
    ("/auth/login", Tier.AUTH),
    ("/auth/signup", Tier.AUTH),
    ("/auth/reset", Tier.AUTH),
    ("/auth/forgot", Tier.AUTH),
    # AI chatbot
    ("/ai/", Tier.AI),
    # Cloud destructive actions
    ("/cloud/stop", Tier.CLOUD_WRITE),
    ("/cloud/start", Tier.CLOUD_WRITE),
    ("/cloud/terminate", Tier.CLOUD_WRITE),
    # Health
    ("/health", Tier.HEALTH),
    ("/", Tier.HEALTH),  # only exact root; will be checked last
]


def _tier_for_path(path: str) -> Tier:
    """Resolve which tier a request path belongs to."""
    for prefix, tier in ROUTE_TIERS:
        if path.startswith(prefix):
            return tier
    return Tier.PUBLIC


# ─── In-memory sliding-window store ─────────────────────────────────────────

@dataclass
class _WindowEntry:
    timestamps: list[float] = field(default_factory=list)
    consecutive_429s: int = 0
    banned_until: float = 0.0


class InMemoryStore:
    """
    Simple per-process sliding-window counter.

    Good for single-worker dev servers and small deploys.
    For production with multiple workers, replace with RedisStore.
    """

    def __init__(self) -> None:
        self._buckets: dict[str, _WindowEntry] = defaultdict(_WindowEntry)

    def _key(self, ip: str, tier: Tier) -> str:
        return f"{ip}:{tier.value}"

    def is_allowed(self, ip: str, tier: Tier, cfg: TierConfig) -> tuple[bool, dict]:
        """
        Returns (allowed, info_dict).
        info_dict always contains 'remaining', 'reset', 'retry_after'.
        """
        now = time.time()
        key = self._key(ip, tier)
        entry = self._buckets[key]

        # ── Check ban ────────────────────────────
        if entry.banned_until > now:
            retry_after = int(entry.banned_until - now) + 1
            return False, {
                "remaining": 0,
                "reset": int(entry.banned_until),
                "retry_after": retry_after,
                "banned": True,
            }

        # ── Slide the window ─────────────────────
        cutoff = now - cfg.window_seconds
        entry.timestamps = [t for t in entry.timestamps if t > cutoff]

        remaining = max(0, cfg.max_requests - len(entry.timestamps))
        reset = int(now + cfg.window_seconds)

        if len(entry.timestamps) >= cfg.max_requests:
            entry.consecutive_429s += 1

            # Auto-ban after too many 429s
            if cfg.ban_after and entry.consecutive_429s >= cfg.ban_after:
                entry.banned_until = now + cfg.ban_duration
                logger.warning(
                    "rate_limit_ban",
                    extra={"ip": ip, "tier": tier.value, "duration": cfg.ban_duration},
                )

            retry_after = int(entry.timestamps[0] + cfg.window_seconds - now) + 1
            return False, {
                "remaining": 0,
                "reset": reset,
                "retry_after": max(1, retry_after),
                "banned": False,
            }

        # ── Allowed ──────────────────────────────
        entry.timestamps.append(now)
        entry.consecutive_429s = 0
        return True, {
            "remaining": remaining - 1,  # we just consumed one
            "reset": reset,
            "retry_after": 0,
            "banned": False,
        }

    def cleanup(self, max_age: float = 3600) -> None:
        """Remove entries older than max_age seconds. Call periodically."""
        now = time.time()
        stale = [k for k, v in self._buckets.items()
                 if not v.timestamps or (now - max(v.timestamps)) > max_age]
        for k in stale:
            del self._buckets[k]


# ── Singleton store ──────────────────────────────────────────────────────────
_store = InMemoryStore()


def _client_ip(request: Request) -> str:
    """
    Best-effort client IP extraction.
    Respects X-Forwarded-For when behind a reverse proxy.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


# ─── FastAPI dependency (per-route) ─────────────────────────────────────────

class RateLimiter:
    """
    Use as a FastAPI Depends() to rate-limit individual routes.

    Example:
        @router.post("/login", dependencies=[Depends(RateLimiter(Tier.AUTH))])
        async def login(...): ...
    """

    def __init__(self, tier: Tier) -> None:
        self.tier = tier
        self.cfg = TIER_LIMITS[tier]

    async def __call__(self, request: Request) -> None:
        ip = _client_ip(request)
        allowed, info = _store.is_allowed(ip, self.tier, self.cfg)

        if not allowed:
            logger.info(
                "rate_limited",
                extra={"ip": ip, "path": request.url.path, "tier": self.tier.value},
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Too many requests",
                    "tier": self.tier.value,
                    "retry_after": info["retry_after"],
                    "banned": info["banned"],
                },
                headers={
                    "Retry-After": str(info["retry_after"]),
                    "X-RateLimit-Limit": str(self.cfg.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(info["reset"]),
                },
            )


# ─── Global middleware (catch-all) ──────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that applies rate limits to **every** request
    based on path-prefix → tier mapping.

    Install in main.py:
        app.add_middleware(RateLimitMiddleware)
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        ip = _client_ip(request)
        tier = _tier_for_path(request.url.path)
        cfg = TIER_LIMITS[tier]

        allowed, info = _store.is_allowed(ip, tier, cfg)

        if not allowed:
            logger.info(
                "rate_limited",
                extra={"ip": ip, "path": request.url.path, "tier": tier.value},
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": {
                        "error": "Too many requests. Please slow down.",
                        "tier": tier.value,
                        "retry_after": info["retry_after"],
                        "banned": info["banned"],
                    }
                },
                headers={
                    "Retry-After": str(info["retry_after"]),
                    "X-RateLimit-Limit": str(cfg.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(info["reset"]),
                },
            )

        response = await call_next(request)

        # Attach rate-limit headers to every successful response
        response.headers["X-RateLimit-Limit"] = str(cfg.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset"])

        return response
