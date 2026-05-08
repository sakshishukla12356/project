"use client"

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react"
import { telemetryApi, type DashboardPayload, type SustainabilityPayload } from "@/src/services/api"
import { dashboardApi, type CarbonTotalsPayload } from "@/src/services/dashboardApi"
import { apiClient } from "@/src/services/api"
import { useRealtime } from "@/src/hooks/useRealtime"
import type { RealtimeEvent } from "@/src/services/socket"

type SecurityStats = { total_events?: number; by_severity?: Record<string, number> }
type SecurityEvent = { severity?: string; event_type?: string; message: string; created_at?: string }
type OptimizationRec = { provider: string; title: string; description: string; resources_affected: number; status: string; risk: string }

type TelemetryState = {
  awsDashboard: DashboardPayload
  azureDashboard: DashboardPayload
  sustainability: { aws: SustainabilityPayload; azure: SustainabilityPayload }
  carbon: CarbonTotalsPayload
  security: { stats: SecurityStats; events: SecurityEvent[] }
  optimization: { recommendations: OptimizationRec[] }
  connected: { aws: boolean; azure: boolean }
  gcpEnabled: false
  lastUpdated?: number
}

const zeroDashboard: DashboardPayload = {
  provider: "aws",
  monthly_cost: 0,
  active_resources: 0,
  security_score: 0,
  savings_potential: 0,
  resources: { ec2: 0, rds: 0, s3: 0, lambda: 0, other: 0 },
  resource_distribution: [
    { name: "EC2", value: 0, color: "#3b82f6" },
    { name: "RDS", value: 0, color: "#06b6d4" },
    { name: "S3", value: 0, color: "#10b981" },
    { name: "Lambda", value: 0, color: "#8b5cf6" },
    { name: "Other", value: 0, color: "#6366f1" },
  ],
  cost_trend_7d: [],
  recent_alerts: [],
  recommendations: [],
}

const zeroSustainability: SustainabilityPayload = {
  provider: "aws",
  energy_efficiency: 0,
  water_impact: 0,
  renewable_coverage: 0,
  co2_emissions: 0,
  sustainability_score: 0,
  trees_planted: 0,
  energy_consumed: 0,
  recommendations: [],
}

const initialState: TelemetryState = {
  awsDashboard: zeroDashboard,
  azureDashboard: { ...zeroDashboard, provider: "azure" },
  sustainability: { aws: zeroSustainability, azure: { ...zeroSustainability, provider: "azure" } },
  carbon: {
    total_carbon_kg: 0,
    total_energy_kwh: 0,
    total_cost_usd: 0,
    service_count: 0,
    services: [],
    carbon_by_provider: {},
    carbon_by_region: {},
  },
  security: { stats: { total_events: 0, by_severity: {} }, events: [] },
  optimization: { recommendations: [] },
  connected: { aws: false, azure: false },
  gcpEnabled: false,
}

type Action =
  | { type: "SET_AWS_DASHBOARD"; payload: DashboardPayload }
  | { type: "SET_AZURE_DASHBOARD"; payload: DashboardPayload }
  | { type: "SET_SUSTAINABILITY"; payload: { provider: "aws" | "azure"; data: SustainabilityPayload } }
  | { type: "SET_CARBON"; payload: CarbonTotalsPayload }
  | { type: "SET_SECURITY"; payload: { stats: SecurityStats; events: SecurityEvent[] } }
  | { type: "SET_OPTIMIZATION"; payload: { recommendations: OptimizationRec[] } }
  | { type: "SET_CONNECTED"; payload: { aws?: boolean; azure?: boolean } }
  | { type: "TOUCH" }

function reducer(state: TelemetryState, action: Action): TelemetryState {
  switch (action.type) {
    case "SET_AWS_DASHBOARD":
      return { ...state, awsDashboard: action.payload, connected: { ...state.connected, aws: !(action.payload.errors || []).length }, lastUpdated: Date.now() }
    case "SET_AZURE_DASHBOARD":
      return { ...state, azureDashboard: action.payload, connected: { ...state.connected, azure: !(action.payload.errors || []).length }, lastUpdated: Date.now() }
    case "SET_SUSTAINABILITY":
      return { ...state, sustainability: { ...state.sustainability, [action.payload.provider]: action.payload.data }, lastUpdated: Date.now() }
    case "SET_CARBON":
      return { ...state, carbon: action.payload, lastUpdated: Date.now() }
    case "SET_SECURITY":
      return { ...state, security: action.payload, lastUpdated: Date.now() }
    case "SET_OPTIMIZATION":
      return { ...state, optimization: action.payload, lastUpdated: Date.now() }
    case "SET_CONNECTED":
      return { ...state, connected: { ...state.connected, ...action.payload } }
    case "TOUCH":
      return { ...state, lastUpdated: Date.now() }
    default:
      return state
  }
}

