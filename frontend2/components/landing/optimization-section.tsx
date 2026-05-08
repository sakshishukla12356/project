"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Server, Clock, DollarSign, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const optimizations = [
  {
    icon: Server,
    title: "Telemetry-based Rightsizing",
    description: "Analyze utilization metrics to identify over-provisioned resources.",
    savings: "—",
    instances: 0,
    status: "pending",
  },
  {
    icon: Clock,
    title: "Commitment Recommendations",
    description: "Evaluate commitment options based on usage history.",
    savings: "—",
    instances: 0,
    status: "pending",
  },
  {
    icon: Zap,
    title: "Spot Opportunities",
    description: "Identify fault-tolerant workloads suitable for preemptible capacity.",
    savings: "—",
    instances: 0,
    status: "pending",
  },
  {
    icon: DollarSign,
    title: "Storage Tiering",
    description: "Detect cold data and apply lifecycle / tiering policies.",
    savings: "—",
    instances: 0,
    status: "pending",
  },
]

const autoScalingMetrics = [
  { label: "Policies Active", value: "—" },
  { label: "Auto-scaled Events", value: "—" },
  { label: "Cost Avoided", value: "—" },
  { label: "Uptime", value: "—" },
]

export function OptimizationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const totalSavings = 0

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
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Optimization</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            AI-Powered <span className="text-primary neon-text">Cost Optimization Engine</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Our intelligent optimization engine continuously analyzes your cloud resources 
            to identify savings opportunities and automate cost reduction.
          </p>
        </motion.div>

        {/* Total Savings Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-8 text-center neon-glow"
        >
          <p className="text-muted-foreground mb-2">Total Estimated Monthly Savings</p>
          <div className="text-5xl font-bold text-primary neon-text">
            $0
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Connect telemetry to generate recommendations
          </p>
        </motion.div>

        {/* Optimization Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {optimizations.map((opt, index) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:neon-glow transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <opt.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {opt.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {opt.instances} resources affected
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    opt.status === "actionable"
                      ? "bg-neon-green/20 text-neon-green"
                      : "bg-yellow-500/20 text-yellow-500"
                  }`}
                >
                  {opt.status === "actionable" ? "Ready" : "Review"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Potential Savings</span>
                  <div className="text-xl font-bold text-neon-green">{opt.savings}</div>
                </div>
                <Button size="sm" variant="outline" className="group-hover:neon-glow transition-all">
                  Apply <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Auto-Scaling Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/20">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Auto-Scaling Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                AI-driven scaling policies that adapt to your workload patterns
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {autoScalingMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "Predictive scaling based on traffic patterns",
              "Automatic rightsizing during off-peak hours",
              "Spot instance fallback strategies",
              "Multi-region load balancing optimization",
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground"
              >
                <CheckCircle className="w-3 h-3 text-neon-green" />
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
