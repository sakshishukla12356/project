import { motion } from "framer-motion";
import { Cloud, DollarSign, Leaf, Bot } from "lucide-react";

function EmptyCard({ icon: Icon, title, subtitle, delay }: { icon: any; title: string; subtitle: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      viewport={{ once: true }}
      className="glass p-5 glow-green group hover:border-primary/30 transition-all duration-300"
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="space-y-2">
        <div className="skeleton-pulse h-8 w-24" />
        <div className="skeleton-pulse h-3 w-full" />
        <div className="skeleton-pulse h-3 w-3/4" />
      </div>
      <p className="text-xs text-muted-foreground mt-3">{subtitle}</p>
    </motion.div>
  );
}

export function DashboardPreview() {
  return (
    <div className="glass-strong p-6 md:p-8 glow-green relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="relative z-10">
        {/* Top bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-primary/60" />
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">dashboard.cloudcostguard.io</span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <EmptyCard icon={DollarSign} title="Total Cost" subtitle="Your cloud cost insights will appear here" delay={0.1} />
          <EmptyCard icon={Cloud} title="Active Services" subtitle="No data yet — connect your cloud" delay={0.2} />
          <EmptyCard icon={Leaf} title="Carbon Emissions" subtitle="Track emissions after connection" delay={0.3} />
          <EmptyCard icon={Bot} title="AI Insights" subtitle="AI recommendations generated automatically" delay={0.4} />
        </div>

        {/* Chart placeholder */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Cost Over Time</span>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t skeleton-pulse"
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.random() * 60 + 20}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            No data yet — connect your cloud to start tracking
          </p>
        </div>
      </div>
    </div>
  );
}
