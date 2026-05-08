"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Shield, Mail, ArrowLeft, CheckCircle2, Lock, Clock } from "lucide-react"
import { VortexBackground } from "@/components/landing/vortex-background"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setIsSuccess(true)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <VortexBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Security Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-6"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Lock className="w-3 h-3" />
            <span>Encrypted Reset</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Clock className="w-3 h-3" />
            <span>Auto-Expires</span>
          </div>
        </motion.div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-card/30 border border-neon/20 rounded-2xl p-8 shadow-2xl shadow-neon/10">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Back Link */}
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors mb-6">
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>

                {/* Logo */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/30 mb-4"
                  >
                    <Mail className="w-8 h-8 text-neon" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                  <p className="text-muted-foreground mt-1">We&apos;ll send you a secure reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-neon to-neon/80 text-background font-semibold rounded-xl hover:shadow-lg hover:shadow-neon/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                      />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Send Reset Link
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Security Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 space-y-2"
                >
                  <div className="p-3 rounded-lg bg-neon/5 border border-neon/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Password reset links expire automatically after 15 minutes for your security.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-neon/5 border border-neon/20">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Secure encrypted email verification protects your account.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-neon/20"
                  />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-neon/30 to-neon/10 border border-neon/50 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-neon" />
                    </motion.div>
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h2>
                <p className="text-muted-foreground mb-6">
                  We&apos;ve sent a secure password reset link to <span className="text-neon">{email}</span>
                </p>

                <div className="space-y-3">
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-neon to-neon/80 text-background font-semibold rounded-xl hover:shadow-lg hover:shadow-neon/30 transition-all"
                    >
                      Return to Login
                    </motion.button>
                  </Link>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="w-full py-3 bg-background/50 border border-neon/20 text-foreground font-medium rounded-xl hover:bg-neon/10 transition-all"
                  >
                    Try Different Email
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
