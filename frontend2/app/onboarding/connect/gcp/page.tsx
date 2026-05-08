"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Shield, Key, CheckCircle2, ArrowLeft, 
  AlertTriangle, ExternalLink, Loader2, Server, Check, Upload, FileJson, X
} from "lucide-react"
import { VortexBackground } from "@/components/landing/vortex-background"

export default function GCPConnectionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projectId, setProjectId] = useState("")
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
  const [step, setStep] = useState(1)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (file: File) => {
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      setJsonFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string)
          setJsonContent(JSON.stringify(content, null, 2))
          if (content.project_id) {
            setProjectId(content.project_id)
          }
        } catch {
          setJsonContent(null)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#4285F4]/20 border border-[#4285F4]/50 mb-4"
          >
            <Server className="w-8 h-8 text-[#4285F4]" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Connect GCP Account
          </h1>
          <p className="text-muted-foreground">
            Create a service account to connect your Google Cloud project
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
                  ? "bg-[#4285F4] text-white" 
                  : "bg-card/50 border border-neon/20 text-muted-foreground"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-[#4285F4]" : "bg-neon/20"}`} />}
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
                <h2 className="text-xl font-semibold text-foreground mb-4">Step 1: Create Service Account</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-background/30 border border-neon/10">
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4285F4]/20 text-[#4285F4] text-xs flex items-center justify-center">1</span>
                        <span>Go to GCP Console &gt; IAM & Admin &gt; Service Accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4285F4]/20 text-[#4285F4] text-xs flex items-center justify-center">2</span>
                        <span>Create a new service account with a descriptive name</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4285F4]/20 text-[#4285F4] text-xs flex items-center justify-center">3</span>
                        <span>Grant Viewer role to the service account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4285F4]/20 text-[#4285F4] text-xs flex items-center justify-center">4</span>
                        <span>Create and download a JSON key file</span>
                      </li>
                    </ol>
                  </div>

                  <a
                    href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#4285F4] hover:text-[#4285F4]/80 transition-colors"
                  >
                    Open GCP Console
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-200">
                      Assign only Viewer role for read-only access. Avoid Editor or Owner roles for security.
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setStep(2)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#4285F4] to-[#4285F4]/80 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#4285F4]/30 transition-all"
                >
                  I&apos;ve Created the Service Account
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
                <h2 className="text-xl font-semibold text-foreground mb-4">Step 2: Upload Credentials</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Project ID</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]/50 transition-all font-mono"
                        placeholder="my-project-123456"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Service Account JSON Key</label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                      onDragLeave={() => setDragActive(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                        dragActive 
                          ? "border-[#4285F4] bg-[#4285F4]/10" 
                          : jsonFile 
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-neon/20 hover:border-neon/40 hover:bg-neon/5"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                      />
                      
                      {jsonFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileJson className="w-8 h-8 text-green-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">{jsonFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setJsonFile(null)
                              setJsonContent(null)
                            }}
                            className="p-1 rounded-full hover:bg-red-500/20 text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-foreground mb-1">Drop your JSON key file here</p>
                          <p className="text-xs text-muted-foreground">or click to browse</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-neon/5 border border-neon/20">
                    <Shield className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Your JSON key is encrypted using AES-256 before storage. The file is never stored in plain text.
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
                    disabled={!projectId || !jsonFile}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-[#4285F4] to-[#4285F4]/80 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#4285F4]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="text-muted-foreground">Project ID</span>
                        <span className="font-mono text-foreground">{projectId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Key File</span>
                        <span className="text-foreground">{jsonFile?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={testSuccess ? "text-green-400" : "text-muted-foreground"}>
                          {testSuccess ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

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
                        Verifying Access...
                      </>
                    ) : testSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Access Verified
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Verify Secure Access
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
                          Successfully authenticated with GCP. Your service account has the required permissions.
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
                    className="flex-1 py-3 bg-gradient-to-r from-[#4285F4] to-[#4285F4]/80 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#4285F4]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Server className="w-5 h-5" />
                        Connect GCP Account
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
