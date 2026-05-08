"use client"

import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingDown, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const monthlyData = [
  { month: "Jan", aws: 45000, azure: 32000, gcp: 18000 },
  { month: "Feb", aws: 42000, azure: 35000, gcp: 20000 },
  { month: "Mar", aws: 48000, azure: 31000, gcp: 22000 },
  { month: "Apr", aws: 41000, azure: 38000, gcp: 19000 },
  { month: "May", aws: 38000, azure: 36000, gcp: 17000 },
  { month: "Jun", aws: 35000, azure: 33000, gcp: 15000 },
]

const serviceBreakdown = [
  { service: "EC2", current: 18500, previous: 22000 },
  { service: "RDS", current: 12300, previous: 14500 },
  { service: "S3", current: 8200, previous: 7800 },
  { service: "Lambda", current: 4500, previous: 3200 },
  { service: "CloudFront", current: 3800, previous: 4100 },
  { service: "EKS", current: 6200, previous: 5500 },
]

const dailySpend = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  spend: 2500 + Math.random() * 1500 - 750,
  budget: 3000,
}))

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cloud Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your cloud spending and usage patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Spend", value: "$83,000", change: "-15% vs last month" },
          { label: "AWS", value: "$35,000", change: "-18%" },
          { label: "Azure", value: "$33,000", change: "-13%" },
          { label: "GCP", value: "$15,000", change: "-12%" },
        ].map((stat, index) => (
          <Card key={stat.label} className="glass-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-neon-green mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">By Service</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Multi-Cloud Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff9900" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff9900" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0089d6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0089d6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4285f4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4285f4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="aws" name="AWS" stroke="#ff9900" fill="url(#awsGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="azure" name="Azure" stroke="#0089d6" fill="url(#azureGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="gcp" name="GCP" stroke="#4285f4" fill="url(#gcpGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Cost by Service (Current vs Previous Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                      <YAxis dataKey="service" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="previous" name="Previous" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Daily Spend vs Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySpend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(8, 12, 24, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="spend" name="Actual Spend" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="budget" name="Budget" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
