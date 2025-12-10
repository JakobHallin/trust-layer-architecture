/**
 * Policy Engine
 * Defines and enforces access policies based on identity and trust level
 */

import { ClientIdentityClaim } from './certificate-manager';
import { TrustLane, ClientIdentity } from './request-classifier';

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  
  /** Which lanes this policy applies to */
  lanes: TrustLane[];
  
  /** Path patterns (glob) this policy covers */
  paths: string[];
  
  /** HTTP methods */
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*')[];
  
  /** Conditions that must all be true */
  conditions: PolicyCondition[];
  
  /** Action to take when policy matches */
  action: 'allow' | 'deny' | 'challenge' | 'rate-limit';
  
  /** Rate limit config if action is 'rate-limit' */
  rateLimit?: {
    requests: number;
    windowSeconds: number;
  };
  
  priority: number;
}

export type PolicyCondition = 
  | { type: 'trust-level'; levels: ('internal' | 'partner' | 'vendor')[] }
  | { type: 'permission'; permissions: string[]; mode: 'any' | 'all' }
  | { type: 'client-id'; clients: string[]; mode: 'include' | 'exclude' }
  | { type: 'time-window'; start: string; end: string; timezone: string }
  | { type: 'ip-range'; ranges: string[]; mode: 'include' | 'exclude' }
  | { type: 'header'; name: string; pattern: string }
  | { type: 'bot-verified'; required: boolean };

export interface PolicyEvaluationContext {
  lane: TrustLane;
  identity: ClientIdentity;
  mtlsClaim?: ClientIdentityClaim;
  path: string;
  method: string;
  ip: string;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface PolicyDecision {
  action: 'allow' | 'deny' | 'challenge' | 'rate-limit';
  matchedPolicy: AccessPolicy | null;
  rateLimit?: { requests: number; windowSeconds: number };
  reason: string;
}

/**
 * Policy Engine - evaluates access policies
 */
export class PolicyEngine {
  private policies: AccessPolicy[] = [];
  
