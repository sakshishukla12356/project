from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from typing import Any, AsyncIterator


@dataclass(frozen=True)
class RealtimeEvent:
    type: str
    ts: float
    payload: dict[str, Any]


class RealtimeBus:
    """
    Very small in-memory pub/sub bus.

    - Each subscriber gets its own asyncio.Queue
    - Backpressure is handled by dropping oldest messages when full
    - Intended for a single-process deployment; for multi-worker, swap with Redis/NATS.
    """

    def __init__(self, queue_size: int = 200):
        self._queue_size = queue_size
        self._subscribers: set[asyncio.Queue[RealtimeEvent]] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue[RealtimeEvent]:
        q: asyncio.Queue[RealtimeEvent] = asyncio.Queue(maxsize=self._queue_size)
        async with self._lock:
            self._subscribers.add(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue[RealtimeEvent]) -> None:
        async with self._lock:
            self._subscribers.discard(q)

    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        event = RealtimeEvent(type=event_type, ts=time.time(), payload=payload)
        async with self._lock:
            subscribers = list(self._subscribers)
        for q in subscribers:
            if q.full():
                try:
                    _ = q.get_nowait()
                except Exception:
                    pass
            try:
                q.put_nowait(event)
            except Exception:
                # If a queue is wedged, skip it.
                pass

    @staticmethod
    def to_sse(event: RealtimeEvent) -> str:
        # Standard SSE format.
        return (
            f"event: {event.type}\n"
            f"data: {json.dumps({'type': event.type, 'ts': event.ts, 'payload': event.payload}, default=str)}\n\n"
        )


realtime_bus = RealtimeBus()


async def queue_iter(q: asyncio.Queue[RealtimeEvent]) -> AsyncIterator[RealtimeEvent]:
    while True:
        yield await q.get()

