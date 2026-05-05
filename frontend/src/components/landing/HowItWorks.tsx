import { motion } from "framer-motion";
import { KeyRound, ScanSearch, Brain, LayoutDashboard } from "lucide-react";

const steps = [
  { icon: KeyRound, title: "Connect AWS", desc: "Enter your Access Key & Secret Key securely" },
  { icon: ScanSearch, title: "System Scans", desc: "We analyze your entire cloud infrastructure" },
  { icon: Brain, title: "AI Analyzes", desc: "AI identifies optimization opportunities" },
  { icon: LayoutDashboard, title: "Get Insights", desc: "Dashboard populates with actionable data" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            From zero to insights in <span className="text-gradient">4 steps</span>
          </h2>
          <p className="text-muted-foreground text-lg">Setup takes less than 2 minutes.</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* connecting line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50" />

          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 glow-green relative z-10"
              >
                <s.icon className="h-7 w-7 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-primary mb-2 block">Step {i + 1}</span>
              <h3 className="text-lg font-semibold text-foreground mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
