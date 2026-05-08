"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"
import { Leaf, Zap, Droplets, Trees, Factory, Gauge, ArrowRight, ShieldCheck } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { VortexBackground } from "@/components/landing/vortex-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { telemetryApi } from "@/src/services/api"

type SustainabilityMetrics = {
  energy_efficiency: number
  water_impact: number
  renewable_coverage: number
  co2_emissions: number
  sustainability_score: number
  trees_planted: number
  energy_consumed: number
}

const initialMetrics: SustainabilityMetrics = {
  energy_efficiency: 0,
  water_impact: 0,
  renewable_coverage: 0,
  co2_emissions: 0,
  sustainability_score: 0,
  trees_planted: 0,
  energy_consumed: 0,
}

const flatSeries = [
  { t: "W1", value: 0 },
  { t: "W2", value: 0 },
  { t: "W3", value: 0 },
  { t: "W4", value: 0 },
]

const emptyRadar = [
  { metric: "Energy Efficiency", score: 0 },
  { metric: "Water Impact", score: 0 },
  { metric: "Carbon Efficiency", score: 0 },
  { metric: "Renewable Usage", score: 0 },
  { metric: "Resource Optimization", score: 0 },
]

type SustainabilityRecommendation = string

const howItWorks = [
  "Collect AWS/Azure telemetry",
  "Analyze infrastructure usage",
  "Estimate sustainability metrics",
  "Generate optimization insights",
]

