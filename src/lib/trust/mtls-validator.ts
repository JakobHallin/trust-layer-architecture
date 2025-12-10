/**
 * mTLS Validation Pipeline
 * Complete certificate chain validation with policy enforcement
 */

import { 
  CertificateInfo, 
  ClientIdentityClaim, 
  CARegistry,
  extractIdentityClaims,
  parseCertificatePEM 
} from './certificate-manager';

export interface ValidationResult {
  valid: boolean;
  identity: ClientIdentityClaim | null;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationPolicy {
  /** Required trust level for this endpoint */
  requiredTrustLevel?: 'internal' | 'partner' | 'vendor';
  /** Required permissions */
  requiredPermissions?: string[];
  /** Max cert age in days */
  maxCertAgeDays?: number;
  /** Require specific issuer */
  allowedIssuers?: string[];
  /** Block specific client IDs */
  blockedClients?: string[];
}

/**
 * Full mTLS validation pipeline
 */
export class MTLSValidator {
  constructor(private caRegistry: CARegistry) {}
  
  /**
   * Validate client certificate and extract identity
   */
  async validate(
    clientCertPEM: string,
    issuerCertPEM: string,
    policy: ValidationPolicy = {}
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // 1. Parse certificates
    const clientCert = parseCertificatePEM(clientCertPEM);
    const issuerCert = parseCertificatePEM(issuerCertPEM);
    
    if (!clientCert) {
      errors.push({ code: 'INVALID_CERT', message: 'Failed to parse client certificate' });
      return { valid: false, identity: null, errors, warnings };
    }
    
    if (!issuerCert) {
      errors.push({ code: 'INVALID_ISSUER', message: 'Failed to parse issuer certificate' });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // 2. Verify issuer is trusted CA
    const ca = this.caRegistry.getCA(issuerCert.fingerprint);
    if (!ca) {
      errors.push({ 
        code: 'UNTRUSTED_CA', 
        message: `Issuer ${issuerCert.subject.commonName} is not a trusted CA`,
        field: 'issuer'
      });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // 3. Check revocation
    if (this.caRegistry.isRevoked(issuerCert.fingerprint, clientCert.serialNumber)) {
      errors.push({ 
        code: 'REVOKED', 
        message: 'Certificate has been revoked',
        field: 'serialNumber'
      });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // 4. Validate time window
    const now = new Date();
    if (now < clientCert.validFrom) {
      errors.push({ 
        code: 'NOT_YET_VALID', 
        message: `Certificate not valid until ${clientCert.validFrom.toISOString()}`,
        field: 'validFrom'
      });
    }
    
    if (now > clientCert.validTo) {
      errors.push({ 
        code: 'EXPIRED', 
        message: `Certificate expired on ${clientCert.validTo.toISOString()}`,
        field: 'validTo'
      });
    }
    
    // 5. Check cert age policy
    if (policy.maxCertAgeDays) {
      const certAgeDays = (now.getTime() - clientCert.validFrom.getTime()) / (1000 * 60 * 60 * 24);
      if (certAgeDays > policy.maxCertAgeDays) {
        warnings.push(`Certificate is ${Math.floor(certAgeDays)} days old (max: ${policy.maxCertAgeDays})`);
      }
    }
    
    // 6. Extract identity claims
    const identity = extractIdentityClaims(clientCert);
    
    // 7. Validate trust level
    if (policy.requiredTrustLevel) {
      const levels = ['vendor', 'partner', 'internal'];
      const requiredIndex = levels.indexOf(policy.requiredTrustLevel);
      const actualIndex = levels.indexOf(identity.trustLevel);
      
      if (actualIndex < requiredIndex) {
        errors.push({
          code: 'INSUFFICIENT_TRUST',
          message: `Required trust level: ${policy.requiredTrustLevel}, actual: ${identity.trustLevel}`,
          field: 'trustLevel'
        });
      }
    }
    
    // 8. Validate permissions
    if (policy.requiredPermissions) {
      const missing = policy.requiredPermissions.filter(p => !identity.permissions.includes(p));
      if (missing.length > 0) {
        errors.push({
          code: 'MISSING_PERMISSIONS',
          message: `Missing permissions: ${missing.join(', ')}`,
          field: 'permissions'
        });
      }
    }
    
    // 9. Check blocked clients
    if (policy.blockedClients?.includes(identity.clientId)) {
      errors.push({
        code: 'BLOCKED_CLIENT',
        message: `Client ${identity.clientId} is blocked`,
        field: 'clientId'
      });
    }
    
    // 10. Validate issuer is allowed for this endpoint
    if (policy.allowedIssuers && !policy.allowedIssuers.includes(ca.name)) {
      errors.push({
        code: 'ISSUER_NOT_ALLOWED',
        message: `Issuer ${ca.name} not allowed for this endpoint`,
        field: 'issuer'
      });
    }
    
    return {
      valid: errors.length === 0,
      identity: errors.length === 0 ? identity : null,
      errors,
      warnings,
    };
  }
  
  /**
   * Quick validation from Nginx headers
   * When Nginx already did the SSL handshake
   */
  validateFromHeaders(headers: Record<string, string>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Nginx verification result
    const verifyResult = headers['x-client-verify'];
    if (verifyResult !== 'SUCCESS') {
      errors.push({
        code: 'NGINX_VERIFY_FAILED',
        message: `Nginx verification: ${verifyResult || 'NONE'}`,
      });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // Extract identity from headers
    const clientId = headers['x-client-id'];
    const fingerprint = headers['x-client-fingerprint'];
    const issuer = headers['x-client-issuer'];
    const serial = headers['x-client-serial'];
    
    if (!clientId) {
      errors.push({ code: 'NO_CLIENT_ID', message: 'Client ID not in certificate' });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // Check revocation
    if (issuer && serial && this.caRegistry.isRevoked(issuer, serial)) {
      errors.push({ code: 'REVOKED', message: 'Certificate revoked' });
      return { valid: false, identity: null, errors, warnings };
    }
    
    // Build identity from headers
    const identity: ClientIdentityClaim = {
      clientId,
      permissions: (headers['x-client-permissions'] || 'read').split(','),
      trustLevel: parseTrustLevelHeader(headers['x-client-trust-level']),
      metadata: {
        fingerprint: fingerprint || '',
        issuer: issuer || '',
        serialNumber: serial || '',
      },
    };
    
    return { valid: true, identity, errors, warnings };
  }
}

function parseTrustLevelHeader(level?: string): 'internal' | 'partner' | 'vendor' {
  switch (level?.toLowerCase()) {
    case 'internal': return 'internal';
    case 'partner': return 'partner';
    default: return 'vendor';
  }
}
