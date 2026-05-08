import axios, { AxiosError } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const rawToken =
      window.localStorage.getItem("access_token") ||
      window.localStorage.getItem("token") ||
      ""
    const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const message = error.response?.data?.detail || error.message || "API request failed"
    return Promise.reject(new Error(message))
  },
)

export type DashboardPayload = {
  provider: string
  monthly_cost: number
  active_resources: number
  security_score: number
  savings_potential: number
  resources: Record<string, number>
  resource_distribution: Array<{ name: string; value: number; color: string }>
  cost_trend_7d: Array<{ date: string; cost: number }>
  recent_alerts: Array<{ severity?: string; message: string; created_at?: string }>
  recommendations: Array<{ title: string; savings_usd: number }>
  errors?: string[]
}

export type SustainabilityPayload = {
  provider: string
  energy_efficiency: number
  water_impact: number
  renewable_coverage: number
  co2_emissions: number
  sustainability_score: number
  trees_planted: number
  energy_consumed: number
  recommendations?: string[]
}

export const telemetryApi = {
  async getAwsDashboard() {
    const { data } = await apiClient.get<DashboardPayload>("/api/aws/dashboard")
    return data
  },
  async getAzureDashboard() {
    const { data } = await apiClient.get<DashboardPayload>("/api/azure/dashboard")
    return data
  },
  async getAwsSustainability() {
    const { data } = await apiClient.get<SustainabilityPayload>("/api/aws/sustainability")
    return data
  },
  async getAzureSustainability() {
    const { data } = await apiClient.get<SustainabilityPayload>("/api/azure/sustainability")
    return data
  },
}

