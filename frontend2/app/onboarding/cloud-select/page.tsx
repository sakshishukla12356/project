"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Shield, Lock, Key, CheckCircle2, Cloud, Server } from "lucide-react"
import { VortexBackground } from "@/components/landing/vortex-background"

const cloudProviders = [
  {
    id: "aws",
    name: "Amazon Web Services",
    shortName: "AWS",
    description: "Connect your AWS accounts for comprehensive cost monitoring",
    color: "#FF9900",
    features: ["EC2 Optimization", "S3 Analytics", "Lambda Costs", "RDS Monitoring"],
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    shortName: "Azure",
    description: "Integrate Azure subscriptions for unified cost management",
    color: "#0078D4",
    features: ["VM Optimization", "Blob Storage", "Functions", "SQL Database"],
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    shortName: "GCP",
    description: "Link GCP projects for intelligent cost insights",
    color: "#4285F4",
    features: ["Compute Engine", "Cloud Storage", "Cloud Functions", "BigQuery"],
  },
]

export default function CloudSelectPage() {
  const router = useRouter()
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)

  const handleSelectProvider = (providerId: string) => {
    router.push(`/onboarding/connect/${providerId}`)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-12">
      <VortexBackground />
      
      <div className="relative z-10 w-full max-w-5xl mx-4">
        {/* Security Badges */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-8"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Shield className="w-3 h-3" />
            <span>Secure Connection</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Lock className="w-3 h-3" />
            <span>Encrypted Credentials</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Key className="w-3 h-3" />
            <span>IAM Authentication</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/30 mb-6"
          >
            <Cloud className="w-10 h-10 text-neon" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Connect Your Cloud
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your cloud provider to begin secure onboarding. Read-only access recommended for optimal security.
          </p>
        </motion.div>

        {/* Cloud Provider Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cloudProviders.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onMouseEnter={() => setHoveredProvider(provider.id)}
              onMouseLeave={() => setHoveredProvider(null)}
              onClick={() => handleSelectProvider(provider.id)}
              className="group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="relative backdrop-blur-xl bg-card/30 border border-neon/20 rounded-2xl p-6 h-full transition-all hover:border-neon/50 hover:shadow-lg hover:shadow-neon/20"
              >
                {/* Glow Effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredProvider === provider.id ? 0.3 : 0 }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ 
                    background: `radial-gradient(circle at center, ${provider.color}40, transparent 70%)` 
                  }}
                />

                {/* Provider Icon */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ 
                      y: hoveredProvider === provider.id ? [-5, 5, -5] : 0,
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: hoveredProvider === provider.id ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                    style={{ 
                      backgroundColor: `${provider.color}20`,
                      borderColor: `${provider.color}50`
                    }}
                  >
                    <Server className="w-8 h-8" style={{ color: provider.color }} />
                  </motion.div>
                </div>

                {/* Provider Info */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-foreground mb-1">{provider.shortName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {provider.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-neon" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connect Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-medium text-center transition-all"
                    style={{ 
                      backgroundColor: hoveredProvider === provider.id ? provider.color : `${provider.color}20`,
                      color: hoveredProvider === provider.id ? "#000" : provider.color
                    }}
                  >
                    Connect {provider.shortName}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="backdrop-blur-xl bg-card/30 border border-neon/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-neon mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Enterprise-Grade Security</h4>
                <p className="text-xs text-muted-foreground">
                  Your cloud credentials are encrypted using AES-256 before storage. We recommend using read-only IAM roles for optimal security. No sensitive data is exposed during the connection process.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
