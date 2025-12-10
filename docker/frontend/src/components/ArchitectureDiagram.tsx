import { ArrowRight, Shield, Lock, User, Bot, Globe, Server, AlertTriangle } from "lucide-react";

const ArchitectureDiagram = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Arkitektur<span className="text-gradient-trusted">översikt</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reverse proxy som central trust-punkt med dual-lane routing baserat på mTLS-certifikat
          </p>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          {/* Flow diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8 items-center">
            {/* Incoming Traffic */}
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="text-sm font-mono text-muted-foreground mb-2">Inkommande trafik</div>
              <div className="space-y-3 w-full">
                <TrafficItem icon={<User className="w-4 h-4" />} label="Människor" color="human" />
                <TrafficItem icon={<Bot className="w-4 h-4" />} label="AI-agenter" color="trusted" />
                <TrafficItem icon={<Globe className="w-4 h-4" />} label="Scrapers" color="public" />
                <TrafficItem icon={<AlertTriangle className="w-4 h-4" />} label="Skadliga bots" color="danger" />
              </div>
            </div>
            
            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-muted-foreground/50" />
            </div>
            
            {/* Reverse Proxy */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-sm font-mono text-muted-foreground mb-2">Decision Point</div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-trusted/20 to-public/20 blur-xl" />
                <div className="relative px-8 py-6 bg-card border border-border rounded-2xl">
                  <Server className="w-10 h-10 text-foreground mx-auto mb-3" />
                  <p className="font-semibold text-center">Reverse Proxy</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">mTLS Termination</p>
                  
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-trusted rounded-full" />
                      <span>Certifikat?</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-public rounded-full" />
                      <span>Rate limiting</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
                      <span>Metadata enrichment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="flex flex-col gap-4">
                <ArrowRight className="w-8 h-8 text-trusted" />
                <ArrowRight className="w-8 h-8 text-public" />
              </div>
            </div>
            
            {/* Lanes */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {/* Trusted Lane */}
              <div className="p-4 bg-card border border-trusted/40 rounded-xl glow-trusted">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-trusted" />
                  <span className="font-semibold text-trusted">Trusted Lane</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ mTLS-verifierade agenter</p>
                  <p>✓ Vendor-attesterade system</p>
                  <p>✓ Stealth-agenter via CA</p>
                </div>
              </div>
              
              {/* Public Lane */}
              <div className="p-4 bg-card border border-public/40 rounded-xl glow-public">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-public" />
                  <span className="font-semibold text-public">Public Lane</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Mänsklig trafik</p>
                  <p>✓ Verifierad Googlebot</p>
                  <p>✗ Oidentifierad automation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrafficItem = ({ 
  icon, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: "human" | "trusted" | "public" | "danger";
}) => {
  const colorClasses = {
    human: "border-human/40 text-human",
    trusted: "border-trusted/40 text-trusted",
    public: "border-public/40 text-public",
    danger: "border-danger/40 text-danger",
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-card border ${colorClasses[color]} rounded-lg`}>
      {icon}
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
};

export default ArchitectureDiagram;
