import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shield, Mail, Lock, User, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { getErrorMessage } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUp(email, password, fullName);
      navigate({ to: "/cloud-select" });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <GlassCard className="w-full max-w-md p-8 border-secondary/20" tilt={false}>
        <div className="text-center mb-8">
          <Link to="/">
            <Shield className="w-12 h-12 text-secondary mx-auto mb-4 glow-cyan" />
          </Link>
          <h1 className="text-3xl font-black mb-2">JOIN THE GRID</h1>
          <p className="text-muted-text">Create your multi-cloud commander profile.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold tracking-widest text-secondary uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Connor"
                className="w-full glass bg-glass/20 border-glass-border rounded-xl py-4 pl-12 pr-4 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold tracking-widest text-secondary uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="commander@enterprise.com"
                className="w-full glass bg-glass/20 border-glass-border rounded-xl py-4 pl-12 pr-4 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold tracking-widest text-secondary uppercase">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full glass bg-glass/20 border-glass-border rounded-xl py-4 pl-12 pr-4 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-background font-black py-4 mt-4 rounded-xl glow-cyan hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "REQUEST CLEARANCE"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-text">
          Already enlisted?{" "}
          <Link to="/login" className="text-secondary font-bold hover:underline">
            Identify
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