  /**
   * Register policies (sorted by priority)
   */
  loadPolicies(policies: AccessPolicy[]): void {
    this.policies = [...policies].sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Evaluate request against all policies
   */
  evaluate(ctx: PolicyEvaluationContext): PolicyDecision {
    for (const policy of this.policies) {
      if (this.matchesPolicy(ctx, policy)) {
        return {
          action: policy.action,
          matchedPolicy: policy,
          rateLimit: policy.rateLimit,
          reason: `Matched policy: ${policy.name}`,
        };
      }
    }
    
    // Default deny for unmatched requests
    return {
      action: 'deny',
      matchedPolicy: null,
      reason: 'No matching policy - default deny',
    };
  }
  
  private matchesPolicy(ctx: PolicyEvaluationContext, policy: AccessPolicy): boolean {
    // Check lane
    if (!policy.lanes.includes(ctx.lane)) {
      return false;
    }
    
    // Check path
    if (!this.matchesPath(ctx.path, policy.paths)) {
      return false;
    }
    
    // Check method
    if (!policy.methods.includes('*') && !policy.methods.includes(ctx.method as any)) {
      return false;
    }
    
    // Check all conditions
    return policy.conditions.every(cond => this.evaluateCondition(ctx, cond));
  }
  
  private matchesPath(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Simple glob matching
      const regex = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regex}$`).test(path);
    });
  }
  
  private evaluateCondition(ctx: PolicyEvaluationContext, cond: PolicyCondition): boolean {
    switch (cond.type) {
      case 'trust-level':
        if (!ctx.mtlsClaim) return false;
        return cond.levels.includes(ctx.mtlsClaim.trustLevel);
      
      case 'permission':
        if (!ctx.mtlsClaim) return false;
        if (cond.mode === 'all') {
          return cond.permissions.every(p => ctx.mtlsClaim!.permissions.includes(p));
        } else {
          return cond.permissions.some(p => ctx.mtlsClaim!.permissions.includes(p));
        }
      
      case 'client-id':
        if (!ctx.mtlsClaim) return false;
        const included = cond.clients.includes(ctx.mtlsClaim.clientId);
        return cond.mode === 'include' ? included : !included;
      
      case 'time-window':
        return this.isInTimeWindow(ctx.timestamp, cond.start, cond.end, cond.timezone);
      
      case 'ip-range':
        const inRange = this.isIpInRanges(ctx.ip, cond.ranges);
        return cond.mode === 'include' ? inRange : !inRange;
      
      case 'header':
        const headerValue = ctx.headers[cond.name.toLowerCase()];
        return headerValue ? new RegExp(cond.pattern).test(headerValue) : false;
      
      case 'bot-verified':
        if (ctx.identity.type !== 'bot') return !cond.required;
        return ctx.identity.verified === cond.required;
      
      default:
        return false;
    }
  }
  
  private isInTimeWindow(date: Date, start: string, end: string, _tz: string): boolean {
    const time = date.getHours() * 100 + date.getMinutes();
    const startTime = parseInt(start.replace(':', ''));
    const endTime = parseInt(end.replace(':', ''));
    return time >= startTime && time <= endTime;
  }
  
  private isIpInRanges(ip: string, ranges: string[]): boolean {
    // Simple implementation - in production use proper CIDR matching
    return ranges.some(range => {
      if (range.includes('/')) {
        // CIDR notation
        const [rangeIp, prefix] = range.split('/');
        return this.cidrMatch(ip, rangeIp, parseInt(prefix));
      }
      return ip === range;
    });
  }
  
  private cidrMatch(ip: string, rangeIp: string, prefix: number): boolean {
    const ipParts = ip.split('.').map(Number);
    const rangeParts = rangeIp.split('.').map(Number);
    
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];
    const mask = ~((1 << (32 - prefix)) - 1);
    
    return (ipNum & mask) === (rangeNum & mask);
  }
}

/**
 * Example policies for common use cases
 */
export const EXAMPLE_POLICIES: AccessPolicy[] = [
  {
    id: 'internal-full-access',
    name: 'Internal Full Access',
    description: 'Internal services have full access to all APIs',
    lanes: ['trusted'],
    paths: ['/api/*'],
    methods: ['*'],
    conditions: [
      { type: 'trust-level', levels: ['internal'] }
    ],
    action: 'allow',
    priority: 100,
  },
  {
    id: 'partner-read-access',
    name: 'Partner Read Access',
    description: 'Partners can read public data',
    lanes: ['trusted'],
    paths: ['/api/public/*', '/api/data/*'],
    methods: ['GET'],
    conditions: [
      { type: 'trust-level', levels: ['partner', 'internal'] }
    ],
    action: 'allow',
    priority: 90,
  },
  {
    id: 'verified-bot-crawl',
    name: 'Verified Bot Crawling',
    description: 'Allow verified bots to crawl public pages',
    lanes: ['public'],
    paths: ['/*'],
    methods: ['GET'],
    conditions: [
      { type: 'bot-verified', required: true }
    ],
    action: 'rate-limit',
    rateLimit: { requests: 100, windowSeconds: 60 },
    priority: 80,
  },
  {
    id: 'unverified-bot-block',
    name: 'Block Unverified Bots',
    description: 'Block bots that claim identity but cannot verify',
    lanes: ['public'],
    paths: ['/*'],
    methods: ['*'],
    conditions: [
      { type: 'bot-verified', required: false }
    ],
    action: 'deny',
    priority: 70,
  },
  {
    id: 'public-rate-limit',
    name: 'Public Rate Limit',
    description: 'Rate limit anonymous public traffic',
    lanes: ['public'],
    paths: ['/*'],
    methods: ['*'],
    conditions: [],
    action: 'rate-limit',
    rateLimit: { requests: 60, windowSeconds: 60 },
    priority: 10,
  },
];
