"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Leaf, Zap, Globe, TrendingDown, Droplets, Wind, Sun } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardApi, type CarbonTotalsPayload, type CarbonSavedPayload } from "@/src/services/dashboardApi"
import { useTelemetry } from "@/src/context/TelemetryContext"

const initialTotals: CarbonTotalsPayload = {
  total_carbon_kg: 0,
  total_energy_kwh: 0,
  total_cost_usd: 0,
  service_count: 0,
  services: [],
  carbon_by_provider: {},
  carbon_by_region: {},
}

export default function CarbonPage() {
  const { state, realtime, refreshAll } = useTelemetry()
  const [saved, setSaved] = useState<CarbonSavedPayload>({ carbon_saved_kg: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSaved = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const s = await dashboardApi.getCarbonSaved()
      setSaved(s)
    } catch (e) {
      setSaved({ carbon_saved_kg: 0 })
      setError(e instanceof Error ? e.message : "Unable to fetch cloud telemetry")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSaved()
  }, [])

  const regionData = useMemo(() => {
    const entries = Object.entries(state.carbon.carbon_by_region || {}).map(([region, carbon_kg]) => ({
      region,
      emissions_kg: carbon_kg,
    }))
    return entries.sort((a, b) => b.emissions_kg - a.emissions_kg).slice(0, 8)
  }, [state.carbon.carbon_by_region])

  const providerTrend = useMemo(() => {
    // No historical timeseries is guaranteed; visualize provider breakdown as a simple series.
    return Object.entries(state.carbon.carbon_by_provider || {}).map(([provider, carbon_kg]) => ({
      label: provider.toUpperCase(),
      emissions: carbon_kg,
    }))
  }, [state.carbon.carbon_by_provider])

  const hasAnyTelemetry = state.carbon.service_count > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carbon Tracking</h1>
          <p className="text-muted-foreground">Monitor and reduce your cloud carbon footprint</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refreshAll} className="glass">
            Refresh now
          </Button>
          <span className="text-xs text-muted-foreground">{realtime.connected ? `Live: ${realtime.transport}` : "Reconnecting…"}</span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: Leaf, label: "Total Carbon", value: `${(state.carbon.total_carbon_kg || 0).toLocaleString()} kg`, color: "text-neon-green" },
          { icon: Zap, label: "Total Energy", value: `${(state.carbon.total_energy_kwh || 0).toLocaleString()} kWh`, color: "text-primary" },
          { icon: Sun, label: "Carbon Saved (24h)", value: `${(saved.carbon_saved_kg || 0).toLocaleString()} kg`, color: "text-yellow-500" },
          { icon: Globe, label: "Tracked Services", value: `${state.carbon.service_count || 0}`, color: "text-neon-green" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card border-border hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-neon-green/20">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                {isLoading ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                )}
                <span className="text-xs text-muted-foreground">{isLoading ? "Fetching cloud telemetry..." : hasAnyTelemetry ? "Live telemetry" : "No Data"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emissions Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground">
                  <span>Carbon Emissions (by Provider)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={providerTrend}>
                    <defs>
                      <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(8, 12, 24, 0.9)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                      <Area type="monotone" dataKey="emissions" name="Emissions (kg CO2e)" stroke="#ef4444" fill="url(#emissionGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
                {!isLoading && !hasAnyTelemetry && (
                  <p className="text-xs text-muted-foreground mt-2">No telemetry available. Connect cloud account(s) to begin monitoring.</p>
                )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Region Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-foreground">Emissions by Region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {regionData.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground">No telemetry available.</div>
              )}
              {regionData.map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-mono">{region.region}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{region.emissions_kg.toLocaleString()} kg</span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, (region.emissions_kg / Math.max(1, state.carbon.total_carbon_kg)) * 100))}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {error && (
        <Card className="glass-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">Unable to fetch cloud telemetry: {error}</p>
            <Button variant="outline" size="sm" onClick={loadSaved}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
