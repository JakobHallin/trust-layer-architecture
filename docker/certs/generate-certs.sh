#!/bin/bash
# Generate test certificates for mTLS trust architecture
# Run this script once to create all necessary certificates

set -e

CERT_DIR="$(dirname "$0")"
cd "$CERT_DIR"

echo "=== Generating Trust Architecture Certificates ==="

# ============================================
# 1. Root CA (Certificate Authority)
# ============================================
echo "[1/5] Creating Root CA..."

openssl genrsa -out ca.key 4096

openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=TrustArch/OU=CA/CN=TrustArch Root CA"

# ============================================
# 2. Server Certificate (for Nginx)
# ============================================
echo "[2/5] Creating Server Certificate..."

openssl genrsa -out server.key 2048

openssl req -new -key server.key -out server.csr \
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=TrustArch/OU=Server/CN=localhost"

cat > server.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -extfile server.ext

rm server.csr server.ext

# ============================================
# 3. Internal Client Certificate (highest trust)
# ============================================
echo "[3/5] Creating Internal Client Certificate..."

mkdir -p clients

openssl genrsa -out clients/internal-service.key 2048

openssl req -new -key clients/internal-service.key -out clients/internal-service.csr \
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=TrustArch/OU=internal/OU=read/OU=write/OU=admin/CN=internal-service-01"

openssl x509 -req -in clients/internal-service.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out clients/internal-service.crt -days 365

rm clients/internal-service.csr

# ============================================
# 4. Partner Client Certificate (medium trust)
# ============================================
echo "[4/5] Creating Partner Client Certificate..."

openssl genrsa -out clients/partner-api.key 2048

openssl req -new -key clients/partner-api.key -out clients/partner-api.csr \
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=PartnerCorp/OU=partner/OU=read/OU=webhook/CN=partner-api-client"

openssl x509 -req -in clients/partner-api.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out clients/partner-api.crt -days 365

rm clients/partner-api.csr

# ============================================
# 5. Vendor Client Certificate (lower trust)
# ============================================
echo "[5/5] Creating Vendor Client Certificate..."

openssl genrsa -out clients/vendor-bot.key 2048

openssl req -new -key clients/vendor-bot.key -out clients/vendor-bot.csr \
  -subj "/C=SE/ST=Stockholm/L=Stockholm/O=VendorInc/OU=vendor/OU=read/CN=vendor-scraper-01"

openssl x509 -req -in clients/vendor-bot.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out clients/vendor-bot.crt -days 365

rm clients/vendor-bot.csr

# ============================================
# Summary
# ============================================
echo ""
echo "=== Certificate Generation Complete ==="
echo ""
echo "Root CA:"
echo "  - ca.crt (public)"
echo "  - ca.key (keep secure!)"
echo ""
echo "Server (Nginx):"
echo "  - server.crt"
echo "  - server.key"
echo ""
echo "Client Certificates:"
echo "  - clients/internal-service.crt (trust: internal, perms: read,write,admin)"
echo "  - clients/partner-api.crt (trust: partner, perms: read,webhook)"
echo "  - clients/vendor-bot.crt (trust: vendor, perms: read)"
echo ""
echo "To test with curl:"
echo "  curl --cacert ca.crt --cert clients/internal-service.crt --key clients/internal-service.key https://localhost/"
echo ""
