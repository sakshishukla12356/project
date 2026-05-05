import { motion } from "framer-motion";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAWSData } from "@/hooks/useAWS";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(150, 80%, 50%)", "hsl(185, 80%, 50%)", "hsl(220, 80%, 60%)", "hsl(280, 70%, 60%)", "hsl(30, 90%, 55%)", "hsl(0, 70%, 55%)"];

export default function AnalyticsPage() {
  const { data: costByServiceData, isLoading: loadingServices } = useAWSData("cost-by-service");
  const { data: dailyData, isLoading: loadingDaily } = useAWSData("cost-daily");

  const isLoading = loadingServices || loadingDaily;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const regionData = (costByServiceData?.services || []).slice(0, 6).map((s: any) => ({
    name: s.name.replace("Amazon ", "").replace("AWS ", "").slice(0, 20),
    value: Math.round(s.cost * 100) / 100,
  }));

  const trendData = (dailyData?.daily || []).map((d: any) => ({
    month: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cost: d.cost,
    optimized: d.cost * 0.85,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your AWS spending</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Spend by Service</h3>
          {regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={regionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {regionData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 15%, 55%)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">No data available</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Cost Trend (Actual vs Optimized)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
                <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                <Line type="monotone" dataKey="cost" stroke="hsl(150, 80%, 50%)" strokeWidth={2} dot={false} name="Actual" />
                <Line type="monotone" dataKey="optimized" stroke="hsl(185, 80%, 50%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Optimized" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">No trend data available</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
