"""
services/security_service.py

Core security monitoring engine.

Responsibilities
────────────────
• Record security events to the audit_log table
• Detect intrusion patterns (brute-force, IP hopping, token abuse)
• Manage temporary IP bans
• Provide query helpers for the security dashboard
"""

import json
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional

from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.security_event import SecurityEvent

logger = logging.getLogger(__name__)


# ─── Event types ─────────────────────────────────────────────────────────────

class EventType(str, Enum):
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    SIGNUP = "SIGNUP"
    BRUTE_FORCE = "BRUTE_FORCE"
    RATE_LIMITED = "RATE_LIMITED"
    TOKEN_INVALID = "TOKEN_INVALID"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    SUSPICIOUS_IP = "SUSPICIOUS_IP"
    MULTI_IP_ACCESS = "MULTI_IP_ACCESS"
    API_SPIKE = "API_SPIKE"
    CLOUD_ACTION = "CLOUD_ACTION"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    FORBIDDEN_ACCESS = "FORBIDDEN_ACCESS"
    REQUEST_TRACE = "REQUEST_TRACE"


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


# ─── In-memory intrusion detection state ─────────────────────────────────────

@dataclass
class _IPProfile:
    """Tracks per-IP behaviour within a sliding window."""
    failed_logins: list = field(default_factory=list)   # timestamps
    request_times: list = field(default_factory=list)   # timestamps
    user_ids_seen: set = field(default_factory=set)      # distinct user IDs
    banned_until: float = 0.0


class IntrusionDetector:
    """
    In-memory anomaly detector.  For multi-process deployments,
    replace with Redis-backed state.
    """

    # ── Thresholds (tune to your traffic) ────────
    FAILED_LOGIN_WINDOW = 300       # 5 minutes
    FAILED_LOGIN_THRESHOLD = 5      # → triggers BRUTE_FORCE alert
    LOCKOUT_AFTER = 10              # → triggers ACCOUNT_LOCKED
    LOCKOUT_DURATION = 900          # 15-minute lockout

    SPIKE_WINDOW = 60               # 1 minute
    SPIKE_THRESHOLD = 100           # requests / minute → API_SPIKE

    MULTI_IP_WINDOW = 600           # 10 minutes
    MULTI_IP_THRESHOLD = 5          # distinct IPs for same user → alert

    def __init__(self):
        self._ips: dict[str, _IPProfile] = defaultdict(_IPProfile)
        self._user_ips: dict[int, list] = defaultdict(list)  # user_id → [(ts, ip)]

    # ── Failed-login tracking ────────────────────

    def record_failed_login(self, ip: str) -> Optional[str]:
        """
        Record a failed login from `ip`.
        Returns an EventType string if a threshold was crossed, else None.
        """
        now = time.time()
        profile = self._ips[ip]
        cutoff = now - self.FAILED_LOGIN_WINDOW
        profile.failed_logins = [t for t in profile.failed_logins if t > cutoff]
        profile.failed_logins.append(now)

        count = len(profile.failed_logins)

        if count >= self.LOCKOUT_AFTER:
            profile.banned_until = now + self.LOCKOUT_DURATION
            return EventType.ACCOUNT_LOCKED

        if count >= self.FAILED_LOGIN_THRESHOLD:
            return EventType.BRUTE_FORCE

        return None

    def record_login_success(self, ip: str):
        """Reset failed-login counter on success."""
        self._ips[ip].failed_logins.clear()

    # ── API spike detection ──────────────────────

    def record_request(self, ip: str) -> Optional[str]:
        """Returns EventType.API_SPIKE if the IP is hammering the API."""
        now = time.time()
        profile = self._ips[ip]
        cutoff = now - self.SPIKE_WINDOW
        profile.request_times = [t for t in profile.request_times if t > cutoff]
        profile.request_times.append(now)

        if len(profile.request_times) >= self.SPIKE_THRESHOLD:
            return EventType.API_SPIKE
        return None

    # ── Multi-IP detection (same user, many IPs) ─

    def record_user_ip(self, user_id: int, ip: str) -> Optional[str]:
        """Returns EventType.MULTI_IP_ACCESS if a user logs in from too many IPs."""
        now = time.time()
        cutoff = now - self.MULTI_IP_WINDOW
        entries = self._user_ips[user_id]
        entries = [(t, addr) for t, addr in entries if t > cutoff]
        entries.append((now, ip))
        self._user_ips[user_id] = entries

        distinct_ips = {addr for _, addr in entries}
        if len(distinct_ips) >= self.MULTI_IP_THRESHOLD:
            return EventType.MULTI_IP_ACCESS
        return None

    # ── Ban check ────────────────────────────────

    def is_banned(self, ip: str) -> tuple[bool, int]:
        """Returns (banned, seconds_remaining)."""
        profile = self._ips[ip]
        now = time.time()
        if profile.banned_until > now:
            return True, int(profile.banned_until - now) + 1
        return False, 0

    # ── Cleanup ──────────────────────────────────

    def cleanup(self, max_age: float = 3600):
        stale = [k for k, v in self._ips.items()
                 if not v.failed_logins and not v.request_times]
        for k in stale:
            del self._ips[k]


