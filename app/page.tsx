import { EarlyAccessProvider } from "@/components/early-access";
import { AuthProvider } from "@/components/auth";
import { Footer, Navbar } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { PainSection, HowItWorks, LearningLoop } from "@/components/story-sections";
import { RoleBuilder, Independence, VacationReadiness } from "@/components/product-sections";
import { Audience, Comparison, Pricing, FAQ, FinalCTA } from "@/components/closing-sections";

export default function Home() {
  return (
    <AuthProvider>
      <EarlyAccessProvider>
        <Navbar />
        <main>
          <Hero />
          <PainSection />
          <HowItWorks />
          <LearningLoop />
          <RoleBuilder />
          <Independence />
          <VacationReadiness />
          <Audience />
          <Comparison />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </EarlyAccessProvider>
    </AuthProvider>
  );
}
