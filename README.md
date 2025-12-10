# Three-Lane Trust Architecture

Ett Docker-baserat projekt som demonstrerar en trust-first arkitektur för trafikklassificering med mTLS, bot-verifiering och ML-baserad analys.

## Projektstruktur

All kod finns i `/docker`-mappen:

```
docker/
├── docker-compose.yml      # Orkestrering av alla services
├── nginx/                  # Reverse proxy med mTLS
├── trust-service/          # Node.js klassificeringstjänst
├── frontend/               # React-app (Aligned Intelligence)
├── certs/                  # TLS-certifikat
└── apps/                   # Statiska HTML-sidor per lane
```

## Snabbstart

```bash
cd docker

# Generera certifikat
./certs/generate-certs.sh

# Starta alla services
docker-compose up -d

# Öppna frontend
open http://localhost:5173
```

## Dokumentation

Se [docker/README.md](docker/README.md) för:
- Detaljerad arkitekturbeskrivning
- Lane-definitioner (Trusted, Public, Blocked)
- Testinstruktioner med curl
- Frontend-utveckling
- Environment variables

## Arkitektur

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    Nginx    │────▶│   Backend   │
│  (Browser/  │     │   (mTLS +   │     │  Services   │
│    Bot)     │     │   Routing)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Trust     │
                    │   Service   │
                    └─────────────┘
```

### Tre lanes:
- **Trusted (cyan)**: mTLS-verifierade klienter
- **Public (amber)**: Människor + verifierade bots (Googlebot)
- **Blocked**: Ej verifierad automation

## Teknologier

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Infrastructure**: Docker, Nginx, mTLS
