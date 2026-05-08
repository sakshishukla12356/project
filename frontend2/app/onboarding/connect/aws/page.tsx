"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Shield, Lock, Key, CheckCircle2, ArrowLeft, Eye, EyeOff, 
  AlertTriangle, ExternalLink, Copy, Check, Loader2, Server
} from "lucide-react"
import { VortexBackground } from "@/components/landing/vortex-background"

const awsRegions = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-west-2", label: "EU (London)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
]

const iamPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ec2:Describe*",
        "rds:Describe*",
        "s3:ListAllMyBuckets",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    }
  ]
}`

export default function AWSConnectionPage() {
  const router = useRouter()
  const [accessKey, setAccessKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [region, setRegion] = useState("us-east-1")
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
  const [copiedPolicy, setCopiedPolicy] = useState(false)
  const [step, setStep] = useState(1)

  const handleCopyPolicy = async () => {
    await navigator.clipboard.writeText(iamPolicy)
    setCopiedPolicy(true)
    setTimeout(() => setCopiedPolicy(false), 2000)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestSuccess(null)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTestSuccess(true)
    setIsTesting(false)
  }

  const handleConnect = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-12">
      <VortexBackground />
      
      <div className="relative z-10 w-full max-w-3xl mx-4">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/onboarding/cloud-select" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to cloud selection
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF9900]/20 border border-[#FF9900]/50 mb-4"
          >
            <Server className="w-8 h-8 text-[#FF9900]" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Connect AWS Account
          </h1>
          <p className="text-muted-foreground">
            Follow the secure setup process to connect your AWS account
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s 
                  ? "bg-neon text-background" 
                  : "bg-card/50 border border-neon/20 text-muted-foreground"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-neon" : "bg-neon/20"}`} />}
            </div>
          ))}
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-card/30 border border-neon/20 rounded-2xl p-8 shadow-2xl shadow-neon/10"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">Step 1: Create IAM User</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-background/30 border border-neon/10">
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neon/20 text-neon text-xs flex items-center justify-center">1</span>
                        <span>Go to AWS IAM Console and create a new user</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neon/20 text-neon text-xs flex items-center justify-center">2</span>
                        <span>Enable programmatic access (Access Key)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neon/20 text-neon text-xs flex items-center justify-center">3</span>
                        <span>Attach the following 3 policies to the user</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neon/20 text-neon text-xs flex items-center justify-center">4</span>
                        <span>Review and create the user</span>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Recommended IAM Policy (Read-Only)</label>
                      <button
                        onClick={handleCopyPolicy}
                        className="flex items-center gap-1 text-xs text-neon hover:text-neon/80 transition-colors"
                      >
                        {copiedPolicy ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedPolicy ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-4 rounded-lg bg-background/50 border border-neon/10 text-xs text-muted-foreground overflow-x-auto">
                      {iamPolicy}
                    </pre>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl backdrop-blur-xl bg-card/40 border border-neon/20 hover:border-[#FF9900]/50 hover:shadow-[0_0_30px_rgba(255,153,0,0.25)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FF9900]/20 border border-[#FF9900]/40 flex items-center justify-center">
                          <Server className="w-5 h-5 text-[#FF9900]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">ReadOnlyAccess</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-neon-green/15 text-neon-green border border-neon-green/30">
                              Required
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Provides read-only access to AWS services and resources.
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl backdrop-blur-xl bg-card/40 border border-neon/20 hover:border-[#FF9900]/50 hover:shadow-[0_0_30px_rgba(255,153,0,0.25)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FF9900]/20 border border-[#FF9900]/40 flex items-center justify-center">
                          <Server className="w-5 h-5 text-[#FF9900]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">AWS Cost Explorer Service Policy</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-neon-green/15 text-neon-green border border-neon-green/30">
                              Required
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Allows access to AWS Cost Explorer to view billing and usage analytics.
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl backdrop-blur-xl bg-card/40 border border-neon/20 hover:border-[#FF9900]/50 hover:shadow-[0_0_30px_rgba(255,153,0,0.25)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FF9900]/20 border border-[#FF9900]/40 flex items-center justify-center">
                          <Server className="w-5 h-5 text-[#FF9900]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">SecurityAudit</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-neon-green/15 text-neon-green border border-neon-green/30">
                              Required
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Provides read-only access to IAM and security-related configurations.
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="p-4 rounded-xl backdrop-blur-xl bg-card/40 border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        These policies provide read-only access and do not allow modifications to AWS resources. This follows the principle of least privilege and ensures secure cloud integration.
                      </p>
                    </div>
                  </motion.div>

                  <a
                    href="https://console.aws.amazon.com/iam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-neon hover:text-neon/80 transition-colors"
                  >
                    Open AWS IAM Console
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-200">
                      We strongly recommend using read-only IAM policies. Never share your root account credentials.
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setStep(2)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-neon to-neon/80 text-background font-semibold rounded-xl hover:shadow-lg hover:shadow-neon/30 transition-all"
                >
                  I&apos;ve Created the IAM User
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">Step 2: Enter Credentials</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">AWS Access Key ID</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all font-mono"
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">AWS Secret Access Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showSecretKey ? "text" : "password"}
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all font-mono"
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSecretKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Default Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-4 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all"
                    >
                      {awsRegions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-neon/5 border border-neon/20">
                    <Shield className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Credentials are encrypted using AES-256 before storage. No sensitive data is exposed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-background/50 border border-neon/20 text-foreground font-medium rounded-xl hover:bg-neon/10 transition-all"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={() => setStep(3)}
                    disabled={!accessKey || !secretKey}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-neon to-neon/80 text-background font-semibold rounded-xl hover:shadow-lg hover:shadow-neon/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">Step 3: Test & Connect</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-background/30 border border-neon/10">
                    <h3 className="text-sm font-medium text-foreground mb-3">Connection Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Access Key</span>
                        <span className="font-mono text-foreground">{accessKey.slice(0, 8)}...{accessKey.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="text-foreground">{awsRegions.find(r => r.value === region)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={testSuccess ? "text-green-400" : "text-muted-foreground"}>
                          {testSuccess ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <motion.button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      testSuccess 
                        ? "bg-green-500/20 border border-green-500/50 text-green-400"
                        : "bg-background/50 border border-neon/20 text-foreground hover:bg-neon/10"
                    }`}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Testing Connection...
                      </>
                    ) : testSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Connection Verified
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Test Secure Connection
                      </>
                    )}
                  </motion.button>

                  {testSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-200">
                          Successfully connected to AWS. Your credentials are valid and have the required permissions.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-background/50 border border-neon/20 text-foreground font-medium rounded-xl hover:bg-neon/10 transition-all"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={handleConnect}
                    disabled={!testSuccess || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-[#FF9900] to-[#FF9900]/80 text-background font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF9900]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Server className="w-5 h-5" />
                        Connect AWS Account
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
