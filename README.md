# Three-Lane Trust Architecture

Ett Docker-baserat projekt som demonstrerar en trust-first arkitektur för trafikklassificering med mTLS, bot-verifiering och ML-baserad analys.

Detta dokument är själva idén bakom projektet.  
Jag skrev det dagarna efter eventet för att samla mina tankar, formulera problemet och beskriva  
den första versionen av trust-modellen.  

All arkitektur, mTLS-design, lane-routing och trust-service i projektet växte fram ur detta dokument.

➡️ **[Läs idédokumentet här](./idea-startpoint.md)**

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
### Configure Firefox to Trust the Local HTTPS Certificate
1. Gå till: about:preferences#privacy
2. Scrolla till "Certificates"
3. Klicka View Certificates
4. Gå till fliken Authorities
5. Klicka Import
6. Välj din ca.crt
7. Markera: ✔ Trust this CA to identify websites
### Configurer so u dont need to add --cacert when curl
```bash
sudo cp ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
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
