"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Zap, Server, Clock, DollarSign, ArrowRight, CheckCircle, AlertCircle, Play } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/src/services/api"
import { useTelemetry } from "@/src/context/TelemetryContext"

type OptimizationRecommendation = {
  provider: string
  category: string
  title: string
  description: string
  resources_affected: number
  status: "ready" | "review"
  risk: "low" | "medium" | "high"
}

export default function OptimizationPage() {
  const { state, realtime, refreshAll } = useTelemetry()
  const [rules, setRules] = useState<Array<{ name: string; status: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOptimization = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [recsRes, rulesRes] = await Promise.all([
        apiClient.get<{ recommendations: OptimizationRecommendation[] }>("/api/optimization/recommendations"),
        apiClient.get<{ rules: Array<{ name: string; status: string }> }>("/api/optimization/automation-rules"),
      ])
      // Recommendations are streamed into context; keep this call only for backfill.
      setRules(rulesRes.data.rules || [])
    } catch (e) {
      setRules([])
      setError(e instanceof Error ? e.message : "Unable to fetch cloud telemetry")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOptimization()
  }, [])

  const optimizationScore = useMemo(() => {
    // Until an optimization engine exists, don't fabricate a score.
    return 0
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cost Optimization</h1>
          <p className="text-muted-foreground">AI-powered recommendations to reduce cloud spending</p>
        </div>
        <Button className="neon-glow">
          <Play className="w-4 h-4 mr-2" />
          Apply All Recommendations
        </Button>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-border neon-glow">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-muted-foreground text-sm">Total Potential Savings</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-40 mx-auto mt-2" />
                ) : (
                  <p className="text-4xl font-bold text-primary mt-1">$0</p>
                )}
                <p className="text-xs text-muted-foreground">Savings estimates require optimization engine</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Optimization Score</p>
                {isLoading ? <Skeleton className="h-10 w-20 mx-auto mt-2" /> : <p className="text-4xl font-bold text-foreground mt-1">{optimizationScore}%</p>}
                <Progress value={optimizationScore} className="h-2 mt-2" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Recommendations</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mx-auto mt-2" />
                ) : (
                  <p className="text-4xl font-bold text-foreground mt-1">{state.optimization.recommendations.length}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Fetching cloud telemetry..." : state.optimization.recommendations.length ? "Live telemetry" : "No recommendations yet"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Resources Affected</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mx-auto mt-2" />
                ) : (
                  <p className="text-4xl font-bold text-foreground mt-1">
                    {state.optimization.recommendations.reduce((sum, r) => sum + (r.resources_affected || 0), 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">based on connected inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Optimization Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {!isLoading && state.optimization.recommendations.length === 0 && (
          <Card className="glass-card border-border md:col-span-2">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No optimization recommendations yet. Connect a cloud account to begin monitoring.
            </CardContent>
          </Card>
        )}
        {state.optimization.recommendations.map((opt: any, index) => (
          <motion.div
            key={`${opt.provider}:${opt.title}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="glass-card border-border hover:neon-glow transition-all group h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Server className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {opt.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {opt.resources_affected} resources affected
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        opt.status === "ready"
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {opt.status === "ready" ? "Ready" : "Review"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        opt.risk === "low"
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {opt.risk} risk
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Monthly Savings</span>
                    <div className="text-2xl font-bold text-neon-green">$0</div>
                  </div>
                  <Button size="sm" variant={opt.status === "ready" ? "default" : "outline"}>
                    {opt.status === "ready" ? "Apply" : "Review"} <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Automation Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5 text-primary" />
              Active Automation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isLoading && rules.length === 0 && (
                <div className="text-sm text-muted-foreground">No automation rules configured.</div>
              )}
              {rules.map((rule) => (
                <div
                  key={rule.name}
                  className="flex items-center justify-between p-4 rounded-xl glass"
                >
                  <div className="flex items-center gap-3">
                    {rule.status === "active" ? (
                      <CheckCircle className="w-5 h-5 text-neon-green" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: <span className={rule.status === "active" ? "text-neon-green" : "text-yellow-500"}>{rule.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">no estimate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <Card className="glass-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">Unable to fetch cloud telemetry: {error}</p>
            <Button variant="outline" size="sm" onClick={loadOptimization}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        {realtime.connected ? `Live: ${realtime.transport}` : "Reconnecting…"} ·{" "}
        <button className="underline underline-offset-4" onClick={refreshAll}>
          refresh now
        </button>
      </div>
    </div>
  )
}
