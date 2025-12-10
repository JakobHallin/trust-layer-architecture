import { Shield, Lock, Eye } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-trusted/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-public/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-full mb-8 animate-fade-in">
          <div className="w-2 h-2 bg-trusted rounded-full animate-pulse" />
          <span className="text-sm font-mono text-muted-foreground">Trust-First Architecture</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <span className="text-foreground">Aligned</span>{" "}
          <span className="text-gradient-trusted">Intelligence</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          En arkitekturmodell för att separera legitim automation från skadlig trafik 
          genom <span className="text-foreground font-medium">identitet</span>, <span className="text-foreground font-medium">trust</span> och <span className="text-foreground font-medium">verifiering</span>.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 px-6 py-4 bg-card border border-trusted/30 rounded-xl glow-trusted">
            <Shield className="w-6 h-6 text-trusted" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Trusted Lane</p>
              <p className="text-xs text-muted-foreground">mTLS-verifierad automation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-4 bg-card border border-public/30 rounded-xl glow-public">
            <Lock className="w-6 h-6 text-public" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Public Lane</p>
              <p className="text-xs text-muted-foreground">Människor + verifierade bottar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-4 bg-card border border-human/30 rounded-xl">
            <Eye className="w-6 h-6 text-human" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">ML/AI Detection</p>
              <p className="text-xs text-muted-foreground">Beteendeanalys som backup</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
