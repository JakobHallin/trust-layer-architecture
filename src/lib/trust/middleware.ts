/**
 * Trust Middleware
 * Express/Node.js compatible middleware for request classification
 */

import { classifyRequest, ClassificationResult, RequestContext } from './request-classifier';

export interface TrustMiddlewareConfig {
  /** Header name where Nginx puts the client cert status */
  mtlsVerifiedHeader?: string;
  /** Header name where Nginx puts the client ID from cert */
  mtlsClientIdHeader?: string;
  /** Header name where Nginx puts the cert fingerprint */
  mtlsFingerprintHeader?: string;
  /** Block requests that fail classification */
  blockOnFail?: boolean;
  /** Custom handler for blocked requests */
  onBlocked?: (req: any, res: any, result: ClassificationResult) => void;
  /** Custom handler after classification */
  onClassified?: (req: any, result: ClassificationResult) => void;
}

const DEFAULT_CONFIG: TrustMiddlewareConfig = {
  mtlsVerifiedHeader: 'x-client-verify',
  mtlsClientIdHeader: 'x-client-id',
  mtlsFingerprintHeader: 'x-client-fingerprint',
  blockOnFail: true,
};

/**
 * Create trust classification middleware
 * 
 * Usage with Express:
 * ```
 * import { createTrustMiddleware } from './lib/trust';
 * 
 * app.use(createTrustMiddleware({
 *   onBlocked: (req, res, result) => {
 *     res.status(403).json({ error: 'Access denied', reason: result.metadata.checks });
 *   },
 *   onClassified: (req, result) => {
 *     console.log(`Request classified: ${result.lane}`, result.identity);
 *   }
 * }));
 * ```
 */
export function createTrustMiddleware(config: TrustMiddlewareConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return async function trustMiddleware(req: any, res: any, next: any) {
    // Extract request context
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key.toLowerCase()] = value;
      }
    }
    
    const ctx: RequestContext = {
      ip: req.ip || req.connection?.remoteAddress || headers['x-forwarded-for']?.split(',')[0] || '',
      userAgent: headers['user-agent'] || '',
      headers,
      mtls: {
        verified: headers[cfg.mtlsVerifiedHeader!] === 'SUCCESS',
        clientId: headers[cfg.mtlsClientIdHeader!],
        certFingerprint: headers[cfg.mtlsFingerprintHeader!],
      },
    };
    
    // Classify the request
    const result = await classifyRequest(ctx);
    
    // Attach classification to request for downstream use
    req.trust = result;
    
    // Call custom handler
    cfg.onClassified?.(req, result);
    
    // Handle blocked requests
    if (result.lane === 'blocked' && cfg.blockOnFail) {
      if (cfg.onBlocked) {
        cfg.onBlocked(req, res, result);
      } else {
        res.status(403).json({
          error: 'Access denied',
          checks: result.metadata.checks,
        });
      }
      return;
    }
    
    // Set response headers for debugging/logging
    res.setHeader('X-Trust-Lane', result.lane);
    res.setHeader('X-Trust-Risk', result.metadata.riskScore.toString());
    
    next();
  };
}

/**
 * Nginx configuration helper
 * Returns the nginx config snippet for mTLS header passing
 */
export const NGINX_MTLS_CONFIG = `
# Add these to your nginx location block to pass mTLS info to upstream
proxy_set_header X-Client-Verify $ssl_client_verify;
proxy_set_header X-Client-ID $ssl_client_s_dn_cn;
proxy_set_header X-Client-Fingerprint $ssl_client_fingerprint;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
`;
