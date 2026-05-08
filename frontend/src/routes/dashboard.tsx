import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  BarChart3, 
  Leaf, 
  Settings, 
  LogOut, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Antigravity } from "@/components/ui/Animations";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const data = [
  { name: "Mon", cost: 4000 },
  { name: "Tue", cost: 3000 },
  { name: "Wed", cost: 5000 },
  { name: "Thu", cost: 2780 },
  { name: "Fri", cost: 1890 },
  { name: "Sat", cost: 2390 },
  { name: "Sun", cost: 3490 },
];

function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-glass-border glass backdrop-blur-3xl hidden lg:flex flex-col p-6 fixed h-full z-20">
        <div className="flex items-center gap-2 mb-12">
          <Shield className="text-primary w-8 h-8" />
          <span className="font-black text-xl tracking-tighter">GUARD</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active />
          <SidebarLink icon={<BarChart3 />} label="Cost Analysis" />
          <SidebarLink icon={<Leaf />} label="Carbon Impact" />
          <SidebarLink icon={<Settings />} label="Settings" />
        </nav>

        <div className="mt-auto">
          <SidebarLink icon={<LogOut />} label="Sign Out" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">DASHBOARD_OVERVIEW</h1>
            <p className="text-muted-text">Live telemetry from multi-cloud grid.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-xl border-primary/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse glow-green" />
              <span className="text-xs font-bold tracking-widest text-primary uppercase">System Online</span>
            </div>
          </div>
        </header>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Antigravity delay={0}>
            <KPICard 
              label="Total Monthly Spend" 
              value="$42,890.12" 
              trend={<TrendingUp className="w-4 h-4 text-red-500" />} 
              trendText="+12% vs last month"
            />
          </Antigravity>
          <Antigravity delay={1}>
            <KPICard 
              label="Est. Yearly Savings" 
              value="$12,400.00" 
              trend={<TrendingDown className="w-4 h-4 text-primary" />} 
              trendText="-8% optimization gap"
            />
          </Antigravity>
          <Antigravity delay={2}>
            <KPICard 
              label="Carbon Footprint" 
              value="42.5 Tons" 
              trend={<TrendingDown className="w-4 h-4 text-primary" />} 
              trendText="-2.4% vs last week"
            />
          </Antigravity>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <GlassCard className="lg:col-span-2 p-8" tilt={false}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">COST_TELEMETRY</h3>
              <select className="bg-glass-border/50 border-none rounded-lg text-sm px-3 py-1 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-glass-border)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--color-muted-text)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--color-muted-text)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--color-glass)", 
                      border: "1px solid var(--color-glass-border)",
                      borderRadius: "12px",
                      color: "white"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="var(--color-primary)" 
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-8" tilt={false}>
            <h3 className="text-xl font-bold mb-6">AI_RECOMMENDATIONS</h3>
            <div className="space-y-4">
              <RecommendationItem 
                type="Urgent" 
                title="Zombie Instance Detected" 
                desc="i-0923... in us-east-1 idle for 72h."
                saving="$120/mo"
              />
              <RecommendationItem 
                type="Optimization" 
                title="Rightsize DB Instance" 
                desc="RDS production is over-provisioned."
                saving="$450/mo"
              />
              <RecommendationItem 
                type="Carbon" 
                title="Move to Low-Carbon" 
                desc="Relocate jobs to eu-west-1 (90% green)."
                saving="1.2 Tons"
              />
            </div>
          </GlassCard>
        </div>

        {/* Resource Table */}
        <GlassCard className="p-0 overflow-hidden" tilt={false}>
          <div className="p-6 border-b border-glass-border">
            <h3 className="text-xl font-bold">ACTIVE_RESOURCES</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-glass/50 text-xs font-bold tracking-widest text-muted-text uppercase">
                  <th className="p-6">Resource ID</th>
                  <th className="p-6">Type</th>
                  <th className="p-6">Region</th>
                  <th className="p-6">Cost/Hr</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                <ResourceRow id="i-09f12..." type="EC2 Instance" region="us-east-1" cost="$0.12" status="Active" />
                <ResourceRow id="db-proweb..." type="RDS Postgres" region="us-west-2" cost="$0.85" status="Active" />
                <ResourceRow id="st-logs-99" type="S3 Bucket" region="eu-central-1" cost="$0.02" status="Active" />
                <ResourceRow id="lambda-calc" type="Function" region="ap-south-1" cost="$0.01" status="Idle" />
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
      ${active ? "bg-primary text-background font-bold glow-green" : "text-muted-text hover:text-foreground hover:bg-glass-border/50"}
    `}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      <span className="text-sm tracking-tight">{label}</span>
    </div>
  );
}

function KPICard({ label, value, trend, trendText }: any) {
  return (
    <GlassCard className="p-6" tilt={false}>
      <span className="text-xs font-bold tracking-widest text-muted-text uppercase mb-2 block">{label}</span>
      <div className="text-3xl font-black tracking-tight mb-2">{value}</div>
      <div className="flex items-center gap-2 text-xs font-medium">
        {trend}
        <span>{trendText}</span>
      </div>
    </GlassCard>
  );
}

function RecommendationItem({ type, title, desc, saving }: any) {
  const color = type === "Urgent" ? "text-red-500" : type === "Carbon" ? "text-secondary" : "text-primary";
  return (
    <div className="p-4 rounded-xl bg-glass-border/30 border border-glass-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{type}</span>
        <span className="text-xs font-bold text-primary">{saving}</span>
      </div>
      <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-[11px] text-muted-text">{desc}</p>
    </div>
  );
}

function ResourceRow({ id, type, region, cost, status }: any) {
  return (
    <tr className="hover:bg-glass-border/20 transition-colors cursor-pointer group">
      <td className="p-6 text-sm font-mono text-muted-text group-hover:text-foreground">{id}</td>
      <td className="p-6 text-sm font-medium">{type}</td>
      <td className="p-6 text-sm text-muted-text">{region}</td>
      <td className="p-6 text-sm font-bold">{cost}</td>
      <td className="p-6">
        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-block ${status === "Active" ? "bg-primary/20 text-primary" : "bg-glass-border text-muted-text"}`}>
          {status}
        </div>
      </td>
    </tr>
  );
}
