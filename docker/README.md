# Trust Architecture - Docker Setup

Three-lane trust architecture with mTLS, Googlebot verification, and policy-based routing.

## Quick Start

```bash
# 1. Generate certificates
cd certs
chmod +x generate-certs.sh
./generate-certs.sh
cd ..

# 2. Start services
docker compose up --build

# 3. Verify that everything is running
docker ps
```
## Certificate Setup (So You Don’t Need --cacert with curl)

To trust the local CA certificate system-wide, install it into your OS certificate store:

sudo cp ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates


After this, curl and other system tools will trust the certificate automatically—no need to pass --cacert.


## Testing

### Anonymous Request (Public Lane)
```bash
curl https://localhost/
# Returns: Public lane HTML
```

### mTLS Request (Trusted Lane)
```bash
curl --cert certs/clients/internal-service.crt \
  --key certs/clients/internal-service.key \
  https://localhost/
# Returns: Trusted lane HTML
```

### Fake Googlebot (Blocked)
```bash
curl -A "Googlebot/2.1" https://localhost/
# Returns: 403 Forbidden (IP doesn't match Google ranges)
```

### Check Metrics
```bash
curl http://localhost:3000/metrics
```

### Frontend Documentation (Port 5173)
```bash
# Open in browser
open http://localhost:5173

# Or with curl
curl http://localhost:5173
# Returns: React app with trust architecture documentation
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    Nginx    │────▶│   Backend   │
│  (+ cert?)  │     │  (mTLS term)│     │    Apps     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    auth_request
                           │
                    ┌──────▼──────┐
                    │   Trust     │
                    │   Service   │
                    │ (classify)  │
                    └─────────────┘
```

## Lanes

| Lane | Color | Access | Rate Limit |
|------|-------|--------|------------|
| Trusted | Cyan | mTLS verified clients | 10,000/min |
| Public | Amber | Anonymous + verified bots | 100/min |
| Blocked | Red | Fake bots, suspicious | 0 |

## Files

```
docker/
├── docker-compose.yml      # Service definitions
├── nginx/
│   └── nginx.conf          # mTLS + routing config
├── trust-service/
│   ├── src/server.ts       # Classification logic
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/               # Fristående React-app (Aligned Intelligence)
│   ├── Dockerfile          # Multi-stage build
│   ├── nginx.conf          # SPA routing config
│   ├── package.json        # Dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── vite.config.ts      # Vite bundler config
│   ├── tailwind.config.ts  # Tailwind CSS config
│   ├── postcss.config.js   # PostCSS config
│   ├── index.html          # HTML entry point
│   └── src/
│       ├── main.tsx        # React entry point
│       ├── App.tsx         # Main app component
│       ├── index.css       # Global styles + design tokens
│       ├── pages/          # Page components
│       │   ├── Index.tsx
│       │   └── NotFound.tsx
│       ├── components/     # UI components
│       │   ├── HeroSection.tsx
│       │   ├── ArchitectureDiagram.tsx
│       │   ├── TrustModelSection.tsx
│       │   ├── AuthMethodsSection.tsx
│       │   ├── GooglebotVerification.tsx
│       │   ├── ImplementationSection.tsx
│       │   ├── MLSection.tsx
│       │   ├── CloudflareComparison.tsx
│       │   ├── SummarySection.tsx
│       │   ├── Footer.tsx
│       │   └── ui/         # Shadcn UI components
│       ├── hooks/          # React hooks
│       └── lib/            # Utilities
├── certs/
│   ├── generate-certs.sh   # Cert generator
│   ├── ca.crt/key          # Root CA
│   ├── server.crt/key      # Server cert
│   └── clients/            # Client certs
└── apps/
    ├── public/index.html   # Public lane UI
    └── mtls/index.html     # Trusted lane UI
```

