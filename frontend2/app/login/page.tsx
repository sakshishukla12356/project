"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Lock, Key, Github, Mail, CheckCircle2 } from "lucide-react"
import { VortexBackground } from "@/components/landing/vortex-background"
import { apiClient } from "@/src/services/api"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  
    try {
      const response = await apiClient.post("/auth/login", {
          email,
          password,
      })
      const data = response.data
  
      // Store JWT token
      if (rememberMe) {
        sessionStorage.removeItem("access_token")
        localStorage.setItem("access_token", data.access_token)
      } else {
        localStorage.removeItem("access_token")
        sessionStorage.setItem("access_token", data.access_token)
      }
      window.dispatchEvent(new Event("auth-token-changed"))
  
      // Optional: store user info
      localStorage.setItem("user", JSON.stringify(data.user))
  
      router.push("/onboarding/cloud-select")
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/onboarding/cloud-select")
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
        {/* Security Badges */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-6"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Shield className="w-3 h-3" />
            <span>JWT Auth</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-xs text-neon">
            <Key className="w-3 h-3" />
            <span>RBAC</span>
          </div>
        </motion.div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-card/30 border border-neon/20 rounded-2xl p-8 shadow-2xl shadow-neon/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/30 mb-4"
            >
              <Shield className="w-8 h-8 text-neon" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Sign in to AWS Cloud Cost Guard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
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

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neon/30 bg-background/50 text-neon focus:ring-neon/50"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-neon hover:text-neon/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
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
                  Secure Login
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neon/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/50 backdrop-blur px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground hover:bg-neon/10 hover:border-neon/40 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 bg-background/50 border border-neon/20 rounded-xl text-foreground hover:bg-neon/10 hover:border-neon/40 transition-all"
            >
              <Github className="w-5 h-5" />
              GitHub
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-neon hover:text-neon/80 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-3 rounded-lg bg-neon/5 border border-neon/20"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your session is protected with encrypted JWT authentication and RBAC security protocols.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
