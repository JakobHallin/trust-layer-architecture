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
docker-compose up --build

# 3. Test endpoints
```

## Testing

### Anonymous Request (Public Lane)
```bash
curl -k https://localhost/
# Returns: Public lane HTML
```

### mTLS Request (Trusted Lane)
```bash
curl -k --cacert certs/ca.crt \
  --cert certs/clients/internal-service.crt \
  --key certs/clients/internal-service.key \
  https://localhost/
# Returns: Trusted lane HTML
```

### Fake Googlebot (Blocked)
```bash
curl -k -A "Googlebot/2.1" https://localhost/
# Returns: 403 Forbidden (IP doesn't match Google ranges)
```

### Check Metrics
```bash
curl http://localhost:3000/metrics
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
├── certs/
│   ├── generate-certs.sh   # Cert generator
│   ├── ca.crt/key          # Root CA
│   ├── server.crt/key      # Server cert
│   └── clients/            # Client certs
└── apps/
    ├── public/index.html   # Public lane UI
    └── mtls/index.html     # Trusted lane UI
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Environment |
| `PORT` | 3000 | Trust service port |
| `LOG_LEVEL` | info | pino log level |
