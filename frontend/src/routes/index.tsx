import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Zap, BarChart3, Cloud, Leaf, Cpu } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between border-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg glow-green flex items-center justify-center">
              <Shield className="text-background w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter">
              CloudCost<span className="text-primary">Guard</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-text">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
          <Link to="/login">
            <button className="bg-primary text-background px-5 py-2 rounded-xl font-bold text-sm glow-green hover:scale-105 transition-transform">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter">
              OPTIMIZE YOUR <br />
              <span className="gradient-text">CLOUD FUTURE</span>
            </h1>
            <p className="text-xl text-muted-text max-w-2xl mx-auto mb-10 leading-relaxed">
              Track and reduce cloud costs and carbon footprint across AWS, Azure, and GCP with our premium, AI-driven intelligence platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <button className="bg-primary text-background px-8 py-4 rounded-2xl font-bold text-lg glow-green flex items-center gap-2 hover:scale-105 transition-transform group">
                  Start Tracking Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button className="glass px-8 py-4 rounded-2xl font-bold text-lg hover:bg-glass-border transition-colors">
                Book a Demo
              </button>
            </div>
          </motion.div>

          {/* Stats Ticker */}
          <div className="mt-20 overflow-hidden relative">
            <div className="flex animate-ticker gap-12 items-center whitespace-nowrap">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex gap-12 items-center">
                  <StatItem label="Total Saved" value="$2.4M" />
                  <StatItem label="CO₂ Reduced" value="18,400 Tons" />
                  <StatItem label="Active Assets" value="1.2M+" />
                  <StatItem label="Uptime" value="99.99%" />
                  <StatItem label="Global Regions" value="64+" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-glass/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Enterprise Grade Power</h2>
            <p className="text-muted-text">Everything you need to dominate your cloud infrastructure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="text-primary" />}
              title="Real-time Tracking"
              description="Get millisecond-accurate insights into your global cloud spending."
            />
            <FeatureCard
              icon={<Cpu className="text-secondary" />}
              title="AI Recommendations"
              description="Our proprietary LLMs suggest optimizations that save up to 40%."
            />
            <FeatureCard
              icon={<Leaf className="text-primary" />}
              title="Carbon Analytics"
              description="Measure and offset the environmental impact of your compute."
            />
            <FeatureCard
              icon={<Cloud className="text-secondary" />}
              title="AWS Integration"
              description="Deep-level API access for comprehensive AWS cost breakdown."
            />
            <FeatureCard
              icon={<Cloud className="text-primary" />}
              title="Azure Optimization"
              description="Maximize your Azure commitment with smart resource allocation."
            />
            <FeatureCard
              icon={<BarChart3 className="text-secondary" />}
              title="Multi-Cloud Dash"
              description="One unified pane of glass for all your cloud providers."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <GlassCard className="p-12 text-center border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            <Shield className="w-16 h-16 text-primary mx-auto mb-6 glow-green" />
            <h2 className="text-4xl md:text-5xl font-black mb-6">READY TO SCALE SMARTER?</h2>
            <p className="text-xl text-muted-text mb-10 max-w-2xl mx-auto">
              Join 500+ enterprises optimizing their cloud footprint today. Secure, automated, and cinematic.
            </p>
            <Link to="/signup">
              <button className="bg-secondary text-background px-10 py-5 rounded-2xl font-black text-xl glow-cyan hover:scale-105 transition-transform">
                CONNECT YOUR ACCOUNT
              </button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-glass-border">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
             <Shield className="text-primary w-6 h-6" />
             <span className="font-bold tracking-tighter">CloudCostGuard</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-text">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
          <p className="text-sm text-muted-text">© 2026 CloudCostGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-bold text-primary tracking-widest uppercase">{label}</span>
      <span className="text-4xl font-black tracking-tighter">{value}</span>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <GlassCard className="group h-full">
      <div className="w-12 h-12 rounded-xl glass mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-text text-sm leading-relaxed">{description}</p>
    </GlassCard>
  );
}
