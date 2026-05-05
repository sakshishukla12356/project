import { motion } from "framer-motion";
import { User, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAWSData } from "@/hooks/useAWS";

export default function SettingsPage() {
  const { user } = useAuth();

  // 🔥 Fetch AWS data
  const { data, isLoading } = useAWSData();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and AWS connection
        </p>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-muted mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Full Name
            </label>
            <Input
              value={user?.user_metadata?.full_name || ""}
              disabled
              className="bg-muted mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* AWS Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            AWS Connection
          </h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking connection...</p>
        ) : data?.status === "success" ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-foreground">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <span className="text-muted-foreground">Not connected</span>
          </div>
        )}
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Read-only AWS access
            </p>
            <p className="text-xs text-muted-foreground">
              We only use limited permissions
            </p>
          </div>
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            Active
          </span>
        </div>
      </motion.div>
    </div>
  );
}