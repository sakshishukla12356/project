import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import API from "../lib/api";

// 🔥 Dynamic Steps
const awsSteps = [
  "Log in to your AWS Console",
  "Go to IAM → Users → Create User",
  "Attach ReadOnlyAccess policy",
  "Create Access Key under Security Credentials",
  "Copy your Access Key ID and Secret Access Key",
];

const azureSteps = [
  "Log in to Azure Portal",
  "Go to Azure Active Directory",
  "Register a new Application",
  "Create Client Secret",
  "Copy Client ID, Tenant ID, and Secret",
];

export default function ConnectAWS() {
  const [loading, setLoading] = useState(false);
  const [selectedCloud, setSelectedCloud] = useState<"AWS" | "AZURE">("AWS"); // 🔥 NEW
  const navigate = useNavigate();

  const steps = selectedCloud === "AWS" ? awsSteps : azureSteps;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // ⚠️ Still AWS API (we'll upgrade later)
      await API.post("/connect-aws");

      toast.success(`${selectedCloud} connected successfully 🚀`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <ParticlesBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      <div className="w-full max-w-4xl mx-4 grid md:grid-cols-2 gap-6 relative z-10">
        
        {/* LEFT CARD */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-strong p-8 glow-green"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground">
              CloudCostGuard
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connect your Cloud account
          </h1>

          <p className="text-sm text-muted-foreground mb-6">
            Secure connection using backend credentials.
          </p>

          {/* 🔥 CLOUD TOGGLE */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSelectedCloud("AWS")}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCloud === "AWS"
                  ? "bg-primary text-black"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              AWS
            </button>

            <button
              type="button"
              onClick={() => setSelectedCloud("AZURE")}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCloud === "AZURE"
                  ? "bg-primary text-black"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Azure
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleConnect}>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green group"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect {selectedCloud} & Start Scanning
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* RIGHT CARD */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-1">
            How it works
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Your cloud data is securely fetched from backend.
          </p>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </motion.div>
            ))}
          </div>

          {/* 🔥 Dynamic Docs Link */}
          <a
            href={
              selectedCloud === "AWS"
                ? "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html"
                : "https://learn.microsoft.com/en-us/azure/active-directory/develop/"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-6"
          >
            {selectedCloud} Documentation{" "}
            <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}