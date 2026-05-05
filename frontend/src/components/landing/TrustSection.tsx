import { motion } from "framer-motion";
import { Clock, Zap, RefreshCw, Lock } from "lucide-react";

const items = [
  { icon: Clock, text: "Setup in 2 minutes" },
  { icon: Zap, text: "No manual input required" },
  { icon: RefreshCw, text: "Auto-sync with AWS" },
  { icon: Lock, text: "Secure credential handling" },
];

export function TrustSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 text-center hover:border-primary/30 transition-colors"
            >
              <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
