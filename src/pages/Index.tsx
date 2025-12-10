import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/HeroSection";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import TrustModelSection from "@/components/TrustModelSection";
import AuthMethodsSection from "@/components/AuthMethodsSection";
import GooglebotVerification from "@/components/GooglebotVerification";
import MLSection from "@/components/MLSection";
import CloudflareComparison from "@/components/CloudflareComparison";
import SummarySection from "@/components/SummarySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Aligned Intelligence | Trust-First Bot Detection Architecture</title>
        <meta 
          name="description" 
          content="En arkitekturmodell för att separera legitim automation från skadlig trafik genom identitet, trust och verifiering. mTLS som baseline med ML/AI som sekundärt lager." 
        />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <HeroSection />
        <ArchitectureDiagram />
        <TrustModelSection />
        <AuthMethodsSection />
        <GooglebotVerification />
        <MLSection />
        <CloudflareComparison />
        <SummarySection />
        <Footer />
      </main>
    </>
  );
};

export default Index;
