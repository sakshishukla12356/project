"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Cloud, TrendingDown, Shield, Zap, Server, BarChart3, AlertCircle } from "lucide-react"

const dashboards = [
  {
    id: "aws",
    name: "AWS Dashboard",
    icon: Cloud,
    color: "#ff9900",
    metrics: [
      { label: "Monthly Cost", value: "$0", change: "live" },
      { label: "EC2 Instances", value: "0", change: "live" },
      { label: "Security Score", value: "0", change: "live" },
      { label: "Optimization", value: "0%", change: "live" },
    ],
    alerts: 0,
    recommendations: 0,
  },
  {
    id: "azure",
    name: "Azure Dashboard",
    icon: Cloud,
    color: "#0089d6",
    metrics: [
      { label: "Monthly Cost", value: "$0", change: "live" },
      { label: "VMs", value: "0", change: "live" },
      { label: "Security Score", value: "0", change: "live" },
      { label: "Optimization", value: "0%", change: "live" },
    ],
    alerts: 0,
    recommendations: 0,
  },
  {
    id: "unified",
    name: "Multi-Cloud",
    icon: Server,
    color: "#3b82f6",
    metrics: [
      { label: "Total Cost", value: "$0", change: "live" },
      { label: "Resources", value: "0", change: "live" },
      { label: "Security Score", value: "0", change: "live" },
      { label: "Savings Potential", value: "$0", change: "live" },
    ],
    alerts: 0,
    recommendations: 0,
  },
]

export function DashboardShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeDashboard, setActiveDashboard] = useState("unified")

  const currentDashboard = dashboards.find((d) => d.id === activeDashboard) || dashboards[2]

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Dashboards</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Multi-Cloud <span className="text-primary neon-text">Dashboard Showcase</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Unified visibility across AWS, Azure, and GCP with real-time metrics, 
            cost analytics, and AI-powered recommendations in one platform.
          </p>
        </motion.div>

        {/* Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-4 mb-8"
        >
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => setActiveDashboard(dashboard.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeDashboard === dashboard.id
                  ? "glass neon-glow text-foreground"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <dashboard.icon className="w-4 h-4" style={{ color: dashboard.color }} />
              <span className="text-sm font-medium">{dashboard.name}</span>
            </button>
          ))}
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {/* Dashboard Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <currentDashboard.icon className="w-6 h-6" style={{ color: currentDashboard.color }} />
              <div>
                <h3 className="font-semibold text-foreground">{currentDashboard.name}</h3>
                <p className="text-xs text-muted-foreground">Connect telemetry to view updates</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-muted-foreground">{currentDashboard.alerts} Alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{currentDashboard.recommendations} Recommendations</span>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {currentDashboard.metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="glass rounded-xl p-4"
                >
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                    {metric.change && (
                      <span
                        className={`text-xs ${
                          metric.change.startsWith("-") ? "text-neon-green" : "text-primary"
                        }`}
                      >
                        {metric.change}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Preview UI (no demo values) */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Cost Chart */}
              <div className="lg:col-span-2 glass rounded-xl p-4 h-[200px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Cost Trend</span>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="h-[140px] flex items-end justify-between gap-2">
                  {Array.from({ length: 12 }, () => 0).map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={isInView ? { height: `${height}%` } : {}}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                      className="flex-1 rounded-t"
                      style={{
                        background: `linear-gradient(to top, ${currentDashboard.color}40, ${currentDashboard.color})`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">No telemetry available.</p>
              </div>

              {/* Quick Actions */}
              <div className="glass rounded-xl p-4">
                <span className="text-sm font-medium text-foreground mb-4 block">Quick Actions</span>
                <div className="space-y-2">
                  {[
                    { icon: TrendingDown, label: "Optimize Costs" },
                    { icon: Shield, label: "Run Security Scan" },
                    { icon: Zap, label: "Apply Recommendations" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
