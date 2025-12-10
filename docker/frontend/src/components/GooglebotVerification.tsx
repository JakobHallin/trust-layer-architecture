import { Search, Globe, Server, CheckCircle } from "lucide-react";

const GooglebotVerification = () => {
  return (
    <section className="py-24 bg-secondary/20 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Googlebot <span className="text-gradient-public">Verifiering</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Det enda undantaget för icke-mTLS automation i public lane
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="p-8 bg-card border border-public/30 rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-public/20 rounded-xl">
                <Search className="w-10 h-10 text-public" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Verifikationskrav</h3>
                <p className="text-muted-foreground text-sm">
                  Alla tre måste uppfyllas för att räknas som legitim
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <VerificationStep
                step={1}
                icon={<Globe className="w-6 h-6" />}
                title="User-Agent"
                description="Korrekt och förväntad User-Agent sträng"
                code="Googlebot/2.1"
              />
              
              <VerificationStep
                step={2}
                icon={<Server className="w-6 h-6" />}
                title="IP Range"
                description="Klientens IP ligger i officiella ranges"
                code="66.249.x.x"
              />
              
              <VerificationStep
                step={3}
                icon={<CheckCircle className="w-6 h-6" />}
                title="DNS Match"
                description="Korrekt forward + reverse DNS-matchning"
                code="*.googlebot.com"
              />
            </div>
            
            <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                <span className="text-foreground font-medium">Viktigt:</span> All annan automatiserad 
                trafik som inte kan verifieras öppet betraktas som icke-tillåten i public-vägen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const VerificationStep = ({
  step,
  icon,
  title,
  description,
  code,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  code: string;
}) => {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-public/20 text-public mb-4">
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <code className="text-xs px-3 py-1.5 bg-secondary rounded-md font-mono text-public">
        {code}
      </code>
    </div>
  );
};

export default GooglebotVerification;
