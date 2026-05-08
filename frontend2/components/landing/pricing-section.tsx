"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Check, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams and startups",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      "Up to 50 cloud resources",
      "Basic cost analytics",
      "Security monitoring",
      "Email alerts",
      "1 cloud provider",
      "Community support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing teams with complex needs",
    monthlyPrice: 299,
    yearlyPrice: 249,
    features: [
      "Up to 500 cloud resources",
      "Advanced cost optimization",
      "AI-powered recommendations",
      "Real-time security alerts",
      "3 cloud providers",
      "API access",
      "Priority support",
      "Carbon tracking",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      "Unlimited cloud resources",
      "Custom AI models",
      "Advanced threat detection",
      "RBAC & SSO",
      "Unlimited cloud providers",
      "Dedicated support",
      "Custom integrations",
      "On-premise deployment",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [isYearly, setIsYearly] = useState(true)

  return (
    <section id="pricing" className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Simple, Transparent <span className="text-primary neon-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your needs. All plans include a 14-day free trial 
            with no credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
            </span>
            <span className="text-xs text-neon-green px-2 py-1 rounded-full bg-neon-green/20">
              Save 20%
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.highlighted
                  ? "glass-card neon-glow border-primary/50"
                  : "glass-card hover:neon-glow"
              } transition-all`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                {plan.monthlyPrice !== null ? (
                  <>
                    <span className="text-4xl font-bold text-foreground">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    {isYearly && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed annually
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold text-foreground">Custom Pricing</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.highlighted ? "neon-glow" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 glass-card rounded-2xl p-8 text-center max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Need a custom solution?</span>
          </div>
          <p className="text-muted-foreground mb-6">
            Our enterprise team will work with you to create a tailored solution 
            that meets your specific requirements and compliance needs.
          </p>
          <Button variant="outline" size="lg">
            Schedule a Demo
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
