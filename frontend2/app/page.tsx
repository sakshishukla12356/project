import { VortexBackground } from "@/components/landing/vortex-background"
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { AnalyticsSection } from "@/components/landing/analytics-section"
import { SecuritySection } from "@/components/landing/security-section"
import { ChatbotSection } from "@/components/landing/chatbot-section"
import { CarbonSection } from "@/components/landing/carbon-section"
import { DashboardShowcase } from "@/components/landing/dashboard-showcase"
import { OptimizationSection } from "@/components/landing/optimization-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { FAQSection } from "@/components/landing/faq-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <VortexBackground />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <AnalyticsSection />
        <SecuritySection />
        <ChatbotSection />
        <CarbonSection />
        <DashboardShowcase />
        <OptimizationSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <Footer />
      </div>
    </main>
  )
}
