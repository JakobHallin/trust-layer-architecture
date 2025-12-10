import { Cloud, CheckCircle, ArrowRight } from "lucide-react";

const CloudflareComparison = () => {
  return (
    <section className="py-24 bg-secondary/20 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Jämförelse med <span className="text-gradient-public">branschstandard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cloudflares modell verkar bekräfta mycket av det jag själv intuitivt landade i
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Cloudflare */}
            <div className="p-8 bg-card border border-public/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-public/20 rounded-xl">
                  <Cloud className="w-8 h-8 text-public" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Cloudflare</h3>
                  <p className="text-sm text-muted-foreground">Etablerad branschaktör</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <ComparisonItem text="mTLS / Client Certificates" />
                <ComparisonItem text="Device attestation" />
                <ComparisonItem text="Lagerbaserad bot-hantering" />
                <ComparisonItem text="Adaptive trust" />
                <ComparisonItem text="Klassificering baserad på identitet" />
              </div>
            </div>
            
            {/* My Model */}
            <div className="p-8 bg-card border border-trusted/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-trusted/20 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-trusted" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Min modell</h3>
                  <p className="text-sm text-muted-foreground">Baseline-arkitektur</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <ComparisonItem text="mTLS som baseline" color="trusted" />
                <ComparisonItem text="Dual-lane routing" color="trusted" />
                <ComparisonItem text="Identitet → trust → beteende" color="trusted" />
                <ComparisonItem text="Reverse proxy som central punkt" color="trusted" />
                <ComparisonItem text="ML/AI som sekundärt lager" color="trusted" />
              </div>
            </div>
          </div>
          
          {/* Principle mapping */}
          <div className="mt-12 p-8 bg-card border border-border rounded-2xl">
            <h3 className="text-lg font-bold mb-6 text-center">Principmappning</h3>
            
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <PrincipleCard step={1} title="Identitet" description="trust-nivå" />
              <PrincipleCard step={2} title="Arkitektur" description="kontroll" />
              <PrincipleCard step={3} title="Beteende" description="verifiering" />
              <PrincipleCard step={4} title="ML" description="finjustering" />
            </div>
            
            <div className="mt-8 p-4 bg-secondary/50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                Det fick mig att fundera på om min baseline ligger på ungefär samma nivå 
                som branschens etablerade aktörer använder – inte som färdig lösning, men som startpunkt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ComparisonItem = ({ 
  text, 
  color = "public" 
}: { 
  text: string; 
  color?: "public" | "trusted";
}) => {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className={`w-4 h-4 ${color === "trusted" ? "text-trusted" : "text-public"}`} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};

const PrincipleCard = ({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) => {
  return (
    <div className="relative">
      <div className="p-4">
        <div className="text-xs font-mono text-muted-foreground mb-2">{step}</div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">→ {description}</p>
      </div>
      {step < 4 && (
        <ArrowRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 text-muted-foreground/30" />
      )}
    </div>
  );
};

export default CloudflareComparison;
