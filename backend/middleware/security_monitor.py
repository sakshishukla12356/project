"""
middleware/security_monitor.py

Starlette middleware that silently monitors every request and:
  1. Assigns a unique request_id for tracing
  2. Detects API spikes per IP
  3. Enforces intrusion-detector bans
  4. Logs WARNING / CRITICAL events to the audit DB
  5. Adds security headers to every response

Install in main.py (AFTER rate-limit middleware):
    app.add_middleware(SecurityMonitorMiddleware)
"""

import json
import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from database.base import AsyncSessionLocal
from services.security_service import (
    EventType,
    Severity,
    detector,
    log_security_event,
)

logger = logging.getLogger(__name__)

# Paths that are high-volume / low-value — skip heavy tracking
_SKIP_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


class SecurityMonitorMiddleware(BaseHTTPMiddleware):
    """
    Non-blocking security monitor.

    It runs alongside the rate-limiter but focuses on *detection & logging*
    rather than enforcement (the rate-limiter handles 429s).
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # ── Request ID for tracing ───────────────
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id

        ip = _client_ip(request)
        path = request.url.path
        method = request.method
        user_agent = request.headers.get("user-agent", "")[:512]

        start = time.time()

        # ── Check intrusion-detector ban ─────────
        banned, remaining = detector.is_banned(ip)
        if banned:
            # Log the blocked attempt
            await self._log_event_safe(
                event_type=EventType.ACCOUNT_LOCKED,
                severity=Severity.CRITICAL,
                ip=ip,
                message=f"Banned IP attempted access ({remaining}s remaining)",
                method=method,
                path=path,
                user_agent=user_agent,
                request_id=request_id,
            )
            return JSONResponse(
                status_code=403,
                content={
                    "detail": {
                        "error": "Access temporarily blocked due to suspicious activity.",
                        "retry_after": remaining,
                    }
                },
                headers={
                    "Retry-After": str(remaining),
                    "X-Request-ID": request_id,
                },
            )

        # ── Skip low-value paths ─────────────────
        if path in _SKIP_PATHS:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response

        # ── API spike detection ──────────────────
        spike_alert = detector.record_request(ip)
        if spike_alert:
            await self._log_event_safe(
                event_type=EventType.API_SPIKE,
                severity=Severity.WARNING,
                ip=ip,
                message=f"Unusual request spike detected from {ip}",
                method=method,
                path=path,
                user_agent=user_agent,
                request_id=request_id,
            )

        # ── Process the request ──────────────────
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000, 1)

        # ── Attach security headers (FastAPI Helmet) ──
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # ── Track auth failures ──────────────────
        status_code = response.status_code

        if status_code == 401 and "/auth/" in path:
            alert = detector.record_failed_login(ip)
            severity = Severity.INFO
            event_type = EventType.LOGIN_FAILED

            if alert == EventType.BRUTE_FORCE:
                event_type = EventType.BRUTE_FORCE
                severity = Severity.WARNING
            elif alert == EventType.ACCOUNT_LOCKED:
                event_type = EventType.ACCOUNT_LOCKED
                severity = Severity.CRITICAL

            await self._log_event_safe(
                event_type=event_type,
                severity=severity,
                ip=ip,
                message=f"Auth failure on {path} from {ip}",
                method=method,
                path=path,
                user_agent=user_agent,
                status_code=status_code,
                request_id=request_id,
                details={"duration_ms": duration_ms},
            )

        elif status_code == 200 and path == "/auth/login" and method == "POST":
            detector.record_login_success(ip)
            await self._log_event_safe(
                event_type=EventType.LOGIN_SUCCESS,
                severity=Severity.INFO,
                ip=ip,
                message=f"Successful login from {ip}",
                method=method,
                path=path,
                user_agent=user_agent,
                status_code=status_code,
                request_id=request_id,
                details={"duration_ms": duration_ms},
            )

        elif status_code == 429:
            await self._log_event_safe(
                event_type=EventType.RATE_LIMITED,
                severity=Severity.WARNING,
                ip=ip,
                message=f"Rate limited on {path} from {ip}",
                method=method,
                path=path,
                user_agent=user_agent,
                status_code=status_code,
                request_id=request_id,
            )

        elif status_code == 403:
            await self._log_event_safe(
                event_type=EventType.FORBIDDEN_ACCESS,
                severity=Severity.WARNING,
                ip=ip,
                message=f"Forbidden access attempt on {path} from {ip}",
                method=method,
                path=path,
                user_agent=user_agent,
                status_code=status_code,
                request_id=request_id,
            )

        # ── Structured access log ────────────────
        logger.info(
            "request_trace",
            extra={
                "request_id": request_id,
                "ip": ip,
                "method": method,
                "path": path,
                "status": status_code,
                "duration_ms": duration_ms,
                "user_agent": user_agent[:100],
            },
        )

        return response

    # ── Safe DB logging (never crash the request) ─

    async def _log_event_safe(
        self,
        event_type: str,
        severity: str,
        ip: str,
        message: str,
        method: str = None,
        path: str = None,
        user_agent: str = None,
        status_code: int = None,
        request_id: str = None,
        user_id: int = None,
        user_email: str = None,
        details: dict = None,
    ):
        """
        Log to DB inside its own session so a DB error
        never crashes the user's request.
        """
        try:
            async with AsyncSessionLocal() as session:
                await log_security_event(
                    db=session,
                    event_type=event_type,
                    severity=severity,
                    ip_address=ip,
                    message=message,
                    method=method,
                    path=path,
                    user_agent=user_agent,
                    status_code=status_code,
                    request_id=request_id,
                    user_id=user_id,
                    user_email=user_email,
                    details=details,
                )
        except Exception as exc:
            # Never let audit-logging break a user request
            logger.error("security_log_failed", extra={"error": str(exc)})
