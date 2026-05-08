"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, Bell, Palette, Settings2, Cloud, Code, DollarSign, MessageSquare,
  Shield, Key, Users, FileText, Clock, AlertTriangle, Fingerprint, 
  Lock, Zap, ChevronRight, Check, Moon, Sun, Monitor
} from "lucide-react"

type SettingsCategory = "basic" | "intermediate" | "advanced"

interface SettingsSection {
  id: string
  label: string
  icon: React.ElementType
  category: SettingsCategory
}

const settingsSections: SettingsSection[] = [
  // Basic
  { id: "profile", label: "Profile", icon: User, category: "basic" },
  { id: "notifications", label: "Notifications", icon: Bell, category: "basic" },
  { id: "theme", label: "Theme", icon: Palette, category: "basic" },
  { id: "preferences", label: "Preferences", icon: Settings2, category: "basic" },
  // Intermediate
  { id: "cloud", label: "Cloud Integrations", icon: Cloud, category: "intermediate" },
  { id: "api", label: "API Configurations", icon: Code, category: "intermediate" },
  { id: "budget", label: "Budget Alerts", icon: DollarSign, category: "intermediate" },
  { id: "chatbot", label: "Chatbot Preferences", icon: MessageSquare, category: "intermediate" },
  // Advanced
  { id: "rbac", label: "RBAC Management", icon: Users, category: "advanced" },
  { id: "iam", label: "IAM Permissions", icon: Key, category: "advanced" },
  { id: "mfa", label: "MFA Configuration", icon: Fingerprint, category: "advanced" },
  { id: "audit", label: "Audit Logs", icon: FileText, category: "advanced" },
  { id: "sessions", label: "Session Management", icon: Clock, category: "advanced" },
  { id: "threat", label: "Threat Detection", icon: AlertTriangle, category: "advanced" },
  { id: "tokens", label: "Token Management", icon: Lock, category: "advanced" },
  { id: "policies", label: "Security Policies", icon: Shield, category: "advanced" },
  { id: "automation", label: "Automation Rules", icon: Zap, category: "advanced" },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile")
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark")

  const categoryColors = {
    basic: "text-neon",
    intermediate: "text-amber-400",
    advanced: "text-red-400",
  }

  const categoryLabels = {
    basic: "Basic Settings",
    intermediate: "Intermediate Settings",
    advanced: "Advanced Security Settings",
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and security preferences</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          {(["basic", "intermediate", "advanced"] as SettingsCategory[]).map((category) => (
            <div key={category}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${categoryColors[category]}`}>
                {categoryLabels[category]}
              </h3>
              <div className="space-y-1">
                {settingsSections
                  .filter((s) => s.category === category)
                  .map((section) => {
                    const Icon = section.icon
                    const isActive = activeSection === section.id
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-neon/20 text-neon border border-neon/30"
                            : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <div className="backdrop-blur-xl bg-card/30 border border-neon/20 rounded-2xl p-6">
            <AnimatePresence mode="wait">
              {/* Profile Settings */}
              {activeSection === "profile" && (
                <SettingsContent key="profile" title="Profile Settings" description="Manage your personal information">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center">
                        <User className="w-10 h-10 text-neon" />
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-neon text-background rounded-lg text-sm font-medium hover:bg-neon/90 transition-all">
                          Change Avatar
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField label="Full Name" placeholder="John Doe" />
                      <InputField label="Email" placeholder="john@example.com" type="email" />
                      <InputField label="Company" placeholder="Acme Inc." />
                      <InputField label="Role" placeholder="Cloud Engineer" />
                    </div>
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <SettingsContent key="notifications" title="Notification Preferences" description="Configure how you receive alerts">
                  <div className="space-y-4">
                    <ToggleItem label="Email Notifications" description="Receive cost alerts via email" defaultChecked />
                    <ToggleItem label="Push Notifications" description="Browser push notifications for critical alerts" defaultChecked />
                    <ToggleItem label="Weekly Reports" description="Receive weekly cost summary reports" defaultChecked />
                    <ToggleItem label="Security Alerts" description="Immediate notification for security events" defaultChecked />
                    <ToggleItem label="Budget Warnings" description="Alert when approaching budget limits" />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Theme */}
              {activeSection === "theme" && (
                <SettingsContent key="theme" title="Theme Settings" description="Customize your visual experience">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "light", label: "Light", icon: Sun },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((t) => {
                        const Icon = t.icon
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id as typeof theme)}
                            className={`p-4 rounded-xl border text-center transition-all ${
                              theme === t.id
                                ? "bg-neon/20 border-neon/50 text-neon"
                                : "bg-background/30 border-neon/10 text-muted-foreground hover:border-neon/30"
                            }`}
                          >
                            <Icon className="w-6 h-6 mx-auto mb-2" />
                            <span className="text-sm font-medium">{t.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Preferences */}
              {activeSection === "preferences" && (
                <SettingsContent key="preferences" title="General Preferences" description="Customize your dashboard experience">
                  <div className="space-y-4">
                    <SelectField label="Default Dashboard" options={["Overview", "Cost Analysis", "Security"]} />
                    <SelectField label="Currency" options={["USD", "EUR", "GBP", "JPY"]} />
                    <SelectField label="Timezone" options={["UTC", "EST", "PST", "GMT"]} />
                    <SelectField label="Date Format" options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Cloud Integrations */}
              {activeSection === "cloud" && (
                <SettingsContent key="cloud" title="Cloud Integrations" description="Manage your connected cloud accounts">
                  <div className="space-y-4">
                    <CloudIntegrationCard provider="AWS" status="connected" accounts={3} />
                    <CloudIntegrationCard provider="Azure" status="not_connected" accounts={0} />
                    <CloudIntegrationCard provider="GCP" status="not_connected" accounts={0} />
                  </div>
                </SettingsContent>
              )}

              {/* API Configurations */}
              {activeSection === "api" && (
                <SettingsContent key="api" title="API Configurations" description="Manage API keys and webhooks">
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-background/30 border border-neon/10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">API Key</h4>
                          <p className="text-xs text-muted-foreground">Use this key to access the API</p>
                        </div>
                        <button className="px-3 py-1.5 bg-neon/20 text-neon text-xs rounded-lg border border-neon/30">
                          Regenerate
                        </button>
                      </div>
                      <code className="block p-3 bg-background/50 rounded-lg text-xs text-muted-foreground font-mono">
                        sk_live_••••••••••••••••••••••••••••••••
                      </code>
                    </div>
                    <InputField label="Webhook URL" placeholder="https://your-server.com/webhook" />
                    <ToggleItem label="Enable Webhooks" description="Send real-time updates to your endpoint" />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Budget Alerts */}
              {activeSection === "budget" && (
                <SettingsContent key="budget" title="Budget Alerts" description="Set spending limits and alerts">
                  <div className="space-y-4">
                    <InputField label="Monthly Budget ($)" placeholder="10000" type="number" />
                    <InputField label="Alert Threshold (%)" placeholder="80" type="number" />
                    <ToggleItem label="Auto-pause Resources" description="Automatically pause non-critical resources when budget exceeded" />
                    <ToggleItem label="Daily Spending Alerts" description="Get notified of daily spending spikes" defaultChecked />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Chatbot Preferences */}
              {activeSection === "chatbot" && (
                <SettingsContent key="chatbot" title="AI Chatbot Preferences" description="Customize your AI assistant">
                  <div className="space-y-4">
                    <SelectField label="Response Style" options={["Concise", "Detailed", "Technical"]} />
                    <SelectField label="Default Context" options={["Cost Optimization", "Security", "General"]} />
                    <ToggleItem label="Auto-suggestions" description="Show proactive optimization suggestions" defaultChecked />
                    <ToggleItem label="Code Examples" description="Include code snippets in responses" defaultChecked />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* RBAC Management */}
              {activeSection === "rbac" && (
                <SettingsContent key="rbac" title="Role-Based Access Control" description="Manage user roles and permissions">
                  <div className="space-y-4">
                    <RoleCard role="Admin" users={2} permissions={["Full Access", "User Management", "Billing"]} />
                    <RoleCard role="Analyst" users={5} permissions={["View Reports", "Export Data", "Create Alerts"]} />
                    <RoleCard role="Viewer" users={12} permissions={["View Dashboard", "View Reports"]} />
                    <button className="w-full py-3 border border-dashed border-neon/30 rounded-xl text-neon text-sm hover:bg-neon/10 transition-all">
                      + Create New Role
                    </button>
                  </div>
                </SettingsContent>
              )}

              {/* IAM Permissions */}
              {activeSection === "iam" && (
                <SettingsContent key="iam" title="IAM Permissions" description="Configure identity and access management">
                  <div className="space-y-4">
                    <ToggleItem label="Require IAM Review" description="Require approval for IAM changes" defaultChecked />
                    <ToggleItem label="Least Privilege Enforcement" description="Automatically flag over-permissive policies" defaultChecked />
                    <ToggleItem label="Cross-Account Access" description="Allow access from trusted accounts" />
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-200">3 over-permissive IAM roles detected</p>
                          <button className="text-xs text-amber-400 hover:underline mt-1">Review Now</button>
                        </div>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* MFA Configuration */}
              {activeSection === "mfa" && (
                <SettingsContent key="mfa" title="Multi-Factor Authentication" description="Enhance your account security">
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-200">MFA is enabled</p>
                          <p className="text-xs text-green-400">Using authenticator app</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <MFAMethodCard method="Authenticator App" status="active" />
                      <MFAMethodCard method="SMS Backup" status="inactive" />
                      <MFAMethodCard method="Hardware Key" status="inactive" />
                      <MFAMethodCard method="Recovery Codes" status="active" />
                    </div>
                  </div>
                </SettingsContent>
              )}

              {/* Audit Logs */}
              {activeSection === "audit" && (
                <SettingsContent key="audit" title="Audit Logs" description="Review security and activity logs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <SelectField label="Filter by Action" options={["All Actions", "Login", "Settings Change", "API Access"]} />
                      <button className="px-4 py-2 bg-neon/20 text-neon text-sm rounded-lg border border-neon/30">
                        Export Logs
                      </button>
                    </div>
                    <div className="space-y-2">
                      <AuditLogEntry action="Login" user="john@example.com" time="2 min ago" ip="192.168.1.1" />
                      <AuditLogEntry action="Settings Changed" user="admin@example.com" time="1 hour ago" ip="10.0.0.1" />
                      <AuditLogEntry action="API Key Generated" user="john@example.com" time="3 hours ago" ip="192.168.1.1" />
                      <AuditLogEntry action="Cloud Connected" user="admin@example.com" time="1 day ago" ip="10.0.0.1" />
                    </div>
                  </div>
                </SettingsContent>
              )}

              {/* Session Management */}
              {activeSection === "sessions" && (
                <SettingsContent key="sessions" title="Session Management" description="Manage active sessions">
                  <div className="space-y-4">
                    <SessionCard device="Chrome on MacOS" location="San Francisco, US" current />
                    <SessionCard device="Firefox on Windows" location="New York, US" />
                    <SessionCard device="Safari on iPhone" location="Los Angeles, US" />
                    <button className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all">
                      Revoke All Other Sessions
                    </button>
                  </div>
                </SettingsContent>
              )}

              {/* Threat Detection */}
              {activeSection === "threat" && (
                <SettingsContent key="threat" title="Threat Detection" description="Configure security monitoring">
                  <div className="space-y-4">
                    <ToggleItem label="Anomaly Detection" description="AI-powered detection of unusual activity" defaultChecked />
                    <ToggleItem label="Brute Force Protection" description="Block repeated failed login attempts" defaultChecked />
                    <ToggleItem label="Geo-blocking" description="Block access from suspicious regions" />
                    <ToggleItem label="IP Whitelisting" description="Only allow access from approved IPs" />
                    <InputField label="Suspicious Activity Threshold" placeholder="5 failed attempts" />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Token Management */}
              {activeSection === "tokens" && (
                <SettingsContent key="tokens" title="Token Management" description="Manage access tokens">
                  <div className="space-y-4">
                    <SelectField label="Token Expiration" options={["1 hour", "24 hours", "7 days", "30 days"]} />
                    <ToggleItem label="Rotate Tokens Automatically" description="Automatically rotate tokens periodically" defaultChecked />
                    <ToggleItem label="Single Use Tokens" description="Tokens can only be used once" />
                    <div className="p-4 rounded-xl bg-background/30 border border-neon/10">
                      <h4 className="text-sm font-medium text-foreground mb-3">Active Tokens</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>API Token</span>
                          <span>Expires in 29 days</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Service Token</span>
                          <span>Expires in 6 hours</span>
                        </div>
                      </div>
                    </div>
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Security Policies */}
              {activeSection === "policies" && (
                <SettingsContent key="policies" title="Security Policies" description="Define organization security policies">
                  <div className="space-y-4">
                    <ToggleItem label="Enforce Strong Passwords" description="Require minimum 12 characters with special characters" defaultChecked />
                    <ToggleItem label="Password Expiration" description="Force password change every 90 days" />
                    <ToggleItem label="Require MFA" description="All users must enable MFA" defaultChecked />
                    <ToggleItem label="SSO Only" description="Only allow sign-in through SSO provider" />
                    <InputField label="Session Timeout (minutes)" placeholder="30" type="number" />
                    <SaveButton />
                  </div>
                </SettingsContent>
              )}

              {/* Automation Rules */}
              {activeSection === "automation" && (
                <SettingsContent key="automation" title="Automation Rules" description="Configure automated actions">
                  <div className="space-y-4">
                    <AutomationRule 
                      name="Auto-shutdown Idle Resources" 
                      description="Shutdown resources with <5% utilization"
                      enabled
                    />
                    <AutomationRule 
                      name="Right-size Recommendations" 
                      description="Apply size recommendations automatically"
                      enabled={false}
                    />
                    <AutomationRule 
                      name="Reserved Instance Purchase" 
                      description="Auto-purchase when savings >20%"
                      enabled={false}
                    />
                    <AutomationRule 
                      name="Security Alert Response" 
                      description="Auto-quarantine suspicious resources"
                      enabled
                    />
                    <button className="w-full py-3 border border-dashed border-neon/30 rounded-xl text-neon text-sm hover:bg-neon/10 transition-all">
                      + Create New Rule
                    </button>
                  </div>
                </SettingsContent>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper Components
function SettingsContent({ 
  title, 
  description, 
  children 
}: { 
  title: string
  description: string
  children: React.ReactNode 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </motion.div>
  )
}

function InputField({ 
  label, 
  placeholder, 
  type = "text" 
}: { 
  label: string
  placeholder: string
  type?: string 
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all"
      />
    </div>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select className="w-full px-4 py-2.5 bg-background/50 border border-neon/20 rounded-xl text-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleItem({ 
  label, 
  description, 
  defaultChecked = false 
}: { 
  label: string
  description: string
  defaultChecked?: boolean 
}) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-neon/10">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-12 h-6 rounded-full transition-all ${
          checked ? "bg-neon" : "bg-muted/50"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

function SaveButton() {
  return (
    <div className="pt-4 border-t border-neon/10">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-2.5 bg-gradient-to-r from-neon to-neon/80 text-background font-medium rounded-xl hover:shadow-lg hover:shadow-neon/30 transition-all"
      >
        Save Changes
      </motion.button>
    </div>
  )
}

function CloudIntegrationCard({ 
  provider, 
  status, 
  accounts 
}: { 
  provider: string
  status: "connected" | "not_connected"
  accounts: number 
}) {
  const colors: Record<string, string> = {
    AWS: "#FF9900",
    Azure: "#0078D4",
    GCP: "#4285F4",
  }
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-neon/10">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${colors[provider]}20` }}
        >
          <Cloud className="w-5 h-5" style={{ color: colors[provider] }} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{provider}</p>
          <p className="text-xs text-muted-foreground">
            {status === "connected" ? `${accounts} accounts connected` : "Not connected"}
          </p>
        </div>
      </div>
      <button
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          status === "connected"
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-neon/20 text-neon border border-neon/30 hover:bg-neon/30"
        }`}
      >
        {status === "connected" ? "Manage" : "Connect"}
      </button>
    </div>
  )
}

function RoleCard({ 
  role, 
  users, 
  permissions 
}: { 
  role: string
  users: number
  permissions: string[] 
}) {
  return (
    <div className="p-4 rounded-xl bg-background/30 border border-neon/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neon" />
          <span className="font-medium text-foreground">{role}</span>
        </div>
        <span className="text-xs text-muted-foreground">{users} users</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {permissions.map((p) => (
          <span key={p} className="px-2 py-1 bg-neon/10 text-neon text-xs rounded-md">{p}</span>
        ))}
      </div>
    </div>
  )
}

function MFAMethodCard({ method, status }: { method: string; status: "active" | "inactive" }) {
  return (
    <div className={`p-4 rounded-xl border ${
      status === "active" 
        ? "bg-green-500/10 border-green-500/30" 
        : "bg-background/30 border-neon/10"
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{method}</span>
        <span className={`text-xs ${status === "active" ? "text-green-400" : "text-muted-foreground"}`}>
          {status === "active" ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  )
}

function AuditLogEntry({ 
  action, 
  user, 
  time, 
  ip 
}: { 
  action: string
  user: string
  time: string
  ip: string 
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-neon/10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-neon" />
        <div>
          <p className="text-sm text-foreground">{action}</p>
          <p className="text-xs text-muted-foreground">{user}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{time}</p>
        <p className="text-xs text-muted-foreground font-mono">{ip}</p>
      </div>
    </div>
  )
}

function SessionCard({ 
  device, 
  location, 
  current = false 
}: { 
  device: string
  location: string
  current?: boolean 
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      current ? "bg-neon/10 border-neon/30" : "bg-background/30 border-neon/10"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{device}</p>
          <p className="text-xs text-muted-foreground">{location}</p>
        </div>
        {current ? (
          <span className="px-2 py-1 bg-neon/20 text-neon text-xs rounded-md">Current</span>
        ) : (
          <button className="text-xs text-red-400 hover:underline">Revoke</button>
        )}
      </div>
    </div>
  )
}

function AutomationRule({ 
  name, 
  description, 
  enabled 
}: { 
  name: string
  description: string
  enabled: boolean 
}) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-neon/10">
      <div className="flex items-center gap-3">
        <Zap className={`w-5 h-5 ${isEnabled ? "text-neon" : "text-muted-foreground"}`} />
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`w-12 h-6 rounded-full transition-all ${
          isEnabled ? "bg-neon" : "bg-muted/50"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            isEnabled ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}