export default function SustainabilityInsightsPage() {
  const [metrics, setMetrics] = useState<SustainabilityMetrics>(initialMetrics)
  const [recommendations, setRecommendations] = useState<SustainabilityRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [aws, azure] = await Promise.all([
        telemetryApi.getAwsSustainability(),
        telemetryApi.getAzureSustainability(),
      ])
      setMetrics({
        energy_efficiency: Math.round(((aws.energy_efficiency || 0) + (azure.energy_efficiency || 0)) / 2),
        water_impact: (aws.water_impact || 0) + (azure.water_impact || 0),
        renewable_coverage: Math.round(((aws.renewable_coverage || 0) + (azure.renewable_coverage || 0)) / 2),
        co2_emissions: (aws.co2_emissions || 0) + (azure.co2_emissions || 0),
        sustainability_score: Math.round(((aws.sustainability_score || 0) + (azure.sustainability_score || 0)) / 2),
        trees_planted: (aws.trees_planted || 0) + (azure.trees_planted || 0),
        energy_consumed: (aws.energy_consumed || 0) + (azure.energy_consumed || 0),
      })
      const recs = [...(aws.recommendations || []), ...(azure.recommendations || [])].filter(Boolean)
      setRecommendations(recs.length ? recs : [])
      setIsBackendConnected(true)
    } catch (e) {
      setMetrics(initialMetrics)
      setRecommendations([])
      setIsBackendConnected(false)
      setError(e instanceof Error ? e.message : "Unable to fetch cloud telemetry")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadMetrics()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <VortexBackground />
      <DashboardSidebar />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {[...Array(14)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-primary/40 blur-[1px]"
            style={{
              width: `${(i % 4) + 4}px`,
              height: `${(i % 4) + 4}px`,
              left: `${(i * 13) % 100}%`,
              top: `${(i * 17) % 100}%`,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.8, 0.25] }}
            transition={{ duration: 5 + (i % 5), repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        ))}
      </div>

      <main className="relative z-10 ml-64 min-h-screen p-6 transition-all duration-300">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">Sustainability Insights</h1>
            <p className="text-muted-foreground max-w-3xl mt-1">
              Monitor your cloud&apos;s environmental impact and sustainability performance across AWS and Azure infrastructure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <Card className="glass-card border-border hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-green" />
                  Energy Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">{metrics.energy_efficiency}%</p>
                    )}
                    <p className="text-xs text-muted-foreground">{isLoading ? "Waiting for cloud telemetry..." : "Live telemetry"}</p>
                  </div>
                  <span className="text-xs text-neon-green">{metrics.energy_efficiency}%</span>
                </div>
                <div className="h-[56px] mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flatSeries}>
                      <Tooltip contentStyle={{ background: "rgba(8,12,24,0.9)", border: "1px solid rgba(16,185,129,0.3)" }} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  Estimated Water Impact
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="text-[10px] px-1.5 py-0.5 rounded border border-primary/40 text-primary">i</button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Estimated using regional cloud infrastructure sustainability models.
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">{metrics.water_impact} L</p>
                    )}
                    <p className="text-xs text-primary">Estimated Usage: {metrics.water_impact} L</p>
                  </div>
                  <span className="text-xs text-neon-green">{metrics.water_impact > 0 ? "live" : "0%"}</span>
                </div>
                <div className="h-[56px] mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flatSeries}>
                      <Tooltip contentStyle={{ background: "rgba(8,12,24,0.9)", border: "1px solid rgba(59,130,246,0.3)" }} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all md:col-span-2 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-neon-green" />
                  Regional Renewable Coverage
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="text-[10px] px-1.5 py-0.5 rounded border border-neon-green/40 text-neon-green">i</button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Based on renewable energy availability of deployed cloud regions.
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">{metrics.renewable_coverage}%</p>
                    )}
                    <p className="text-xs text-muted-foreground">{isLoading ? "Waiting for cloud telemetry..." : "Live telemetry"}</p>
                  </div>
                  <span className="text-xs text-neon-green">{metrics.renewable_coverage}%</span>
                </div>
                <div className="h-[56px] mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flatSeries}>
                      <Tooltip contentStyle={{ background: "rgba(8,12,24,0.9)", border: "1px solid rgba(16,185,129,0.3)" }} />
                      <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2">
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Sustainability Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {isLoading ? (
                    <div className="h-full space-y-3">
                      <Skeleton className="h-8 w-44" />
                      <Skeleton className="h-[280px] w-full rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={emptyRadar}>
                          <PolarGrid stroke="rgba(255,255,255,0.2)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
                          <Radar
                            dataKey="score"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.25}
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={1100}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-muted-foreground text-center -mt-10">
                        {isBackendConnected ? "Live sustainability telemetry" : "No sustainability data available"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <Card className="glass-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-foreground">Environmental Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Factory, label: "Total CO2 Emissions", value: `${metrics.co2_emissions}`, trend: "0%", color: "text-neon-green" },
                    { icon: Trees, label: "Equivalent Trees Planted", value: `${metrics.trees_planted}`, trend: "0%", color: "text-primary" },
                    { icon: Zap, label: "Energy Consumed", value: `${metrics.energy_consumed}`, trend: "0%", color: "text-neon-green" },
                    { icon: Droplets, label: "Water Impact", value: `${metrics.water_impact} L`, trend: "0%", color: "text-primary" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.08 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="rounded-xl p-3 glass border border-border hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            {isLoading ? (
                              <Skeleton className="h-4 w-20 mt-1" />
                            ) : (
                              <p className="text-sm text-foreground font-semibold">{item.value}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-neon-green">{item.trend}</span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-1">
              <Card className="glass-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-neon-green" />
                    Sustainability Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  <div className="relative w-44 h-44">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#22c55e"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={264}
                        initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 264 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="drop-shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {isLoading ? (
                          <Skeleton className="h-8 w-24 mx-auto" />
                        ) : (
                          <p className="text-3xl font-bold text-neon-green">{metrics.sustainability_score} / 100</p>
                        )}
                        <p className="text-xs text-neon-green animate-pulse">
                          {isLoading ? "Waiting for cloud telemetry..." : isBackendConnected ? "Live telemetry" : "No Data"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {isBackendConnected ? "Telemetry connected across AWS + Azure." : "Connect backend to view sustainability analytics."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="xl:col-span-2">
              <Card className="glass-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-foreground">Sustainability Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {!isLoading && recommendations.length === 0 && (
                    <div className="text-sm text-muted-foreground md:col-span-2">
                      No recommendations available. Connect cloud account(s) to begin monitoring.
                    </div>
                  )}
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={`${rec}-${index}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.08 }}
                      whileHover={{ y: -6 }}
                      className="rounded-xl p-4 glass border border-border hover:border-neon-green/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <Leaf className="w-5 h-5 text-neon-green mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">Recommendation</h4>
                          <p className="text-xs text-muted-foreground mt-1">{rec}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30">
                              {isLoading ? "No Data" : isBackendConnected ? "Live telemetry" : "No Data"}
                            </span>
                            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!isBackendConnected}>
                              Apply
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {howItWorks.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.06 }}
                    className="rounded-xl p-3 glass border border-border"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-semibold flex items-center justify-center mb-2">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground">{step}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {error && (
            <Card className="glass-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-sm text-destructive">Unable to fetch cloud telemetry: {error}</p>
                <Button variant="outline" size="sm" onClick={loadMetrics}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
