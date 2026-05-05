import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { TrustSection } from "@/components/landing/TrustSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <ParticlesBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <InteractiveDemo />
      <TrustSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
