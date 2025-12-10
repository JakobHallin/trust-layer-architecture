import { Key, ShieldCheck, Lock, Fingerprint, Server, Globe } from "lucide-react";

const AuthMethodsSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Autentiserings<span className="text-gradient-trusted">metoder</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            mTLS som robust baslinje för maskinidentitet och provenans
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <AuthCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="mTLS"
            description="Tvåvägs verifiering med kryptografiskt stark identitet"
            highlight
            benefits={["Egna CA:er", "Svårförfalskade", "Transport-lager"]}
          />
          
          <AuthCard
            icon={<Key className="w-6 h-6" />}
            title="API-nycklar"
            description="Enkel autentisering för applikations-till-applikation"
            benefits={["Lätt att implementera", "Roterbar", "Rate limiting"]}
          />
          
          <AuthCard
            icon={<Lock className="w-6 h-6" />}
            title="JWT / OAuth2"
            description="Token-baserad auktorisering med scopes"
            benefits={["Client credentials", "Kort livstid", "Claims"]}
          />
          
          <AuthCard
            icon={<Fingerprint className="w-6 h-6" />}
            title="HMAC-signering"
            description="Kryptografisk verifiering av request-integritet"
            benefits={["Timestamp", "Nonce", "Payload-hash"]}
          />
          
          <AuthCard
            icon={<Server className="w-6 h-6" />}
            title="IP Attestering"
            description="Vitlistning baserat på förväntade IP-ranges"
            benefits={["Snabb lookup", "CDN-friendly", "Fallback"]}
          />
          
          <AuthCard
            icon={<Globe className="w-6 h-6" />}
            title="Device Attestation"
            description="Verifiering av klientens integritet och miljö"
            benefits={["TPM/HSM", "App attestation", "Platform trust"]}
          />
        </div>
        
        {/* mTLS Highlight */}
        <div className="max-w-4xl mx-auto">
          <div className="p-8 bg-gradient-to-r from-trusted/10 via-card to-card border border-trusted/30 rounded-2xl glow-trusted">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0">
                <div className="p-6 bg-trusted/20 rounded-2xl">
                  <ShieldCheck className="w-16 h-16 text-trusted" />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-3">
                  Varför <span className="text-trusted">mTLS</span> som baslinje?
                </h3>
                <p className="text-muted-foreground mb-4">
                  I denna problemform – där frågan handlar om maskinidentitet, provenans och vad som 
                  ska betraktas som godartad automatisering – är mTLS den mest robusta baslinjen.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-trusted rounded-full" />
                    <span>Tvåvägs verifiering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-trusted rounded-full" />
                    <span>Kryptografisk identitet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-trusted rounded-full" />
                    <span>Vendor-specifika CA:er</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-trusted rounded-full" />
                    <span>Policy på transportlagret</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AuthCard = ({
  icon,
  title,
  description,
  benefits,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  highlight?: boolean;
}) => {
  return (
    <div className={`p-6 bg-card border rounded-xl transition-all duration-300 hover:border-muted-foreground/30 ${
      highlight ? "border-trusted/40" : "border-border"
    }`}>
      <div className={`inline-flex p-3 rounded-lg mb-4 ${
        highlight ? "bg-trusted/20 text-trusted" : "bg-secondary text-muted-foreground"
      }`}>
        {icon}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div className="flex flex-wrap gap-2">
        {benefits.map((benefit, i) => (
          <span 
            key={i} 
            className="text-xs px-2 py-1 bg-secondary rounded-md text-muted-foreground"
          >
            {benefit}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AuthMethodsSection;
