import { Brain, Network, FileSearch, Activity, HelpCircle } from "lucide-react";

const MLSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ML/AI <span className="text-gradient-trusted">Detection</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sekundärt verifieringslager för att identifiera automatiserad trafik som 
            försöker framstå som människa
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Explanation */}
          <div className="space-y-6">
            <div className="p-6 bg-card border border-human/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-human/20 rounded-xl">
                  <Brain className="w-6 h-6 text-human" />
                </div>
                <h3 className="text-lg font-bold">Rollen i Public Lane</h3>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Eftersom många bottar kan imitera mänsklig interaktion räcker det inte med 
                statiska regler. ML/AI fungerar som ett riskfilter som markerar trafik som 
                avviker från normalt mänskligt beteende.
              </p>
              
              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm italic text-muted-foreground">
                  "Botar hör inte hemma i public-lanen, och ML/AI används för att 
                  upptäcka dem när traditionell verifiering inte räcker."
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h3 className="text-lg font-bold mb-4">Typiska signaler</h3>
              
              <div className="space-y-3">
                <SignalItem
                  icon={<Network className="w-4 h-4" />}
                  title="Nätverkssignaler"
                  description="TCP/IP fingerprinting, TLS-karakteristik"
                />
                <SignalItem
                  icon={<FileSearch className="w-4 h-4" />}
                  title="Header-konsistens"
                  description="User-Agent, Accept-headers, ordning"
                />
                <SignalItem
                  icon={<Activity className="w-4 h-4" />}
                  title="Beteendemönster"
                  description="Timing, navigation, interaktionssekvenser"
                />
              </div>
            </div>
          </div>
          
          {/* Right: Question */}
          <div className="flex flex-col justify-center">
            <div className="p-8 bg-gradient-to-br from-human/10 via-card to-card border border-human/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-human/20 rounded-xl">
                  <HelpCircle className="w-8 h-8 text-human" />
                </div>
                <h3 className="text-xl font-bold">Fråga till experter</h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Det område där jag själv har minst erfarenhet är ML-delen – särskilt vilka 
                signaler som faktiskt är mest användbara för att skilja mänskligt beteende 
                från automatiserat.
              </p>
              
              <div className="space-y-4">
                <QuestionItem>
                  Vilka signaler fungerar bäst i praktiken?
                </QuestionItem>
                <QuestionItem>
                  Hur hanterar man false positives utan att störa UX?
                </QuestionItem>
                <QuestionItem>
                  Vilken typ av modell lämpar sig bäst?
                </QuestionItem>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Jag skulle verkligen uppskatta input kring vad som typiskt fungerar bra 
                  i sådana modeller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SignalItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-secondary rounded-lg text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

const QuestionItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <div className="w-2 h-2 bg-human rounded-full flex-shrink-0" />
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
};

export default MLSection;
