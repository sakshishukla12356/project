"use client"

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
import { Progress } from "@/components/ui/progress"
import { Leaf, Zap, Globe, TrendingDown, Droplets, Wind, Sun } from "lucide-react"

const carbonData = [
  { month: "Jan", emissions: 45, renewable: 20, target: 40 },
  { month: "Feb", emissions: 42, renewable: 25, target: 38 },
  { month: "Mar", emissions: 38, renewable: 30, target: 36 },
  { month: "Apr", emissions: 35, renewable: 35, target: 34 },
  { month: "May", emissions: 32, renewable: 40, target: 32 },
  { month: "Jun", emissions: 28, renewable: 45, target: 30 },
]

const regionData = [
  { region: "us-east-1", emissions: 12.5, renewable: 35, status: "good" },
  { region: "eu-west-1", emissions: 8.2, renewable: 78, status: "excellent" },
  { region: "ap-southeast-1", emissions: 5.8, renewable: 22, status: "fair" },
  { region: "us-west-2", emissions: 4.1, renewable: 52, status: "good" },
]

const recommendations = [
  {
    title: "Migrate to eu-west-1",
    description: "Move non-latency-critical workloads to EU region powered by 78% renewable energy",
    impact: "-8.5 tons CO2/year",
    effort: "Medium",
  },
  {
    title: "Use Graviton Processors",
    description: "Switch to ARM-based instances for better energy efficiency",
    impact: "-4.2 tons CO2/year",
    effort: "Low",
  },
  {
    title: "Implement Auto-Shutdown",
    description: "Schedule dev/test environments to shut down during off-hours",
    impact: "-3.8 tons CO2/year",
    effort: "Low",
  },
]

export default function CarbonPage() {
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
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: Leaf, label: "Carbon Footprint", value: "28 tons", change: "-18% YoY", color: "text-neon-green" },
          { icon: Zap, label: "Energy Efficiency", value: "92%", change: "+12%", color: "text-primary" },
          { icon: Sun, label: "Renewable Energy", value: "45%", change: "+15%", color: "text-yellow-500" },
          { icon: Globe, label: "Sustainability Score", value: "B+", change: "Good", color: "text-neon-green" },
        ].map((stat, index) => (
          <Card key={stat.label} className="glass-card border-border hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-neon-green/20">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-neon-green">{stat.change}</span>
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
                <span>Carbon Emissions Trend</span>
                <div className="flex items-center gap-2 text-neon-green text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>-38% this quarter</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={carbonData}>
                    <defs>
                      <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(8, 12, 24, 0.9)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="emissions" name="Emissions (tons)" stroke="#ef4444" fill="url(#emissionGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="renewable" name="Renewable (%)" stroke="#10b981" fill="url(#renewGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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
              {regionData.map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-mono">{region.region}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{region.emissions} tons</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          region.status === "excellent"
                            ? "bg-neon-green/20 text-neon-green"
                            : region.status === "good"
                            ? "bg-primary/20 text-primary"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {region.renewable}% renewable
                      </span>
                    </div>
                  </div>
                  <Progress value={region.renewable} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-neon-green" />
              Sustainability Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-xl glass hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all cursor-pointer group"
                >
                  <h4 className="font-medium text-foreground group-hover:text-neon-green transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">{rec.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-3 h-3 text-neon-green" />
                      <span className="text-xs text-neon-green">{rec.impact}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Effort: {rec.effort}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
