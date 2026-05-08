"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Leaf,
  Zap,
  Settings,
  Shield,
  Cloud,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: MessageSquare, label: "Chats", href: "/dashboard/chat" },
  { icon: Leaf, label: "Carbon Tracking", href: "/dashboard/carbon" },
  { icon: Zap, label: "Cost Optimization", href: "/dashboard/optimization" },
  { icon: Leaf, label: "Sustainability Insights", href: "/sustainability-insights" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-0 left-0 h-full z-40 glass-card border-r border-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <Cloud className="w-4 h-4 text-primary absolute -top-1 -right-1" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-foreground"
              >
                Cloud<span className="text-primary">Guard</span>
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const isSustainability = item.href === "/sustainability-insights"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive
                    ? isSustainability
                      ? "bg-neon-green/20 text-neon-green shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "bg-primary/20 text-primary neon-glow"
                    : isSustainability
                      ? "text-muted-foreground hover:text-neon-green hover:bg-neon-green/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <motion.div
                  whileHover={isSustainability ? { scale: 1.08 } : { scale: 1.04 }}
                  animate={
                    isSustainability && isActive
                      ? { opacity: [1, 0.85, 1] }
                      : { opacity: 1 }
                  }
                  transition={
                    isSustainability
                      ? { duration: 1.6, repeat: isActive ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                      isSustainability && "text-neon-green drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]",
                      isActive && !isSustainability && "text-primary"
                    )}
                  />
                </motion.div>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
              JD
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
              </div>
            )}
            {!collapsed && (
              <Link href="/login" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
