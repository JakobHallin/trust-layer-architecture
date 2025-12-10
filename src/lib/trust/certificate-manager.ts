/**
 * Certificate Authority Management
 * Handles CA operations for mTLS client certificates
 */

export interface CertificateInfo {
  subject: {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
  };
  issuer: {
    commonName: string;
    organization?: string;
  };
  serialNumber: string;
  fingerprint: string;
  validFrom: Date;
  validTo: Date;
  extensions?: {
    subjectAltNames?: string[];
    keyUsage?: string[];
    extendedKeyUsage?: string[];
  };
}

export interface ClientIdentityClaim {
  clientId: string;
  permissions: string[];
  trustLevel: 'internal' | 'partner' | 'vendor';
  metadata: Record<string, string>;
}

/**
 * Parse X.509 certificate from PEM format
 * In production, use node-forge or similar library
 */
export function parseCertificatePEM(pem: string): CertificateInfo | null {
  // This is the structure - actual parsing needs crypto library
  // Example with node-forge:
  /*
  const forge = require('node-forge');
  const cert = forge.pki.certificateFromPem(pem);
  
  return {
    subject: {
      commonName: cert.subject.getField('CN')?.value,
      organization: cert.subject.getField('O')?.value,
      organizationalUnit: cert.subject.getField('OU')?.value,
    },
    issuer: {
      commonName: cert.issuer.getField('CN')?.value,
      organization: cert.issuer.getField('O')?.value,
    },
    serialNumber: cert.serialNumber,
    fingerprint: forge.md.sha256.create()
      .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
      .digest().toHex(),
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
    extensions: {
      subjectAltNames: cert.getExtension('subjectAltName')?.altNames?.map(n => n.value),
      keyUsage: cert.getExtension('keyUsage'),
      extendedKeyUsage: cert.getExtension('extendedKeyUsage')?.value,
    }
  };
  */
  
  // Placeholder structure
  const match = pem.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
  if (!match) return null;
  
  return {
    subject: { commonName: 'parsed-from-cert' },
    issuer: { commonName: 'ca' },
    serialNumber: '00',
    fingerprint: 'sha256-fingerprint',
    validFrom: new Date(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Extract client identity claims from certificate
 * Uses Subject CN and custom OID extensions
 */
export function extractIdentityClaims(cert: CertificateInfo): ClientIdentityClaim {
  // Parse CN format: clientId.trustLevel.domain
  // Example: "api-client-123.partner.example.com"
  const cnParts = cert.subject.commonName.split('.');
  
  const clientId = cnParts[0] || cert.subject.commonName;
  const trustLevel = parseTrustLevel(cnParts[1]);
  
  // Extract permissions from OU or custom extension
  const permissions = parsePermissions(cert.subject.organizationalUnit);
  
  return {
    clientId,
    permissions,
    trustLevel,
    metadata: {
      issuer: cert.issuer.commonName,
      serialNumber: cert.serialNumber,
      fingerprint: cert.fingerprint,
      validUntil: cert.validTo.toISOString(),
    },
  };
}

function parseTrustLevel(level?: string): 'internal' | 'partner' | 'vendor' {
  switch (level?.toLowerCase()) {
    case 'internal': return 'internal';
    case 'partner': return 'partner';
    case 'vendor': return 'vendor';
    default: return 'vendor'; // Lowest trust by default
  }
}

function parsePermissions(ou?: string): string[] {
  if (!ou) return ['read'];
  
  // OU format: "perm:read,write,admin"
  const match = ou.match(/perm:([a-z,]+)/i);
  if (match) {
    return match[1].split(',').map(p => p.trim().toLowerCase());
  }
  
  return ['read'];
}

/**
 * Trusted CA fingerprints registry
 * In production, load from secure config or database
 */
export interface TrustedCA {
  fingerprint: string;
  name: string;
  trustLevel: 'internal' | 'partner' | 'vendor';
  allowedPermissions: string[];
  revokedSerials: Set<string>;
}

export class CARegistry {
  private cas: Map<string, TrustedCA> = new Map();
  
  registerCA(ca: TrustedCA): void {
    this.cas.set(ca.fingerprint, ca);
  }
  
  getCA(fingerprint: string): TrustedCA | undefined {
    return this.cas.get(fingerprint);
  }
  
  isRevoked(caFingerprint: string, serialNumber: string): boolean {
    const ca = this.cas.get(caFingerprint);
    return ca?.revokedSerials.has(serialNumber) ?? true;
  }
  
  /**
   * Validate that CA can issue certs with given trust level
   */
  validateTrustLevel(caFingerprint: string, requestedLevel: string): boolean {
    const ca = this.cas.get(caFingerprint);
    if (!ca) return false;
    
    const levels = ['vendor', 'partner', 'internal'];
    const caLevelIndex = levels.indexOf(ca.trustLevel);
    const requestedIndex = levels.indexOf(requestedLevel);
    
    // CA can only issue certs at or below its own trust level
    return requestedIndex <= caLevelIndex;
  }
}