# ── Global singleton ─────────────────────────────────────────────────────────
detector = IntrusionDetector()


# ─── Audit trail — DB persistence ────────────────────────────────────────────

async def log_security_event(
    db: AsyncSession,
    event_type: str,
    severity: str,
    ip_address: str,
    message: str,
    *,
    user_id: int = None,
    user_email: str = None,
    method: str = None,
    path: str = None,
    user_agent: str = None,
    status_code: int = None,
    details: dict = None,
    request_id: str = None,
) -> SecurityEvent:
    """Persist a security event to the audit log."""
    event = SecurityEvent(
        event_type=event_type,
        severity=severity,
        ip_address=ip_address,
        message=message,
        user_id=user_id,
        user_email=user_email,
        method=method,
        path=path,
        user_agent=user_agent,
        status_code=status_code,
        details=json.dumps(details) if details else None,
        request_id=request_id,
    )
    db.add(event)
    await db.commit()

    # Also emit structured log for external systems (ELK / Grafana / Sentry)
    log_fn = logger.info if severity == "INFO" else (
        logger.warning if severity == "WARNING" else logger.critical
    )
    log_fn(
        "security_event",
        extra={
            "event_type": event_type,
            "severity": severity,
            "ip": ip_address,
            "user_id": user_id,
            "path": path,
            "message": message,
            "request_id": request_id,
        },
    )
    return event


# ─── Dashboard query helpers ─────────────────────────────────────────────────

async def get_recent_events(
    db: AsyncSession,
    limit: int = 50,
    severity: str = None,
    event_type: str = None,
    ip_address: str = None,
    user_id: int = None,
    hours: int = 24,
) -> list[dict]:
    """Query recent security events with optional filters."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    conditions = [SecurityEvent.created_at >= since]

    if severity:
        conditions.append(SecurityEvent.severity == severity)
    if event_type:
        conditions.append(SecurityEvent.event_type == event_type)
    if ip_address:
        conditions.append(SecurityEvent.ip_address == ip_address)
    if user_id:
        conditions.append(SecurityEvent.user_id == user_id)

    stmt = (
        select(SecurityEvent)
        .where(and_(*conditions))
        .order_by(desc(SecurityEvent.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    events = result.scalars().all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "severity": e.severity,
            "ip_address": e.ip_address,
            "user_id": e.user_id,
            "user_email": e.user_email,
            "method": e.method,
            "path": e.path,
            "status_code": e.status_code,
            "message": e.message,
            "details": json.loads(e.details) if e.details else None,
            "request_id": e.request_id,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


async def get_event_stats(db: AsyncSession, hours: int = 24) -> dict:
    """Aggregate stats for the security dashboard."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    # Total events by severity
    severity_stmt = (
        select(SecurityEvent.severity, func.count(SecurityEvent.id))
        .where(SecurityEvent.created_at >= since)
        .group_by(SecurityEvent.severity)
    )
    severity_result = await db.execute(severity_stmt)
    by_severity = {row[0]: row[1] for row in severity_result}

    # Total events by type
    type_stmt = (
        select(SecurityEvent.event_type, func.count(SecurityEvent.id))
        .where(SecurityEvent.created_at >= since)
        .group_by(SecurityEvent.event_type)
        .order_by(desc(func.count(SecurityEvent.id)))
        .limit(20)
    )
    type_result = await db.execute(type_stmt)
    by_type = {row[0]: row[1] for row in type_result}

    # Top offending IPs
    ip_stmt = (
        select(SecurityEvent.ip_address, func.count(SecurityEvent.id))
        .where(
            SecurityEvent.created_at >= since,
            SecurityEvent.severity.in_(["WARNING", "CRITICAL"]),
        )
        .group_by(SecurityEvent.ip_address)
        .order_by(desc(func.count(SecurityEvent.id)))
        .limit(10)
    )
    ip_result = await db.execute(ip_stmt)
    top_ips = [{"ip": row[0], "count": row[1]} for row in ip_result]

    # Recent critical events
    critical_stmt = (
        select(SecurityEvent)
        .where(
            SecurityEvent.created_at >= since,
            SecurityEvent.severity == "CRITICAL",
        )
        .order_by(desc(SecurityEvent.created_at))
        .limit(10)
    )
    critical_result = await db.execute(critical_stmt)
    critical_events = [
        {
            "id": e.id,
            "event_type": e.event_type,
            "ip_address": e.ip_address,
            "message": e.message,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in critical_result.scalars()
    ]

    return {
        "period_hours": hours,
        "total_events": sum(by_severity.values()),
        "by_severity": by_severity,
        "by_type": by_type,
        "top_offending_ips": top_ips,
        "recent_critical": critical_events,
        "active_bans": _get_active_bans(),
    }


def _get_active_bans() -> list[dict]:
    """Return currently banned IPs from the in-memory detector."""
    now = time.time()
    bans = []
    for ip, profile in detector._ips.items():
        if profile.banned_until > now:
            bans.append({
                "ip": ip,
                "banned_until": datetime.fromtimestamp(
                    profile.banned_until, tz=timezone.utc
                ).isoformat(),
                "remaining_seconds": int(profile.banned_until - now),
            })
    return bans
