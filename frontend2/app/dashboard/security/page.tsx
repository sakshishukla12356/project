"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Key,
  Server,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTelemetry } from "@/src/context/TelemetryContext"

type SecurityStats = {
  total_events?: number
  by_severity?: Record<string, number>
  by_type?: Record<string, number>
}

type SecurityEvent = {
  severity?: string
  event_type?: string
  message: string
  created_at?: string
}

export default function SecurityPage() {
  const { state, realtime, refreshAll } = useTelemetry()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Page-level loading indicator: context boots in layout and then streams updates.
    setIsLoading(false)
  }, [])

  const criticalCount = (state.security.stats.by_severity || {}).CRITICAL || 0
  const warningCount = (state.security.stats.by_severity || {}).WARNING || 0
  const infoCount = (state.security.stats.by_severity || {}).INFO || 0

  const criticalAlerts = useMemo(
    () => state.security.events.filter((e) => (e.severity || "").toUpperCase() === "CRITICAL").slice(0, 10),
    [state.security.events],
  )
  const warnings = useMemo(
    () => state.security.events.filter((e) => (e.severity || "").toUpperCase() !== "CRITICAL").slice(0, 10),
    [state.security.events],
  )

  const securityScore = useMemo(() => {
    // Mirror backend heuristic used in telemetry endpoints (no fake positives; score is based on event volume/severity).
    const total = state.security.stats.total_events || 0
    const penalty = criticalCount * 8 + warningCount * 3 + Math.min(total, 20)
    return Math.max(0, Math.min(100, 100 - penalty))
  }, [state.security.stats.total_events, criticalCount, warningCount])

  const securityMetrics = [
    { label: "Security Score", value: securityScore, icon: Shield },
    { label: "Critical Events", value: criticalCount, icon: XCircle },
    { label: "Warnings", value: warningCount, icon: AlertTriangle },
    { label: "Info", value: infoCount, icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground">Monitor threats and maintain compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="neon-glow" onClick={refreshAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Security Scan
          </Button>
          <span className="text-xs text-muted-foreground">{realtime.connected ? `Live: ${realtime.transport}` : "Reconnecting…"}</span>
        </div>
      </motion.div>

      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#securityGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="245 283"
                    />
                    <defs>
                      <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <span className="text-3xl font-bold text-foreground">{securityScore}</span>
                    )}
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Overall Security Score</h3>
                  <p className="text-muted-foreground">{isLoading ? "Fetching cloud telemetry..." : "Based on the last 24 hours of security telemetry."}</p>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">{criticalCount} Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">{warningCount} Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-sm text-muted-foreground">{infoCount} Info</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {securityMetrics.map((metric) => (
                  <div key={metric.label} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <Skeleton className="h-5 w-16" />
                      ) : (
                        <span className="text-lg font-bold text-foreground">{metric.value}</span>
                      )}
                      <Progress value={Number(metric.value) || 0} className="h-1.5 flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <XCircle className="w-5 h-5 text-destructive" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalAlerts.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground">No critical alerts in the last 24 hours.</div>
              )}
              {criticalAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border-l-4 border-l-destructive bg-destructive/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{alert.event_type || "Critical Event"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.created_at || "Telemetry event"}</span>
                  </div>
                  <Button size="sm" variant="destructive" className="mt-3">
                    Remediate Now
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Warnings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Security Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {warnings.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground">No warnings in the last 24 hours.</div>
              )}
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl glass border-l-4 ${
                    (warning.severity || "").toUpperCase() === "WARNING"
                      ? "border-l-primary"
                      : "border-l-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">{warning.event_type || "Event"}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{warning.message}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      Fix
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Compliance Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No compliance telemetry available. Connect governance/compliance integrations to begin monitoring.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <Card className="glass-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">Unable to fetch cloud telemetry: {error}</p>
            <Button variant="outline" size="sm" onClick={refreshAll}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
