import { motion } from "framer-motion";
import { DollarSign, Server, Globe, Leaf, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAWSData } from "@/hooks/useAWS";
import { getErrorMessage } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, error } = useAWSData("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Fetching your AWS data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4 glass p-8 max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load AWS data. Please check your AWS credentials in Settings.</p>
          <p className="text-xs text-muted-foreground/60">{getErrorMessage(error)}</p>
        </div>
      </div>
    );
  }

  const costSummary = data?.costSummary;
  const costByService = data?.costByService;
  const dailyCosts = data?.dailyCosts;
  const ec2Instances = data?.ec2Instances;
  const recommendations = data?.recommendations;

  const totalCost = costSummary?.currentCost || 0;
  const changePercent = costSummary?.changePercent || 0;
  const activeServices = costByService?.services?.length || 0;
  const regions = new Set(ec2Instances?.instances?.map((i: any) => i.region) || []).size;
  const co2Estimate = (totalCost * 0.0004).toFixed(1);

  const kpiData = [
    { icon: DollarSign, label: "Total Cost (MTD)", value: `$${totalCost.toFixed(2)}`, change: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`, positive: changePercent <= 0 },
    { icon: Server, label: "Active Services", value: String(activeServices), change: `${ec2Instances?.instances?.length || 0} instances`, positive: true },
    { icon: Globe, label: "Regions", value: String(regions || 1), change: "active", positive: true },
    { icon: Leaf, label: "CO₂ Estimate", value: `${co2Estimate}t`, change: "this month", positive: true },
  ];

  const chartCostData = (dailyCosts?.daily || []).map((d: any) => ({
    day: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cost: d.cost,
  }));

  const chartServiceData = (costByService?.services || []).slice(0, 8).map((s: any) => ({
    name: s.name.replace("Amazon ", "").replace("AWS ", "").slice(0, 15),
    cost: Math.round(s.cost * 100) / 100,
  }));

  // Merge EC2 instances with service info
  const allServices = [
    ...(ec2Instances?.instances || []).map((i: any) => ({
      name: `EC2 - ${i.instanceId}`,
      type: i.type,
      region: i.region,
      cost: "—",
      status: i.state === "running" ? "Running" : i.state === "stopped" ? "Stopped" : i.state,
    })),
    ...(costByService?.services || []).filter((s: any) => !s.name.includes("EC2")).slice(0, 5).map((s: any) => ({
      name: s.name.replace("Amazon ", "").replace("AWS ", ""),
      type: "—",
      region: "us-east-1",
      cost: `$${s.cost.toFixed(2)}/mo`,
      status: "Active",
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of your AWS infrastructure</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.positive ? "text-primary" : "text-destructive"}`}>
                {kpi.positive ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Daily Cost (Last 30 Days)</h3>
          {chartCostData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartCostData}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(150, 80%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(150, 80%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 55%)" interval="preserveStartEnd" />
                <YAxis stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                <Area type="monotone" dataKey="cost" stroke="hsl(150, 80%, 50%)" fill="url(#costGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">No cost data available yet</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Cost by Service (MTD)</h3>
          {chartServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartServiceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                <Bar dataKey="cost" fill="hsl(185, 80%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">No service cost data available</div>
          )}
        </motion.div>
      </div>

      {/* Recommendations */}
      {recommendations?.recommendations?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">💡 Cost Optimization Recommendations</h3>
          <div className="space-y-3">
            {recommendations.recommendations.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-foreground font-medium">{r.instanceId}</p>
                  <p className="text-xs text-muted-foreground">{r.recommendation}: {r.instanceType} → {r.suggestedType}</p>
                </div>
                <span className="text-sm text-primary font-medium">Save ${parseFloat(r.estimatedSavings).toFixed(2)}/mo</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Services Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Running Services</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground font-medium">Service</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Region</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Cost</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allServices.length > 0 ? allServices.map((s: any) => (
                <tr key={s.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-foreground font-medium">{s.name}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{s.type}</td>
                  <td className="p-4 text-muted-foreground">{s.region}</td>
                  <td className="p-4 text-foreground">{s.cost}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.status === "Stopped" || s.status === "stopped" ? "bg-yellow-500/10 text-yellow-400"
                        : s.status === "Running" || s.status === "running" ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No services found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
