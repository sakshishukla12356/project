"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Zap, Server, Clock, DollarSign, ArrowRight, CheckCircle, AlertCircle, Play } from "lucide-react"

const optimizations = [
  {
    id: 1,
    icon: Server,
    title: "Stop Idle EC2 Instances",
    description: "8 instances with <5% CPU utilization for 7+ days",
    savings: "$4,200",
    instances: 8,
    status: "ready",
    risk: "low",
  },
  {
    id: 2,
    icon: Clock,
    title: "Convert to Reserved Instances",
    description: "15 on-demand instances suitable for 1-year commitment",
    savings: "$12,500",
    instances: 15,
    status: "ready",
    risk: "low",
  },
  {
    id: 3,
    icon: Zap,
    title: "Enable Spot Instances",
    description: "12 fault-tolerant workloads can use spot pricing",
    savings: "$6,800",
    instances: 12,
    status: "review",
    risk: "medium",
  },
  {
    id: 4,
    icon: DollarSign,
    title: "Rightsize Overprovisioned Resources",
    description: "23 instances using <30% of allocated resources",
    savings: "$5,000",
    instances: 23,
    status: "ready",
    risk: "low",
  },
]

const automationRules = [
  { name: "Auto-stop dev instances at 7 PM", status: "active", savings: "$850/mo" },
  { name: "Scale down staging on weekends", status: "active", savings: "$420/mo" },
  { name: "Delete snapshots older than 30 days", status: "paused", savings: "$180/mo" },
  { name: "Migrate old data to Glacier", status: "active", savings: "$320/mo" },
]

export default function OptimizationPage() {
  const totalSavings = optimizations.reduce((sum, opt) => sum + parseInt(opt.savings.replace(/[^0-9]/g, "")), 0)

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
                <p className="text-4xl font-bold text-primary mt-1">${totalSavings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Optimization Score</p>
                <p className="text-4xl font-bold text-foreground mt-1">72%</p>
                <Progress value={72} className="h-2 mt-2" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Recommendations</p>
                <p className="text-4xl font-bold text-foreground mt-1">{optimizations.length}</p>
                <p className="text-xs text-neon-green">3 ready to apply</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Resources Affected</p>
                <p className="text-4xl font-bold text-foreground mt-1">58</p>
                <p className="text-xs text-muted-foreground">across 3 providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Optimization Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {optimizations.map((opt, index) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="glass-card border-border hover:neon-glow transition-all group h-full">
              <CardContent className="p-6">
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
                    <div className="text-2xl font-bold text-neon-green">{opt.savings}</div>
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
              {automationRules.map((rule, index) => (
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
                    <p className="text-sm font-medium text-neon-green">{rule.savings}</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
