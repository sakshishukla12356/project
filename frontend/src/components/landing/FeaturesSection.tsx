import { motion } from "framer-motion";
import { DollarSign, Leaf, Bot, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Cost Optimization",
    desc: "Identify wasteful spending and receive actionable recommendations to cut cloud costs by up to 40%.",
    before: "No cost data available",
    after: "$12,847/mo — 3 optimization opportunities found",
  },
  {
    icon: Leaf,
    title: "Carbon Tracking",
    desc: "Monitor your cloud infrastructure's carbon footprint with real-time emission metrics.",
    before: "No emission data",
    after: "2.4 tonnes CO₂ saved this month",
  },
  {
    icon: Bot,
    title: "AI Recommendations",
    desc: "AI analyzes usage patterns to suggest shutdowns, rightsizing, and scheduling optimizations.",
    before: "Waiting for data",
    after: "5 AI suggestions — estimated savings: $3,200/mo",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live dashboards with per-service, per-region cost breakdowns updated every 5 minutes.",
    before: "Charts will appear here",
    after: "12 services tracked across 4 regions",
  },
  {
    icon: ShieldCheck,
    title: "Secure AWS Integration",
    desc: "Connect via secure IAM credentials with read-only access. No data leaves your account.",
    before: "Not connected",
    after: "Connected • Last sync: 2 min ago",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything you need to <span className="text-gradient">control cloud spend</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From cost visibility to carbon tracking, powered by intelligent automation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, rotateX: 2 }}
              style={{ transformStyle: "preserve-3d" }}
              className="glass p-6 group hover:border-primary/30 transition-all duration-300 hover:glow-green"
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{f.desc}</p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">Before</span>
                  <span className="text-muted-foreground">{f.before}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">After</span>
                  <span className="text-primary">{f.after}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
