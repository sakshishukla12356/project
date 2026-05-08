"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  RefreshCw,
} from "lucide-react"

const securityMetrics = [
  { label: "IAM Score", value: 92, icon: Key, status: "good" },
  { label: "Network Security", value: 88, icon: Server, status: "good" },
  { label: "Data Protection", value: 95, icon: Lock, status: "excellent" },
  { label: "Compliance", value: 85, icon: CheckCircle, status: "good" },
]

const criticalAlerts = [
  {
    severity: "critical",
    title: "Public S3 Bucket Detected",
    resource: "prod-data-bucket",
    time: "2 min ago",
    description: "Bucket has public read access enabled",
  },
  {
    severity: "critical",
    title: "Root Account Activity",
    resource: "AWS Root",
    time: "1 hour ago",
    description: "Root account used for console login",
  },
]

const warnings = [
  {
    severity: "high",
    title: "IAM Users Without MFA",
    count: 3,
    description: "Users: dev-user-1, staging-admin, test-account",
  },
  {
    severity: "high",
    title: "Open Security Groups",
    count: 5,
    description: "Allowing 0.0.0.0/0 on ports 22, 3389",
  },
  {
    severity: "medium",
    title: "Unencrypted EBS Volumes",
    count: 8,
    description: "Volumes attached to production instances",
  },
  {
    severity: "low",
    title: "Unused Access Keys",
    count: 12,
    description: "Keys not used in last 90 days",
  },
]

const complianceStatus = [
  { framework: "SOC 2 Type II", status: "compliant", lastAudit: "2024-01-15" },
  { framework: "ISO 27001", status: "compliant", lastAudit: "2023-12-01" },
  { framework: "HIPAA", status: "in-progress", lastAudit: "2024-02-28" },
  { framework: "PCI DSS", status: "compliant", lastAudit: "2024-01-20" },
  { framework: "GDPR", status: "compliant", lastAudit: "2023-11-15" },
]

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground">Monitor threats and maintain compliance</p>
        </div>
        <Button className="neon-glow">
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Security Scan
        </Button>
      </motion.div>

      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#securityGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="245 283"
                    />
                    <defs>
                      <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">87</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Overall Security Score</h3>
                  <p className="text-muted-foreground">Your infrastructure is well protected</p>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">2 Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">5 Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-sm text-muted-foreground">28 Passed</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {securityMetrics.map((metric) => (
                  <div key={metric.label} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{metric.value}%</span>
                      <Progress value={metric.value} className="h-1.5 flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <XCircle className="w-5 h-5 text-destructive" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border-l-4 border-l-destructive bg-destructive/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Resource: {alert.resource}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <Button size="sm" variant="destructive" className="mt-3">
                    Remediate Now
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Warnings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-border h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Security Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl glass border-l-4 ${
                    warning.severity === "high"
                      ? "border-l-yellow-500"
                      : warning.severity === "medium"
                      ? "border-l-primary"
                      : "border-l-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">{warning.title}</h4>
                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {warning.count}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{warning.description}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      Fix
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Compliance Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {complianceStatus.map((item) => (
                <div key={item.framework} className="glass rounded-xl p-4 text-center">
                  <h4 className="font-medium text-foreground text-sm">{item.framework}</h4>
                  <div className="mt-2">
                    {item.status === "compliant" ? (
                      <CheckCircle className="w-8 h-8 text-neon-green mx-auto" />
                    ) : (
                      <RefreshCw className="w-8 h-8 text-yellow-500 mx-auto animate-spin" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      item.status === "compliant" ? "text-neon-green" : "text-yellow-500"
                    }`}
                  >
                    {item.status === "compliant" ? "Compliant" : "In Progress"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {item.lastAudit}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
