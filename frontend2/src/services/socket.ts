import { apiClient } from "./api"

export type RealtimeEvent = {
  type: string
  ts: number
  payload: Record<string, unknown>
}

export type RealtimeTransport = "websocket" | "sse" | "polling"

function normalizeHttpBaseUrl(raw: string) {
  try {
    const u = new URL(raw)
    const isLocalHost = u.hostname === "127.0.0.1" || u.hostname === "localhost"
    if (isLocalHost && u.protocol === "https:") {
      u.protocol = "http:"
    }
    return u.toString().replace(/\/$/, "")
  } catch {
    return "http://127.0.0.1:8000"
  }
}

function getWsBaseUrl(httpBaseUrl: string) {
  try {
    const u = new URL(httpBaseUrl)
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
    return u.toString().replace(/\/$/, "")
  } catch {
    return "ws://127.0.0.1:8000"
  }
}

export function connectWebSocket(params: {
  onEvent: (ev: RealtimeEvent) => void
  onStatus?: (status: "connected" | "disconnected" | "error") => void
}) {
  const base = normalizeHttpBaseUrl(apiClient.defaults.baseURL || "http://127.0.0.1:8000")
  const wsUrl = `${getWsBaseUrl(base)}/ws/telemetry`

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token") || window.sessionStorage.getItem("access_token") || ""
      : ""
  const cleanedToken = token.startsWith("Bearer ") ? token.slice(7) : token
  const url = cleanedToken ? `${wsUrl}?token=${encodeURIComponent(cleanedToken)}` : wsUrl

  const ws = new WebSocket(url)

  ws.onopen = () => params.onStatus?.("connected")
  ws.onclose = () => params.onStatus?.("disconnected")
  ws.onerror = () => params.onStatus?.("error")
  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(String(msg.data)) as RealtimeEvent
      if (data?.type) params.onEvent(data)
    } catch {
      // ignore
    }
  }

  return {
    close: () => ws.close(),
  }
}

export function connectSse(params: {
  onEvent: (ev: RealtimeEvent) => void
  onStatus?: (status: "connected" | "disconnected" | "error") => void
}) {
  const base = normalizeHttpBaseUrl(apiClient.defaults.baseURL || "http://127.0.0.1:8000")
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token") || window.sessionStorage.getItem("access_token") || ""
      : ""
  const cleanedToken = token.startsWith("Bearer ") ? token.slice(7) : token
  const url = cleanedToken
    ? `${base.replace(/\/$/, "")}/api/realtime/stream?token=${encodeURIComponent(cleanedToken)}`
    : `${base.replace(/\/$/, "")}/api/realtime/stream`
  const es = new EventSource(url, { withCredentials: false })

  es.onopen = () => params.onStatus?.("connected")
  es.onerror = () => params.onStatus?.("error")

  const handler = (e: MessageEvent) => {
    try {
      const data = JSON.parse(String(e.data)) as RealtimeEvent
      if (data?.type) params.onEvent(data)
    } catch {
      // ignore
    }
  }

  // Attach listeners for known event types + a generic handler.
  const eventTypes = [
    "aws_metrics_updated",
    "azure_metrics_updated",
    "cloud_scan_completed",
    "resource_inventory_changed",
    "cost_analysis_updated",
    "sustainability_updated",
    "carbon_metrics_updated",
    "optimization_generated",
    "security_alert_generated",
    "telemetry_refresh_completed",
  ]
  for (const t of eventTypes) es.addEventListener(t, handler as any)

  return {
    close: () => es.close(),
  }
}

