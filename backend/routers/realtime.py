"""
routers/realtime.py

Realtime telemetry streaming for the frontend.
Supports:
- WebSocket: /ws/telemetry
- Server-Sent Events: /api/realtime/stream

Events are emitted only from real backend telemetry computations (no fake data).
"""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from jose import JWTError

from services.auth_service import decode_access_token
from services.realtime_bus import realtime_bus, queue_iter

router = APIRouter(tags=["Realtime"])


@router.get("/api/realtime/stream")
async def realtime_stream(
    request: Request,
):
    """
    SSE stream of telemetry events.
    """
    token = request.query_params.get("token", "")
    auth_header = request.headers.get("authorization")
    if not token and auth_header:
        token = auth_header.replace("Bearer ", "")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_access_token(token)
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Not authenticated")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    q = await realtime_bus.subscribe()

    async def gen():
        try:
            # Initial comment to open stream promptly behind proxies.
            yield ": connected\n\n"
            async for ev in queue_iter(q):
                if await request.is_disconnected():
                    break
                yield realtime_bus.to_sse(ev)
        finally:
            await realtime_bus.unsubscribe(q)

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    """
    WebSocket stream of telemetry events.
    Auth is done via Authorization header (Bearer token).
    """
    await websocket.accept()

    try:
        auth_header = websocket.headers.get("authorization")
        token = websocket.query_params.get("token", "")

        if not token and auth_header:
            token = auth_header.replace("Bearer ", "")

        if not token:
            await websocket.close(code=4401)
            return

        payload = decode_access_token(token)
        if not payload.get("sub"):
            await websocket.close(code=4401)
            return
    except JWTError:
        await websocket.close(code=4401)
        return

    q = await realtime_bus.subscribe()
    try:
        async for ev in queue_iter(q):
            try:
                await websocket.send_json({"type": ev.type, "ts": ev.ts, "payload": ev.payload})
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        await realtime_bus.unsubscribe(q)

