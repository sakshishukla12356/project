import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ParticleField } from "@/components/background/ParticleField";
import { FloatingOrbs } from "@/components/background/FloatingOrbs";
import { AIChatbot } from "@/components/ui/AIChatbot";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="relative min-h-screen">
        <ParticleField />
        <FloatingOrbs />
        <div className="grain-overlay" />
        <div className="relative z-10">
          <Outlet />
        </div>
        <AIChatbot />
        <Toaster position="top-right" richColors closeButton />
      </div>
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
});
