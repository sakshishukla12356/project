"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Key,
  Server,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

const securityAlerts = [
  {
    type: "critical",
    title: "Public S3 Bucket Detected",
    resource: "prod-data-bucket",
    time: "2 min ago",
  },
  {
    type: "warning",
    title: "IAM User Without MFA",
    resource: "developer-account",
    time: "15 min ago",
  },
  {
    type: "info",
    title: "Security Group Rule Change",
    resource: "sg-webapp-prod",
    time: "1 hour ago",
  },
]

const securityMetrics = [
  { label: "IAM Score", value: 92, icon: Key },
  { label: "Network Security", value: 88, icon: Server },
  { label: "Data Protection", value: 95, icon: Lock },
  { label: "Compliance", value: 85, icon: CheckCircle },
]

const vulnerabilities = [
  { name: "Unencrypted EBS Volumes", count: 3, severity: "high" },
  { name: "Open Security Groups", count: 5, severity: "medium" },
  { name: "Unused Access Keys", count: 8, severity: "low" },
  { name: "Missing Tags", count: 12, severity: "info" },
]

export function SecuritySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="security" className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">Security</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Enterprise-Grade <span className="text-primary neon-text">Security Monitoring</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time threat detection, vulnerability scanning, and compliance monitoring 
            to keep your cloud infrastructure secure.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Security Score */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Security Score</h3>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.2)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 283" }}
                    animate={isInView ? { strokeDasharray: "245 283" } : {}}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">87</span>
                  <span className="text-xs text-muted-foreground">out of 100</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {securityMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-3">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1">{metric.label}</span>
                  <span className="text-sm font-medium text-foreground">{metric.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
              <span className="ml-auto px-2 py-1 rounded-full bg-destructive/20 text-xs text-destructive">
                3 New
              </span>
            </div>

            <div className="space-y-4">
              {securityAlerts.map((alert, index) => (
                <motion.div
                  key={alert.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === "critical"
                      ? "border-l-destructive bg-destructive/10"
                      : alert.type === "warning"
                      ? "border-l-yellow-500 bg-yellow-500/10"
                      : "border-l-primary bg-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.resource}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors">
              View All Alerts →
            </button>
          </motion.div>

          {/* Vulnerabilities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-accent/20">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Vulnerabilities</h3>
            </div>

            <div className="space-y-4">
              {vulnerabilities.map((vuln, index) => (
                <motion.div
                  key={vuln.name}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{vuln.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          vuln.severity === "high"
                            ? "bg-destructive/20 text-destructive"
                            : vuln.severity === "medium"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : vuln.severity === "low"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {vuln.count}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={vuln.severity === "high" ? 90 : vuln.severity === "medium" ? 60 : 30}
                    className="h-1.5"
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Issues</span>
                <span className="font-medium text-foreground">28</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6"
        >
          {["SOC 2", "ISO 27001", "HIPAA", "GDPR", "PCI DSS"].map((badge) => (
            <div
              key={badge}
              className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:neon-glow transition-all"
            >
              <CheckCircle className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-foreground">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
