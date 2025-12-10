import { Shield, Lock, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const TrustModelSection = () => {
  return (
    <section className="py-24 bg-secondary/20 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trust<span className="text-gradient-public">modell</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bots är risk tills de bevisar legitimitet. Identitet och arkitektur som grund, 
            beteendeanalys som sekundärt lager.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Step 1 */}
          <TrustCard
            step={1}
            title="Första beslutet"
            subtitle="mTLS eller Public"
            icon={<Shield className="w-8 h-8" />}
            color="trusted"
            items={[
              { status: "check", text: "Giltigt mTLS-certifikat → Trusted Lane" },
              { status: "x", text: "Saknar certifikat → Public Lane" },
            ]}
          />
          
          {/* Step 2 */}
          <TrustCard
            step={2}
            title="Public Lane Policy"
            subtitle="Endast verifierad trafik"
            icon={<Lock className="w-8 h-8" />}
            color="public"
            items={[
              { status: "check", text: "Mänsklig trafik → OK" },
              { status: "check", text: "Googlebot (verifierad) → OK" },
              { status: "x", text: "Icke-mänsklig trafik → Blockeras" },
            ]}
          />
          
          {/* Step 3 */}
          <TrustCard
            step={3}
            title="ML/AI Detection"
            subtitle="Sekundärt lager"
            icon={<Eye className="w-8 h-8" />}
            color="human"
            items={[
              { status: "alert", text: "Nätverkssignaler & headers" },
              { status: "alert", text: "Beteendemönster" },
              { status: "alert", text: "Anomali-detektion" },
            ]}
          />
        </div>
        
        {/* Summary principle */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="p-8 bg-card border border-border rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-center">Grundprincip</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Människor</p>
                <p className="font-mono text-lg text-foreground">→ public</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Verifierad Googlebot</p>
                <p className="font-mono text-lg text-foreground">→ public</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-2">All annan automation</p>
                <p className="font-mono text-lg text-trusted">→ mTLS / attestering</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-6 text-sm">
              <span className="text-foreground font-medium">Good automation bör kunna identifiera sig.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrustCard = ({
  step,
  title,
  subtitle,
  icon,
  color,
  items,
}: {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "trusted" | "public" | "human";
  items: { status: "check" | "x" | "alert"; text: string }[];
}) => {
  const colorClasses = {
    trusted: "border-trusted/30 text-trusted",
    public: "border-public/30 text-public",
    human: "border-human/30 text-human",
  };
  
  const bgClasses = {
    trusted: "bg-trusted/10",
    public: "bg-public/10",
    human: "bg-human/10",
  };
  
  return (
    <div className={`p-6 bg-card border ${colorClasses[color]} rounded-2xl animate-fade-in`} 
         style={{ animationDelay: `${step * 0.1}s` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
          <span className={colorClasses[color]}>{icon}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">Steg {step}</span>
      </div>
      
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {item.status === "check" && <CheckCircle className="w-4 h-4 text-trusted flex-shrink-0 mt-0.5" />}
            {item.status === "x" && <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />}
            {item.status === "alert" && <AlertCircle className="w-4 h-4 text-public flex-shrink-0 mt-0.5" />}
            <span className="text-muted-foreground">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustModelSection;
