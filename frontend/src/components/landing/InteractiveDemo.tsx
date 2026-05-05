import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { DollarSign, Leaf, Bot, Server } from "lucide-react";

function AnimatedNumber({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!active) { setDisplay(0); return; }
    let start = 0;
    const step = value / 40;
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(Math.round(start));
    }, 25);
    return () => clearInterval(interval);
  }, [active, value]);
  return <span>{active ? display.toLocaleString() : "—"}</span>;
}

export function InteractiveDemo() {
  const [hasData, setHasData] = useState(false);

  return (
    <section id="demo" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            See the <span className="text-gradient">transformation</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">Toggle between empty and data-filled states.</p>

          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted">
            <button
              onClick={() => setHasData(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!hasData ? "bg-primary text-primary-foreground glow-green" : "text-muted-foreground hover:text-foreground"}`}
            >
              Empty State
            </button>
            <button
              onClick={() => setHasData(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${hasData ? "bg-primary text-primary-foreground glow-green" : "text-muted-foreground hover:text-foreground"}`}
            >
              With Data
            </button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto glass-strong p-6 md:p-8 glow-green">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: DollarSign, label: "Monthly Cost", value: 12847, prefix: "$" },
              { icon: Server, label: "Active Services", value: 23, prefix: "" },
              { icon: Leaf, label: "CO₂ Saved", value: 2400, prefix: "", suffix: "kg" },
              { icon: Bot, label: "AI Suggestions", value: 5, prefix: "" },
            ].map((item) => (
              <div key={item.label} className="glass p-4 transition-all duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${hasData ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <AnimatePresence mode="wait">
                  {hasData ? (
                    <motion.p
                      key="data"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-2xl font-bold text-foreground"
                    >
                      {item.prefix}<AnimatedNumber value={item.value} active={hasData} />{item.suffix && <span className="text-sm text-muted-foreground ml-1">{item.suffix}</span>}
                    </motion.p>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="skeleton-pulse h-8 w-20"
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="glass p-5">
            <span className="text-sm font-medium text-foreground block mb-4">Cost Trend</span>
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = hasData ? (Math.sin(i * 0.5) * 30 + 50 + Math.random() * 20) : 15;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t"
                    animate={{
                      height: `${height}%`,
                      backgroundColor: hasData ? "hsl(150, 80%, 50%)" : "hsl(220, 15%, 14%)",
                    }}
                    transition={{ duration: 0.6, delay: i * 0.03 }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
