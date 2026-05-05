import { motion } from "framer-motion";
import { Leaf, TrendingDown, Zap, TreePine, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAWSData } from "@/hooks/useAWS";

export default function CarbonPage() {
  const { data: dailyData, isLoading } = useAWSData("cost-daily");
  const { data: costSummary } = useAWSData("cost-summary");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading carbon data...</p>
        </div>
      </div>
    );
  }

  const currentCost = costSummary?.currentCost || 0;
  const previousCost = costSummary?.previousCost || 0;
  const CO2_PER_DOLLAR = 0.0004;

  const currentEmissions = currentCost * CO2_PER_DOLLAR;
  const previousEmissions = previousCost * CO2_PER_DOLLAR;
  const reductionPercent = previousEmissions > 0 ? ((previousEmissions - currentEmissions) / previousEmissions * 100) : 0;
  const savedCO2 = Math.max(0, previousEmissions - currentEmissions);

  const stats = [
    { icon: Leaf, label: "Current Emissions", value: `${currentEmissions.toFixed(2)}t CO₂e`, color: "text-primary" },
    { icon: TrendingDown, label: "vs Last Month", value: `${reductionPercent >= 0 ? "-" : "+"}${Math.abs(reductionPercent).toFixed(1)}%`, color: reductionPercent >= 0 ? "text-primary" : "text-destructive" },
    { icon: TreePine, label: "CO₂ Saved", value: `${savedCO2.toFixed(3)}t`, color: "text-primary" },
    { icon: Zap, label: "Est. Energy (kWh)", value: `${(currentCost * 0.5).toFixed(0)}`, color: "text-primary" },
  ];

  const daily = dailyData?.daily || [];
  const weeklyData: { week: string; actual: number; optimized: number }[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const totalCost = chunk.reduce((sum: number, d: any) => sum + d.cost, 0);
    weeklyData.push({
      week: `W${Math.floor(i / 7) + 1}`,
      actual: parseFloat((totalCost * CO2_PER_DOLLAR * 1000).toFixed(1)),
      optimized: parseFloat((totalCost * CO2_PER_DOLLAR * 0.85 * 1000).toFixed(1)),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carbon Tracking</h1>
        <p className="text-sm text-muted-foreground">Estimated carbon footprint of your AWS infrastructure</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass p-5">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Weekly CO₂ Emissions (kg)</h3>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
              <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215, 15%, 55%)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 15%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 15%, 55%)" }} />
              <Bar dataKey="actual" name="Actual" fill="hsl(150, 80%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="optimized" name="Optimized" fill="hsl(185, 80%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">No data available</div>
        )}
      </motion.div>

      {reductionPercent > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass p-5">
          <div className="flex items-center gap-3">
            <Leaf className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Great progress!</p>
              <p className="text-xs text-muted-foreground">Your estimated emissions are {reductionPercent.toFixed(1)}% lower than last month.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
