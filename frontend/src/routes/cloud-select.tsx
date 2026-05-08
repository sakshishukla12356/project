import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Cloud, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Float } from "@/components/ui/Animations";

export const Route = createFileRoute("/cloud-select")({
  component: CloudSelectPage,
});

const CloudProviders = [
  { id: "aws", name: "Amazon Web Services", color: "#FF9900", icon: <Cloud className="w-8 h-8" /> },
  { id: "azure", name: "Microsoft Azure", color: "#0089D6", icon: <Cloud className="w-8 h-8" /> },
  { id: "gcp", name: "Google Cloud Platform", color: "#4285F4", icon: <Cloud className="w-8 h-8" /> },
];

function CloudSelectPage() {
  return (
    <div className="min-h-screen py-20 px-6 max-w-5xl mx-auto text-center">
      <h1 className="text-5xl font-black mb-4">SELECT PROVIDER</h1>
      <p className="text-muted-text mb-16 text-xl">Choose the cloud ecosystem you want to neutralize and optimize.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CloudProviders.map((provider, i) => (
          <Link key={provider.id} to="/dashboard" className="block text-left">
            <Float delay={i * 0.2}>
              <GlassCard className="h-full border-glass-border hover:border-primary/50 transition-all group">
                <div 
                  className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                >
                  {provider.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{provider.name}</h3>
                <p className="text-muted-text mb-8 text-sm">Securely connect your IAM roles and start tracking in seconds.</p>
                <div className="flex items-center gap-2 text-primary font-bold">
                  CONNECT <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Float>
          </Link>
        ))}
      </div>
    </div>
  );
}
