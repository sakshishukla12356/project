"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { VortexBackground } from "@/components/landing/vortex-background"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      <VortexBackground />
      <DashboardSidebar />
      <main className="relative z-10 ml-64 min-h-screen p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
