"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Leaf, Zap, Wind, TrendingDown, Globe, Battery } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const carbonData = [
  { month: "Jan", emissions: 45, renewable: 20 },
  { month: "Feb", emissions: 42, renewable: 25 },
  { month: "Mar", emissions: 38, renewable: 30 },
  { month: "Apr", emissions: 35, renewable: 35 },
  { month: "May", emissions: 32, renewable: 40 },
  { month: "Jun", emissions: 28, renewable: 45 },
]

const ecoMetrics = [
  { icon: Leaf, label: "Carbon Emissions", value: "28 tons", change: "-18%" },
  { icon: Zap, label: "Energy Efficiency", value: "92%", change: "+12%" },
  { icon: Wind, label: "Renewable Percentage", value: "45%", change: "+15%" },
  { icon: Battery, label: "Sustainability Analytics", value: "A", change: "+8%" },
]

const suggestions = [
  {
    title: "Migrate to Green Regions",
    description: "Move workloads to AWS regions powered by renewable energy",
    impact: "Save 15 tons CO2/year",
  },
  {
    title: "Optimize Instance Types",
    description: "Use Graviton processors for better energy efficiency",
    impact: "Reduce energy by 40%",
  },
  {
    title: "Implement Auto-Scaling",
    description: "Scale down during off-peak hours to reduce consumption",
    impact: "Save 8 tons CO2/year",
  },
]

export function CarbonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

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
          <span className="text-neon-green text-sm font-medium tracking-wider uppercase">Sustainability</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Cloud <span className="text-neon-green">Carbon Tracking</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Monitor your cloud carbon footprint and implement sustainable practices 
            with AI-powered recommendations for eco-friendly cloud optimization.
          </p>
        </motion.div>

        {/* Eco Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {ecoMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              className="glass-card rounded-xl p-4 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-neon-green/20">
                  <metric.icon className="w-4 h-4 text-neon-green" />
                </div>
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                {metric.change && (
                  <span className="text-xs text-neon-green">{metric.change}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Carbon Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Carbon Emissions Trend</h3>
              <div className="flex items-center gap-2 text-neon-green text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>-38% this quarter</span>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonData}>
                  <defs>
                    <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="renewableGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stroke="#ef4444"
                    fill="url(#emissionsGradient)"
                    strokeWidth={2}
                    name="Carbon Emissions"
                  />
                  <Area
                    type="monotone"
                    dataKey="renewable"
                    stroke="#10b981"
                    fill="url(#renewableGradient)"
                    strokeWidth={2}
                    name="Renewable Energy"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">Emissions (tons)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-green" />
                <span className="text-sm text-muted-foreground">Renewable (%)</span>
              </div>
            </div>
          </motion.div>

          {/* Sustainability Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-neon-green/20">
                <Globe className="w-5 h-5 text-neon-green" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Eco Recommendations</h3>
            </div>

            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="p-4 rounded-xl glass hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-neon-green transition-colors">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Leaf className="w-3 h-3 text-neon-green" />
                    <span className="text-xs text-neon-green">{suggestion.impact}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sustainability Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 glass-card rounded-2xl p-6 text-center"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sustainability Analytics</h3>
          <div className="flex items-center justify-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-neon-green/30 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl font-bold text-neon-green">A</span>
                  <p className="text-xs text-muted-foreground mt-1">Optimized</p>
                </div>
              </div>
            </div>
            <div className="text-left space-y-2">
              <p className="text-sm text-muted-foreground">
                Your cloud infrastructure is <span className="text-neon-green">42% more efficient</span> than baseline.
              </p>
              <p className="text-sm text-muted-foreground">
                Predictive recommendations maintain a <span className="text-neon-green">top-tier sustainability profile</span>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
