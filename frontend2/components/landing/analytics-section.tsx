"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingDown, DollarSign, AlertCircle, Zap } from "lucide-react"

const monthlyData = [
  { month: "Jan", aws: 45000, azure: 32000, gcp: 18000 },
  { month: "Feb", aws: 42000, azure: 35000, gcp: 20000 },
  { month: "Mar", aws: 48000, azure: 31000, gcp: 22000 },
  { month: "Apr", aws: 41000, azure: 38000, gcp: 19000 },
  { month: "May", aws: 38000, azure: 36000, gcp: 17000 },
  { month: "Jun", aws: 35000, azure: 33000, gcp: 15000 },
]

const serviceData = [
  { name: "EC2", value: 35 },
  { name: "RDS", value: 25 },
  { name: "S3", value: 20 },
  { name: "Lambda", value: 12 },
  { name: "Other", value: 8 },
]

const savingsData = [
  { category: "Idle Resources", current: 12500, optimized: 2500 },
  { category: "Reserved Instances", current: 28000, optimized: 18000 },
  { category: "Right-sizing", current: 15000, optimized: 9000 },
  { category: "Spot Instances", current: 8000, optimized: 3000 },
]

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#8b5cf6", "#6366f1"]

export function AnalyticsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="analytics" className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Analytics</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Cloud Cost <span className="text-primary neon-text">Analytics Dashboard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Gain deep insights into your cloud spending with advanced analytics, 
            budget monitoring, and AI-powered cost predictions.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { icon: DollarSign, label: "Monthly Spend", value: "$95,420", change: "-12%" },
            { icon: TrendingDown, label: "Estimated Savings", value: "$28,500", change: "+8%" },
            { icon: AlertCircle, label: "Idle Resources", value: "47", change: "-15" },
            { icon: Zap, label: "Optimization Score", value: "87/100", change: "+5" },
          ].map((stat, index) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 hover:neon-glow transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith("-") ? "text-accent" : "text-neon-green"}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Cost Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-foreground">Multi-Cloud Cost Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="awsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="azureGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gcpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(8, 12, 24, 0.9)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="aws" stroke="#3b82f6" fill="url(#awsGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="azure" stroke="#06b6d4" fill="url(#azureGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gcp" stroke="#10b981" fill="url(#gcpGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 justify-center">
              {[
                { color: "#3b82f6", label: "AWS" },
                { color: "#06b6d4", label: "Azure" },
                { color: "#10b981", label: "GCP" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Service Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-foreground">Cost by Service</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              {serviceData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Savings Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card rounded-2xl p-6 mt-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-foreground">Optimization Opportunities</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis dataKey="category" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(8, 12, 24, 0.9)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="current" fill="#ef4444" name="Current Spend" radius={[0, 4, 4, 0]} />
                <Bar dataKey="optimized" fill="#10b981" name="After Optimization" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Current Spend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-green" />
              <span className="text-sm text-muted-foreground">After Optimization</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
