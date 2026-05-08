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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  DollarSign,
  TrendingDown,
  Shield,
  Zap,
  AlertTriangle,
  Server,
  Cloud,
  Activity,
  Bell,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { type DashboardPayload } from "@/src/services/api"
import { useTelemetry } from "@/src/context/TelemetryContext"

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
  cost_trend_7d: Array.from({ length: 7 }, (_, i) => ({ date: String(i + 1), cost: 0 })),
  recent_alerts: [],
  recommendations: [],
}

export default function DashboardPage() {
  const { state, realtime, refreshAll } = useTelemetry()
  const [selectedProvider, setSelectedProvider] = useState<"AWS" | "Azure">("AWS")
  const isLoading = !state.lastUpdated

  const currentData = useMemo(() => {
    if (selectedProvider === "Azure") return state.azureDashboard
    return state.awsDashboard
  }, [selectedProvider, state.awsDashboard, state.azureDashboard])

  const stats = [
    {
      icon: DollarSign,
      label: "Monthly Cost",
      value: `$${(currentData.monthly_cost || 0).toLocaleString()}`,
      change: "live",
      positive: true,
    },
    {
      icon: TrendingDown,
      label: "Savings Potential",
      value: `$${(currentData.savings_potential || 0).toLocaleString()}`,
      change: "live",
      positive: true,
    },
    {
      icon: Shield,
      label: "Security Score",
      value: `${currentData.security_score || 0}/100`,
      change: "live",
      positive: true,
    },
    {
      icon: Server,
      label: "Active Resources",
      value: `${currentData.active_resources || 0}`,
      change: "live",
      positive: false,
    },
  ]

  const hasAnyData = currentData.cost_trend_7d.some((d) => d.cost > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Live cloud overview from AWS and Azure telemetry.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={refreshAll} className="glass">
            Refresh now
          </Button>
          <span className="text-xs text-muted-foreground">
            {realtime.connected ? `Live: ${realtime.transport}` : "Reconnecting…"}
          </span>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
              {currentData.recent_alerts.length}
            </span>
          </Button>
          <Button className="neon-glow">
            <Zap className="w-4 h-4 mr-2" />
            Apply Optimizations
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="glass-card border-border hover:neon-glow transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  )}
                  <span className={`text-xs ${stat.positive ? "text-neon-green" : "text-destructive"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground">
                <span>Cost Trend (7 Days)</span>
                <div className="flex gap-2">
                  {(["AWS", "Azure"] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                      className={`px-2 py-1 text-xs rounded-md glass ${
                        selectedProvider === provider ? "text-primary border border-primary/40" : ""
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                  <button
                    disabled
                    className="px-2 py-1 text-xs rounded-md glass opacity-50 cursor-not-allowed"
                    title="GCP integration coming soon"
                  >
                    GCP (Coming soon)
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData.cost_trend_7d}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                    <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="url(#costGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {!hasAnyData && !isLoading && (
                <p className="text-xs text-muted-foreground mt-2">No cost trend data available.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Resource Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-foreground">Resource Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentData.resource_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {currentData.resource_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(8, 12, 24, 0.9)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {currentData.resource_distribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <span className="text-xs font-medium text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentData.recent_alerts.length === 0 && !isLoading && (
                  <div className="text-sm text-muted-foreground">No recent alerts.</div>
                )}
                {currentData.recent_alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg glass border-l-4 ${
                      alert.severity === "CRITICAL"
                        ? "border-l-destructive"
                        : alert.severity === "WARNING"
                        ? "border-l-yellow-500"
                        : alert.severity === "INFO"
                        ? "border-l-neon-green"
                        : "border-l-primary"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.created_at || "Telemetry event"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Zap className="w-5 h-5 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentData.recommendations.length === 0 && !isLoading && (
                  <div className="text-sm text-muted-foreground">No optimization recommendations yet.</div>
                )}
                {currentData.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg glass hover:neon-glow transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {rec.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Live telemetry</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-primary">
                View All Recommendations →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {(currentData.errors?.length || 0) > 0 && (
        <Card className="glass-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">Unable to fetch cloud telemetry.</p>
            <Button variant="outline" size="sm" onClick={refreshAll}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
