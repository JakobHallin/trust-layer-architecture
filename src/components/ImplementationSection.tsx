import { Terminal, FileCode, Server, Container } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ImplementationSection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-trusted/10 border border-trusted/30 rounded-full mb-6">
            <Terminal className="w-4 h-4 text-trusted" />
            <span className="text-sm font-mono text-trusted">Implementation</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Docker + <span className="text-gradient-trusted">Nginx mTLS</span> Setup
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fungerande implementation av trust-modellen med reverse proxy som central beslutspunkt.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="nginx" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 mb-6">
              <TabsTrigger value="nginx" className="flex items-center gap-2 data-[state=active]:bg-trusted/20 data-[state=active]:text-trusted">
                <Server className="w-4 h-4" />
                nginx.conf
              </TabsTrigger>
              <TabsTrigger value="docker" className="flex items-center gap-2 data-[state=active]:bg-trusted/20 data-[state=active]:text-trusted">
                <Container className="w-4 h-4" />
                docker-compose.yml
              </TabsTrigger>
              <TabsTrigger value="dockerfile" className="flex items-center gap-2 data-[state=active]:bg-trusted/20 data-[state=active]:text-trusted">
                <FileCode className="w-4 h-4" />
                Dockerfile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="nginx">
              <CodeBlock
                title="nginx.conf"
                description="Reverse proxy med mTLS-verifiering och lane-routing"
                code={nginxConfig}
                highlights={[
                  { line: "ssl_verify_client optional;", color: "trusted", note: "Tillåter både mTLS och public" },
                  { line: 'if ($ssl_client_verify != "SUCCESS")', color: "public", note: "Blockerar utan giltigt cert" },
                ]}
              />
            </TabsContent>
            
            <TabsContent value="docker">
              <CodeBlock
                title="docker-compose.yml"
                description="Arkitektur med separata lanes för public och mTLS-trafik"
                code={dockerCompose}
                highlights={[
                  { line: "public-app:", color: "public", note: "Public lane endpoint" },
                  { line: "mtls-app:", color: "trusted", note: "Trusted lane endpoint" },
                ]}
              />
            </TabsContent>
            
            <TabsContent value="dockerfile">
              <CodeBlock
                title="Dockerfile"
                description="Nginx med certifikat för mTLS"
                code={dockerfile}
                highlights={[
                  { line: "COPY certs /etc/nginx/certs", color: "trusted", note: "CA + server-certifikat" },
                ]}
              />
            </TabsContent>
          </Tabs>
          
          {/* Architecture visualization */}
          <div className="mt-12 p-8 bg-card border border-border rounded-2xl">
            <h3 className="text-lg font-bold mb-6 text-center">Trafikflöde</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <FlowStep label="Klient" sublabel="med/utan cert" />
              <Arrow />
              <FlowStep label="Reverse Proxy" sublabel=":8443" highlight />
              <Arrow />
              <div className="flex flex-col gap-4">
                <FlowStep label="/public/" sublabel="public-app:80" color="public" />
                <FlowStep label="/secure/" sublabel="mtls-app:80" color="trusted" />
              </div>
            </div>
            
            <div className="mt-8 grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-public/10 border border-public/30 rounded-lg">
                <p className="font-mono text-public mb-2">curl https://server.local:8443/public/</p>
                <p className="text-muted-foreground">→ "public ok"</p>
              </div>
              <div className="p-4 bg-trusted/10 border border-trusted/30 rounded-lg">
                <p className="font-mono text-trusted mb-2">curl --cert client.crt --key client.key https://server.local:8443/secure/</p>
                <p className="text-muted-foreground">→ "mtls ok"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CodeBlock = ({
  title,
  description,
  code,
  highlights,
}: {
  title: string;
  description: string;
  code: string;
  highlights: { line: string; color: "trusted" | "public"; note: string }[];
}) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-mono font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <pre className="text-sm font-mono text-muted-foreground leading-relaxed">
          {code.split('\n').map((line, i) => {
            const highlight = highlights.find(h => line.includes(h.line));
            return (
              <div key={i} className={`${highlight ? `bg-${highlight.color}/10 -mx-6 px-6` : ''}`}>
                <span className="text-muted-foreground/50 select-none mr-4">{String(i + 1).padStart(2, '0')}</span>
                <span className={highlight ? `text-${highlight.color}` : ''}>{line}</span>
                {highlight && (
                  <span className={`ml-4 text-xs text-${highlight.color}/70`}>← {highlight.note}</span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

const FlowStep = ({
  label,
  sublabel,
  highlight,
  color,
}: {
  label: string;
  sublabel: string;
  highlight?: boolean;
  color?: "trusted" | "public";
}) => {
  const colorClasses = color 
    ? color === "trusted" 
      ? "border-trusted/50 bg-trusted/10 text-trusted"
      : "border-public/50 bg-public/10 text-public"
    : highlight 
      ? "border-foreground/50 bg-foreground/10"
      : "border-border bg-card";
      
  return (
    <div className={`px-6 py-4 rounded-xl border ${colorClasses} text-center`}>
      <p className="font-mono font-bold">{label}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
};

const Arrow = () => (
  <div className="text-muted-foreground hidden md:block">→</div>
);

const nginxConfig = `worker_processes auto;

events {}

http {
    upstream public_app {
        server public-app:80;
    }

    upstream secure_app {
        server mtls-app:80;
    }

    server {
        listen 443 ssl;
        server_name server.local;

        ssl_certificate     /etc/nginx/certs/webserver.crt;
        ssl_certificate_key /etc/nginx/certs/webserver.key;

        ssl_client_certificate /etc/nginx/certs/ca.crt;
        ssl_verify_client optional;

        location = / {
            return 200 "reverse proxy root\\n";
        }

        location /public/ {
            proxy_pass http://public_app/;
        }

        location /secure/ {
            if ($ssl_client_verify != "SUCCESS") {
                return 403;
            }
            proxy_pass http://secure_app/;
        }
    }
}`;

const dockerCompose = `services:
  reverse-proxy:
    build: ./nginx
    container_name: reverse-proxy
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "8443:443"
    depends_on:
      - public-app
      - mtls-app

  public-app:
    build: ./public-app
    container_name: public-app

  mtls-app:
    image: nginx:alpine
    container_name: mtls-app
    command: [ "sh", "-c", "echo 'mtls ok' > /usr/share/nginx/html/index.html && nginx -g 'daemon off;'" ]`;

const dockerfile = `FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY certs /etc/nginx/certs`;

export default ImplementationSection;
