import FeaturesSection from "@/components/landing/FeatureSelection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorks";


export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
    </div>
  );
}