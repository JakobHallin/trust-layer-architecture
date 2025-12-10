import { CheckCircle, MessageCircle } from "lucide-react";

const SummarySection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Samman<span className="text-gradient-trusted">fattning</span>
            </h2>
            <p className="text-muted-foreground">
              Baseline-modellen i korthet
            </p>
          </div>
          
          <div className="p-8 bg-card border border-border rounded-2xl mb-12">
            <div className="space-y-4">
              <SummaryItem number={1}>
                <strong>Första beslut:</strong> mTLS eller public
              </SummaryItem>
              
              <SummaryItem number={2}>
                <strong>I public:</strong> endast människor + verifierad Googlebot
              </SummaryItem>
              
              <SummaryItem number={3}>
                <strong>All annan automation:</strong> mTLS eller vendor-attestering
              </SummaryItem>
              
              <SummaryItem number={4}>
                <strong>Reverse proxy:</strong> central trust-punkt
              </SummaryItem>
              
              <SummaryItem number={5}>
                <strong>Arkitektur och identitet:</strong> grund; beteendeanalys som sekundärt lager
              </SummaryItem>
            </div>
          </div>
          
          {/* Question box */}
          <div className="p-8 bg-gradient-to-br from-trusted/10 via-card to-public/10 border border-border rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary rounded-xl">
                <MessageCircle className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold">Fråga till er</h3>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6">
              Hur rimlig tycker ni att denna baseline-modell är?
            </p>
            
            <p className="text-muted-foreground mb-8">
              Skulle ni ha möjlighet att ge lite input på dessa tankar, eller peka mig i 
              rätt riktning om det finns något jag missar? Jag uppskattar verkligen all 
              feedback ni vill dela.
            </p>
            
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">Med vänliga hälsningar,</p>
              <p className="font-semibold">Jakob Hallin</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SummaryItem = ({ 
  number, 
  children 
}: { 
  number: number; 
  children: React.ReactNode;
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-trusted/20 flex items-center justify-center">
        <span className="text-sm font-mono text-trusted">{number}</span>
      </div>
      <p className="text-muted-foreground pt-1">{children}</p>
    </div>
  );
};

export default SummarySection;
