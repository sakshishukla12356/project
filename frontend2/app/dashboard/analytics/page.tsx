"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardApi } from "@/src/services/dashboardApi"
import { useTelemetry } from "@/src/context/TelemetryContext"

type Summary = {
  total_spend: number
  by_provider: { aws: number; azure: number; gcp: number }
}

type ProviderSeries = Array<{ date: string; cost: number }>

export default function AnalyticsPage() {
  const { realtime, refreshAll } = useTelemetry()
  const [summary, setSummary] = useState<Summary>({ total_spend: 0, by_provider: { aws: 0, azure: 0, gcp: 0 } })
  const [trends, setTrends] = useState<{ aws: ProviderSeries; azure: ProviderSeries; gcp: ProviderSeries }>({
    aws: [],
    azure: [],
    gcp: [],
  })
  const [services, setServices] = useState<{ aws: any[]; azure: any[]; gcp: any[] }>({ aws: [], azure: [], gcp: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [s, t, svc] = await Promise.all([
        dashboardApi.getAnalyticsSummary(),
        dashboardApi.getAnalyticsTrends(30),
        dashboardApi.getAnalyticsServices(),
      ])
      setSummary({
        total_spend: s.total_spend || 0,
        by_provider: s.by_provider || { aws: 0, azure: 0, gcp: 0 },
      })
      setTrends(t.series || { aws: [], azure: [], gcp: [] })
      setServices({ aws: svc.aws || [], azure: svc.azure || [], gcp: svc.gcp || [] })
    } catch (e) {
      setSummary({ total_spend: 0, by_provider: { aws: 0, azure: 0, gcp: 0 } })
      setTrends({ aws: [], azure: [], gcp: [] })
      setServices({ aws: [], azure: [], gcp: [] })
      setError(e instanceof Error ? e.message : "Unable to fetch cloud telemetry")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAnalytics()
  }, [])

  const overviewChart = useMemo(() => {
    const map = new Map<string, { date: string; aws?: number; azure?: number; gcp?: number }>()
    for (const p of trends.aws) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), aws: p.cost })
    for (const p of trends.azure) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), azure: p.cost })
    for (const p of trends.gcp) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), gcp: p.cost })
    return Array.from(map.values())
  }, [trends])

  const awsServiceChart = useMemo(() => {
    return (services.aws || []).map((x: any) => ({
      service: x.service || x.name || "Service",
      cost: x.cost || x.amount || 0,
    }))
  }, [services.aws])

  const hasTrendData = overviewChart.some((p) => (p.aws || 0) > 0 || (p.azure || 0) > 0 || (p.gcp || 0) > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cloud Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your cloud spending and usage patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refreshAll}>
            Refresh now
          </Button>
          <span className="text-xs text-muted-foreground">{realtime.connected ? `Live: ${realtime.transport}` : "Reconnecting…"}</span>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Spend", value: `$${(summary.total_spend || 0).toLocaleString()}` },
          { label: "AWS", value: `$${(summary.by_provider.aws || 0).toLocaleString()}` },
          { label: "Azure", value: `$${(summary.by_provider.azure || 0).toLocaleString()}` },
          { label: "GCP (Coming soon)", value: "—" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {isLoading ? <Skeleton className="h-7 w-28 mt-2" /> : <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{isLoading ? "Fetching cloud telemetry..." : "Live telemetry"}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">By Service</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Multi-Cloud Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overviewChart}>
                      <defs>
                        <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff9900" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff9900" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0089d6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0089d6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4285f4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4285f4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="aws" name="AWS" stroke="#ff9900" fill="url(#awsGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="azure" name="Azure" stroke="#0089d6" fill="url(#azureGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="gcp" name="GCP" stroke="#4285f4" fill="url(#gcpGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {!isLoading && !hasTrendData && (
                  <p className="text-xs text-muted-foreground mt-2">No telemetry available. Connect cloud account(s) to begin monitoring.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Cost by Service (Current Period)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={awsServiceChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <YAxis dataKey="service" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="cost" name="AWS" fill="#ff9900" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {!isLoading && awsServiceChart.length === 0 && <p className="text-xs text-muted-foreground mt-2">No service cost breakdown available.</p>}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Daily Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(trends.aws || []).map((p) => ({ day: p.date, spend: p.cost }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="spend" name="Actual Spend" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {!isLoading && (trends.aws || []).length === 0 && <p className="text-xs text-muted-foreground mt-2">No daily telemetry available.</p>}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="glass-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">Unable to fetch cloud telemetry: {error}</p>
            <Button variant="outline" size="sm" onClick={loadAnalytics}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
