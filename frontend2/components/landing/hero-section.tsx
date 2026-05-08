"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, TrendingDown, Shield, Zap, Cloud } from "lucide-react"

const floatingCards = [
  {
    icon: TrendingDown,
    title: "Cost Reduced",
    value: "-42%",
    color: "text-accent",
  },
  {
    icon: Shield,
    title: "Security Score",
    value: "98/100",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "Resources Optimized",
    value: "156",
    color: "text-neon-cyan",
  },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">AI-Powered Cloud Intelligence</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              <span className="text-foreground">Optimize Costs.</span>
              <br />
              <span className="text-primary neon-text">Secure Cloud.</span>
              <br />
              <span className="text-foreground">Maximize Value.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Monitor cloud costs, detect security risks, optimize resources, and manage 
              AWS/Azure infrastructure intelligently with our AI-powered platform. 
              Save up to 40% on cloud spending.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="neon-glow group" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group">
                <Play className="mr-2 w-4 h-4" />
                Explore Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {[
                { value: "$2.5B+", label: "Cloud costs optimized" },
                { value: "500+", label: "Enterprise clients" },
                { value: "99.9%", label: "Uptime guarantee" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Floating Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[500px] hidden lg:block"
          >
            {/* Central Vortex Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-primary/20 animate-pulse-glow" />
            </div>

            {/* Floating Analytics Cards */}
            {floatingCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.2 }}
                className={`absolute glass-card rounded-xl p-4 neon-glow animate-float`}
                style={{
                  top: index === 0 ? "10%" : index === 1 ? "40%" : "70%",
                  left: index === 0 ? "10%" : index === 1 ? "50%" : "20%",
                  animationDelay: `${index * 0.5}s`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-primary/20 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{card.title}</div>
                    <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Cloud Provider Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-10 right-10 flex gap-3"
            >
              {["AWS", "Azure", "GCP"].map((provider) => (
                <div
                  key={provider}
                  className="px-3 py-1 rounded-full glass text-xs text-muted-foreground"
                >
                  {provider}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