type TelemetryContextValue = {
  state: TelemetryState
  realtime: { connected: boolean; transport: string; lastEventTs?: number }
  refreshAll: () => Promise<void>
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null)

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [bootLoading, setBootLoading] = useState(true)
  const readToken = () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token") || window.sessionStorage.getItem("access_token") || ""
      : ""
  const [authToken, setAuthToken] = useState<string>(readToken())
  const hasAuthToken = !!authToken

  useEffect(() => {
    const syncToken = () => setAuthToken(readToken())
    window.addEventListener("storage", syncToken)
    window.addEventListener("auth-token-changed", syncToken)
    return () => {
      window.removeEventListener("storage", syncToken)
      window.removeEventListener("auth-token-changed", syncToken)
    }
  }, [])

  const refreshAll = async () => {
    const [awsD, azureD, awsS, azureS, carbon, statsRes, eventsRes, optRes] = await Promise.all([
      telemetryApi.getAwsDashboard(),
      telemetryApi.getAzureDashboard(),
      telemetryApi.getAwsSustainability(),
      telemetryApi.getAzureSustainability(),
      dashboardApi.getCarbonTotals(),
      apiClient.get<SecurityStats>("/security/stats", { params: { hours: 24 } }),
      apiClient.get<SecurityEvent[]>("/security/events", { params: { hours: 24, limit: 50 } }),
      apiClient.get<{ recommendations: OptimizationRec[] }>("/api/optimization/recommendations"),
    ])
    dispatch({ type: "SET_AWS_DASHBOARD", payload: awsD })
    dispatch({ type: "SET_AZURE_DASHBOARD", payload: azureD })
    dispatch({ type: "SET_SUSTAINABILITY", payload: { provider: "aws", data: awsS } })
    dispatch({ type: "SET_SUSTAINABILITY", payload: { provider: "azure", data: azureS } })
    dispatch({ type: "SET_CARBON", payload: carbon })
    dispatch({ type: "SET_SECURITY", payload: { stats: statsRes.data || {}, events: Array.isArray(eventsRes.data) ? eventsRes.data : [] } })
    dispatch({ type: "SET_OPTIMIZATION", payload: { recommendations: optRes.data.recommendations || [] } })
  }

  useEffect(() => {
    if (!hasAuthToken) {
      setBootLoading(false)
      return
    }
    ;(async () => {
      try {
        await refreshAll()
      } catch {
        // keep initial zero state on transient boot errors
      } finally {
        setBootLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAuthToken])

  const onRealtimeEvent = (ev: RealtimeEvent) => {
    switch (ev.type) {
      case "aws_metrics_updated":
        dispatch({ type: "SET_AWS_DASHBOARD", payload: ev.payload as any })
        return
      case "azure_metrics_updated":
        dispatch({ type: "SET_AZURE_DASHBOARD", payload: ev.payload as any })
        return
      case "sustainability_updated": {
        const p = (ev.payload as any)?.provider
        if (p === "aws" || p === "azure") dispatch({ type: "SET_SUSTAINABILITY", payload: { provider: p, data: ev.payload as any } })
        return
      }
      case "carbon_metrics_updated":
        dispatch({
          type: "SET_CARBON",
          payload: {
            ...state.carbon,
            ...(ev.payload as any),
          },
        })
        return
      case "telemetry_refresh_completed":
      case "cost_analysis_updated":
      case "resource_inventory_changed":
        dispatch({ type: "TOUCH" })
        return
      default:
        return
    }
  }

  const realtimeStatus = useRealtime({
    enabled: !bootLoading && hasAuthToken,
    onEvent: onRealtimeEvent,
  })

  // Visibility-aware polling fallback when realtime isn't connected.
  useEffect(() => {
    if (bootLoading) return
    if (!hasAuthToken) return
    if (realtimeStatus.connected) return

    let stopped = false
    let id: number | null = null

    const tick = async () => {
      if (stopped) return
      if (document.visibilityState !== "visible") return
      try {
        await refreshAll()
      } catch {
        // keep last valid state
      }
    }

    id = window.setInterval(() => void tick(), 15_000)
    return () => {
      stopped = true
      if (id) window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootLoading, hasAuthToken, realtimeStatus.connected])

  const value = useMemo<TelemetryContextValue>(
    () => ({
      state,
      realtime: {
        connected: realtimeStatus.connected,
        transport: realtimeStatus.transport,
        lastEventTs: realtimeStatus.lastEventTs,
      },
      refreshAll,
    }),
    [state, realtimeStatus.connected, realtimeStatus.transport, realtimeStatus.lastEventTs],
  )

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) throw new Error("useTelemetry must be used within <TelemetryProvider />")
  return ctx
}

