import { apiClient } from "./api"

export type AnalyticsSummaryPayload = {
  total_spend: number
  by_provider: { aws: number; azure: number; gcp: number }
  errors?: string[]
}

export type TrendPoint = { date: string; cost: number }
export type AnalyticsTrendsPayload = {
  days: number
  series: { aws: TrendPoint[]; azure: TrendPoint[]; gcp: TrendPoint[] }
}

export type AnalyticsServicesPayload = {
  aws: Array<Record<string, unknown>>
  azure: Array<Record<string, unknown>>
  gcp: Array<Record<string, unknown>>
  errors?: string[]
}

export type CarbonTotalsPayload = {
  total_carbon_kg: number
  total_energy_kwh: number
  total_cost_usd: number
  service_count: number
  services: Array<{
    provider: string
    service: string
    region: string
    state?: string
    carbon_kg: number
    energy_kwh?: number
    cost_usd?: number
  }>
  carbon_by_provider: Record<string, number>
  carbon_by_region: Record<string, number>
  note?: string
}

export type CarbonSavedPayload = {
  carbon_saved_kg: number
  details?: unknown[]
  note?: string
}

export const dashboardApi = {
  async getAnalyticsSummary() {
    const { data } = await apiClient.get<AnalyticsSummaryPayload>("/api/analytics/summary")
    return data
  },
  async getAnalyticsTrends(days = 30) {
    const { data } = await apiClient.get<AnalyticsTrendsPayload>("/api/analytics/trends", { params: { days } })
    return data
  },
  async getAnalyticsServices() {
    const { data } = await apiClient.get<AnalyticsServicesPayload>("/api/analytics/services")
    return data
  },
  async getCarbonTotals() {
    const { data } = await apiClient.get<CarbonTotalsPayload>("/carbon")
    return data
  },
  async getCarbonSaved() {
    const { data } = await apiClient.get<CarbonSavedPayload>("/carbon/saved")
    return data
  },
}

