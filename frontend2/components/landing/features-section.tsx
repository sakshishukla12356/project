"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import {
  Brain,
  TrendingDown,
  Shield,
  Leaf,
  Cloud,
  MessageSquare,
  AlertTriangle,
  Settings,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning algorithms analyze your cloud usage patterns and predict future costs.",
    gradient: "from-primary to-accent",
  },
  {
    icon: TrendingDown,
    title: "Cost Optimization",
    description: "Automatically identify idle resources, rightsizing opportunities, and reserved instance recommendations.",
    gradient: "from-accent to-neon-green",
  },
  {
    icon: Shield,
    title: "Security Monitoring",
    description: "Real-time threat detection, vulnerability scanning, and compliance monitoring across all cloud resources.",
    gradient: "from-primary to-neon-cyan",
  },
  {
    icon: Leaf,
    title: "Carbon Tracking",
    description: "Monitor your cloud carbon footprint and get recommendations for sustainable cloud practices.",
    gradient: "from-neon-green to-accent",
  },
  {
    icon: Cloud,
    title: "Multi-Cloud Management",
    description: "Unified dashboard for AWS, Azure, and GCP with cross-cloud analytics and cost comparison.",
    gradient: "from-neon-cyan to-primary",
  },
  {
    icon: MessageSquare,
    title: "AI Chatbot Assistant",
    description: "Natural language interface to query costs, get recommendations, and manage resources instantly.",
    gradient: "from-primary to-accent",
  },
  {
    icon: AlertTriangle,
    title: "Threat Analytics",
    description: "Advanced threat intelligence with behavioral analysis and automated incident response.",
    gradient: "from-destructive to-primary",
  },
  {
    icon: Settings,
    title: "Resource Automation",
    description: "Automated scaling, scheduling, and resource lifecycle management based on AI recommendations.",
    gradient: "from-accent to-primary",
  },
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Everything You Need for{" "}
            <span className="text-primary neon-text">Cloud Excellence</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive cloud management tools powered by artificial intelligence 
            to help you optimize costs, enhance security, and automate operations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card rounded-2xl p-6 h-full hover:neon-glow transition-all duration-300 hover:-translate-y-2">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 mb-4`}>
                  <feature.icon className="w-full h-full text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
