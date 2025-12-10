/**
 * Request Classification Module
 * Classifies incoming requests into trust lanes
 */

import { verifyGooglebot } from './googlebot-verifier';

export type TrustLane = 'trusted' | 'public' | 'blocked';

export type ClientIdentity = 
  | { type: 'mtls'; clientId: string; certFingerprint: string }
  | { type: 'bot'; botName: string; verified: boolean }
  | { type: 'anonymous' };

export interface ClassificationResult {
  lane: TrustLane;
  identity: ClientIdentity;
  metadata: {
    timestamp: number;
    checks: string[];
    riskScore: number;
  };
}

export interface RequestContext {
  ip: string;
  userAgent: string;
  headers: Record<string, string>;
  // mTLS info from reverse proxy
  mtls?: {
    verified: boolean;
    clientId?: string;
    certFingerprint?: string;
  };
}

/**
 * Known bot patterns to check
 */
const BOT_PATTERNS = [
  { pattern: /googlebot/i, name: 'googlebot', verifiable: true },
  { pattern: /bingbot/i, name: 'bingbot', verifiable: true },
  { pattern: /slurp/i, name: 'yahoo', verifiable: true },
  { pattern: /duckduckbot/i, name: 'duckduckbot', verifiable: true },
  { pattern: /baiduspider/i, name: 'baidu', verifiable: true },
  { pattern: /yandexbot/i, name: 'yandex', verifiable: true },
  { pattern: /facebot|facebookexternalhit/i, name: 'facebook', verifiable: true },
  { pattern: /twitterbot/i, name: 'twitter', verifiable: false },
  { pattern: /linkedinbot/i, name: 'linkedin', verifiable: false },
];

/**
 * Detect if request claims to be a bot
 */
function detectBotClaim(userAgent: string): { name: string; verifiable: boolean } | null {
  for (const { pattern, name, verifiable } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { name, verifiable };
    }
  }
  return null;
}

/**
 * Calculate risk score based on request characteristics
 */
function calculateRiskScore(ctx: RequestContext): number {
  let score = 0;
  
  // Missing or suspicious headers
  if (!ctx.headers['accept-language']) score += 10;
  if (!ctx.headers['accept-encoding']) score += 10;
  if (!ctx.headers['accept']) score += 5;
  
  // Suspicious User-Agent patterns
  if (!ctx.userAgent || ctx.userAgent.length < 10) score += 20;
  if (/curl|wget|python|java|php/i.test(ctx.userAgent)) score += 15;
  
  // Known automation tools
  if (/headless|phantom|selenium|puppeteer/i.test(ctx.userAgent)) score += 30;
  
  // Header consistency checks
  const connection = ctx.headers['connection'];
  const hasKeepAlive = connection?.toLowerCase().includes('keep-alive');
  if (!hasKeepAlive) score += 5;
  
  return Math.min(100, score);
}

/**
 * Main classification function
 */
export async function classifyRequest(ctx: RequestContext): Promise<ClassificationResult> {
  const checks: string[] = [];
  const timestamp = Date.now();
  
  // 1. Check mTLS first (highest trust)
  if (ctx.mtls?.verified && ctx.mtls.clientId) {
    checks.push('mtls_verified');
    return {
      lane: 'trusted',
      identity: {
        type: 'mtls',
        clientId: ctx.mtls.clientId,
        certFingerprint: ctx.mtls.certFingerprint || '',
      },
      metadata: { timestamp, checks, riskScore: 0 },
    };
  }
  
  // 2. Check for bot claims
  const botClaim = detectBotClaim(ctx.userAgent);
  
  if (botClaim) {
    checks.push(`bot_claim:${botClaim.name}`);
    
    // 3. Verify known bots
    if (botClaim.name === 'googlebot') {
      const verification = await verifyGooglebot(ctx.userAgent, ctx.ip);
      checks.push(...Object.entries(verification.checks)
        .map(([k, v]) => `${k}:${v ? 'pass' : 'fail'}`));
      
      if (verification.isVerified) {
        return {
          lane: 'public', // Verified bots go to public lane
          identity: { type: 'bot', botName: 'googlebot', verified: true },
          metadata: { timestamp, checks, riskScore: 0 },
        };
      } else {
        // Claimed Googlebot but failed verification - block
        checks.push('verification_failed');
        return {
          lane: 'blocked',
          identity: { type: 'bot', botName: 'googlebot', verified: false },
          metadata: { timestamp, checks, riskScore: 100 },
        };
      }
    }
    
    // For other verifiable bots, implement similar verification
    // For now, unverified bot claims go to public with high risk
    if (botClaim.verifiable) {
      return {
        lane: 'public',
        identity: { type: 'bot', botName: botClaim.name, verified: false },
        metadata: { timestamp, checks, riskScore: 50 },
      };
    }
  }
  
  // 4. Anonymous/human traffic - calculate risk score
  const riskScore = calculateRiskScore(ctx);
  checks.push(`risk_score:${riskScore}`);
  
  // High risk anonymous traffic gets blocked
  if (riskScore >= 70) {
    return {
      lane: 'blocked',
      identity: { type: 'anonymous' },
      metadata: { timestamp, checks, riskScore },
    };
  }
  
  // Normal anonymous traffic goes to public lane
  return {
    lane: 'public',
    identity: { type: 'anonymous' },
    metadata: { timestamp, checks, riskScore },
  };
}
