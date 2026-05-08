"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Server, Clock, DollarSign, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const optimizations = [
  {
    icon: Server,
    title: "Idle EC2 Detection",
    description: "Automatically identifies EC2 instances with low CPU utilization for termination or rightsizing",
    savings: "$4,200/month",
    instances: 8,
    status: "actionable",
  },
  {
    icon: Clock,
    title: "Reserved Instance Recommendations",
    description: "Convert on-demand instances to reserved instances based on usage patterns",
    savings: "$12,500/month",
    instances: 15,
    status: "actionable",
  },
  {
    icon: Zap,
    title: "Spot Instance Opportunities",
    description: "Identify workloads suitable for spot instances with significant cost savings",
    savings: "$6,800/month",
    instances: 12,
    status: "pending",
  },
  {
    icon: DollarSign,
    title: "Rightsizing Analysis",
    description: "Downsize over-provisioned instances to match actual resource requirements",
    savings: "$5,000/month",
    instances: 23,
    status: "actionable",
  },
]

const autoScalingMetrics = [
  { label: "Policies Active", value: "12" },
  { label: "Auto-scaled Events", value: "847" },
  { label: "Cost Avoided", value: "$18.5K" },
  { label: "Uptime", value: "99.99%" },
]

export function OptimizationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const totalSavings = optimizations.reduce((sum, opt) => {
    const amount = parseFloat(opt.savings.replace(/[^0-9.]/g, ""))
    return sum + amount
  }, 0)

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
            ${totalSavings.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on {optimizations.reduce((sum, opt) => sum + opt.instances, 0)} optimization opportunities
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
