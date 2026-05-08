import { apiClient } from "./api"

export type CostTrendPoint = { date: string; cost: number }
export type CostBreakdownItem = { service?: string; name?: string; cost?: number; amount?: number; count?: number }

export type AzureCostsPayload = {
  monthly_cost: number
  cost_breakdown: CostBreakdownItem[]
  cost_trend_7d: CostTrendPoint[]
  error?: string
}

export const azureApi = {
  async getCosts() {
    const { data } = await apiClient.get<AzureCostsPayload>("/api/azure/costs")
    return data
  },
  async getResources() {
    const { data } = await apiClient.get("/api/azure/resources")
    return data as unknown
  },
}

