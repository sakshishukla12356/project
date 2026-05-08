import { useEffect, useMemo, useRef, useState } from "react"
import { connectSse, connectWebSocket, type RealtimeEvent, type RealtimeTransport } from "@/src/services/socket"

export type RealtimeStatus = {
  transport: RealtimeTransport
  connected: boolean
  lastEventTs?: number
  error?: string
}

export function useRealtime(params: {
  enabled?: boolean
  onEvent: (ev: RealtimeEvent) => void
}) {
  const enabled = params.enabled ?? true
  const [status, setStatus] = useState<RealtimeStatus>({ transport: "polling", connected: false })
  const connRef = useRef<{ close: () => void } | null>(null)
  const reconnectRef = useRef<number | null>(null)

  const visibility = useMemo(() => (typeof document !== "undefined" ? document.visibilityState : "visible"), [])

  useEffect(() => {
    if (!enabled) return

    const cleanup = () => {
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      connRef.current?.close()
      connRef.current = null
    }

    const scheduleReconnect = (transport: RealtimeTransport) => {
      if (reconnectRef.current) return
      reconnectRef.current = window.setTimeout(() => {
        reconnectRef.current = null
        start(transport)
      }, 1500)
    }

    const start = (preferred: RealtimeTransport) => {
      cleanup()

      const onEvent = (ev: RealtimeEvent) => {
        setStatus((s) => ({
          ...s,
          connected: true,
          lastEventTs: ev.ts,
        }))
        params.onEvent(ev)
      }

      const onStatus = (transport: RealtimeTransport) => (s: "connected" | "disconnected" | "error") => {
        if (s === "connected") setStatus({ transport, connected: true })
        if (s === "disconnected") {
          setStatus({ transport, connected: false })
          scheduleReconnect(transport)
        }
        if (s === "error") {
          setStatus({ transport, connected: false, error: "Realtime connection error" })
          // Fallback chain: websocket -> sse -> polling
          if (transport === "websocket") start("sse")
          else scheduleReconnect(transport)
        }
      }

      try {
        if (preferred === "websocket") {
          setStatus({ transport: "websocket", connected: false })
          connRef.current = connectWebSocket({ onEvent, onStatus: onStatus("websocket") })
          return
        }
        if (preferred === "sse") {
          setStatus({ transport: "sse", connected: false })
          connRef.current = connectSse({ onEvent, onStatus: onStatus("sse") })
          return
        }
        setStatus({ transport: "polling", connected: false })
      } catch {
        setStatus({ transport: preferred, connected: false, error: "Failed to start realtime transport" })
      }
    }

    start("websocket")

    const onVis = () => {
      if (document.visibilityState === "visible") start(status.transport === "polling" ? "websocket" : status.transport)
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      document.removeEventListener("visibilitychange", onVis)
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return status
}

