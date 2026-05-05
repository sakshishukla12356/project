import { motion } from "framer-motion";
import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { name: "Monthly Cost Report — February 2026", date: "Mar 1, 2026", type: "Cost Analysis" },
  { name: "Carbon Footprint Q1 Summary", date: "Feb 15, 2026", type: "Carbon" },
  { name: "AI Optimization Recommendations", date: "Feb 10, 2026", type: "AI Insights" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export professional reports</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="space-y-3">
        {reports.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-5 flex items-center justify-between hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {r.date}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{r.type}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Report Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Report Preview</h3>
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a report to preview or generate a new one</p>
        </div>
      </motion.div>
    </div>
  );
}
