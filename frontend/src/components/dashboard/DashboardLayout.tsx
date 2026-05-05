import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Leaf,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

import { AIChatbot } from "@/components/dashboard/AIChatbot";
import { useAuth } from "@/contexts/AuthContext";
import { useAWSData } from "@/hooks/useAWS";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Leaf, label: "Carbon Tracking", path: "/dashboard/carbon" },
  { icon: FileText, label: "Reports", path: "/dashboard/reports" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const { data, isLoading } = useAWSData();

  // 🔥 Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading your cloud data...</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* 🔥 Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 h-full bg-card/80 backdrop-blur-xl border-r border-border z-40 flex flex-col"
      >

        {/* 🔥 Logo Section */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">
          <img
            src="/logo.png"
            alt="CloudCostGuard"
            className="h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]"
          />

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-base font-bold text-foreground"
              >
                CloudCostGuard
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* 🔥 Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* 🔥 Sign Out */}
        <button
          onClick={handleSignOut}
          className="mx-2 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />

          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* 🔥 Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </motion.aside>

      {/* 🔥 Main Content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-screen"
      >
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </motion.main>

      {/* 🔥 AI Chatbot */}
      <AIChatbot />
    </div>
  );
}