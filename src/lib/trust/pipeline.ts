/**
 * Trust Pipeline - Complete request processing
 * Combines all components into a single processing pipeline
 */

import { classifyRequest, RequestContext, ClassificationResult } from './request-classifier';
import { MTLSValidator, ValidationResult } from './mtls-validator';
import { PolicyEngine, PolicyDecision, PolicyEvaluationContext } from './policy-engine';
import { CARegistry, ClientIdentityClaim } from './certificate-manager';

export interface PipelineResult {
  /** Final decision */
  allowed: boolean;
  
  /** Trust lane assigned */
  lane: 'trusted' | 'public' | 'blocked';
  
  /** Resolved identity */
  identity: {
    type: 'mtls' | 'bot' | 'anonymous';
    id: string | null;
    verified: boolean;
    trustLevel: string;
    permissions: string[];
  };
  
  /** Rate limit to apply */
  rateLimit: { requests: number; windowSeconds: number } | null;
  
  /** All processing stages with timing */
  stages: PipelineStage[];
  
  /** Headers to add to upstream request */
  upstreamHeaders: Record<string, string>;
  
  /** Response headers for client */
  responseHeaders: Record<string, string>;
}

export interface PipelineStage {
  name: string;
  duration: number;
  result: 'pass' | 'fail' | 'skip';
  details: Record<string, any>;
}

export interface PipelineConfig {
  caRegistry: CARegistry;
  policyEngine: PolicyEngine;
  mtlsValidator: MTLSValidator;
  
  /** Enable detailed logging */
  debug?: boolean;
  
  /** Custom upstream header prefix */
  headerPrefix?: string;
}

/**
 * Main trust processing pipeline
 */
export class TrustPipeline {
  private config: PipelineConfig;
  
  constructor(config: PipelineConfig) {
    this.config = {
      headerPrefix: 'X-Trust',
      ...config,
    };
  }
  
  /**
   * Process a request through the full trust pipeline
   */
  async process(ctx: RequestContext): Promise<PipelineResult> {
    const stages: PipelineStage[] = [];
    const start = Date.now();
    
    // Stage 1: Request Classification
    const classifyStart = Date.now();
    const classification = await classifyRequest(ctx);
    stages.push({
      name: 'classification',
      duration: Date.now() - classifyStart,
      result: classification.lane === 'blocked' ? 'fail' : 'pass',
      details: {
        lane: classification.lane,
        identity: classification.identity,
        riskScore: classification.metadata.riskScore,
      },
    });
    
    // Early exit if blocked by classification
    if (classification.lane === 'blocked') {
      return this.buildResult(false, classification, null, null, stages);
    }
    
    // Stage 2: mTLS Validation (if present)
    let mtlsResult: ValidationResult | null = null;
    let mtlsClaim: ClientIdentityClaim | null = null;
    
    if (ctx.mtls?.verified) {
      const mtlsStart = Date.now();
      mtlsResult = this.config.mtlsValidator.validateFromHeaders(ctx.headers);
      
      stages.push({
        name: 'mtls-validation',
        duration: Date.now() - mtlsStart,
        result: mtlsResult.valid ? 'pass' : 'fail',
        details: {
          valid: mtlsResult.valid,
          errors: mtlsResult.errors,
          warnings: mtlsResult.warnings,
        },
      });
      
      if (mtlsResult.valid && mtlsResult.identity) {
        mtlsClaim = mtlsResult.identity;
      }
    } else {
      stages.push({
        name: 'mtls-validation',
        duration: 0,
        result: 'skip',
        details: { reason: 'No mTLS certificate presented' },
      });
    }
    
    // Stage 3: Policy Evaluation
    const policyStart = Date.now();
    const policyCtx: PolicyEvaluationContext = {
      lane: classification.lane,
      identity: classification.identity,
      mtlsClaim: mtlsClaim || undefined,
      path: ctx.headers['x-original-uri'] || '/',
      method: ctx.headers['x-original-method'] || 'GET',
      ip: ctx.ip,
      headers: ctx.headers,
      timestamp: new Date(),
    };
    
    const policyDecision = this.config.policyEngine.evaluate(policyCtx);
    
    stages.push({
      name: 'policy-evaluation',
      duration: Date.now() - policyStart,
      result: policyDecision.action === 'allow' || policyDecision.action === 'rate-limit' ? 'pass' : 'fail',
      details: {
        action: policyDecision.action,
        matchedPolicy: policyDecision.matchedPolicy?.name,
        reason: policyDecision.reason,
      },
    });
    
    // Build final result
    const allowed = policyDecision.action === 'allow' || policyDecision.action === 'rate-limit';
    
    return this.buildResult(allowed, classification, mtlsClaim, policyDecision, stages);
  }
  
  private buildResult(
    allowed: boolean,
    classification: ClassificationResult,
    mtlsClaim: ClientIdentityClaim | null,
    policyDecision: PolicyDecision | null,
    stages: PipelineStage[]
  ): PipelineResult {
    const prefix = this.config.headerPrefix;
    
    // Determine identity info
    let identity: PipelineResult['identity'];
    
    if (mtlsClaim) {
      identity = {
        type: 'mtls',
        id: mtlsClaim.clientId,
        verified: true,
        trustLevel: mtlsClaim.trustLevel,
        permissions: mtlsClaim.permissions,
      };
    } else if (classification.identity.type === 'bot') {
      identity = {
        type: 'bot',
        id: classification.identity.botName,
        verified: classification.identity.verified,
        trustLevel: classification.identity.verified ? 'vendor' : 'none',
        permissions: ['read'],
      };
    } else {
      identity = {
        type: 'anonymous',
        id: null,
        verified: false,
        trustLevel: 'none',
        permissions: [],
      };
    }
    
    // Build upstream headers for the backend to consume
    const upstreamHeaders: Record<string, string> = {
      [`${prefix}-Lane`]: classification.lane,
      [`${prefix}-Identity-Type`]: identity.type,
      [`${prefix}-Risk-Score`]: classification.metadata.riskScore.toString(),
      [`${prefix}-Verified`]: identity.verified.toString(),
    };
    
    if (identity.id) {
      upstreamHeaders[`${prefix}-Identity-Id`] = identity.id;
    }
    
    if (identity.trustLevel !== 'none') {
      upstreamHeaders[`${prefix}-Trust-Level`] = identity.trustLevel;
    }
    
    if (identity.permissions.length > 0) {
      upstreamHeaders[`${prefix}-Permissions`] = identity.permissions.join(',');
    }
    
    // Response headers for observability
    const responseHeaders: Record<string, string> = {
      [`${prefix}-Lane`]: classification.lane,
      [`${prefix}-Processed`]: 'true',
    };
    
    if (this.config.debug) {
      responseHeaders[`${prefix}-Stages`] = stages.map(s => `${s.name}:${s.result}`).join(',');
      responseHeaders[`${prefix}-Duration`] = stages.reduce((sum, s) => sum + s.duration, 0).toString();
    }
    
    return {
      allowed,
      lane: classification.lane,
      identity,
      rateLimit: policyDecision?.rateLimit || null,
      stages,
      upstreamHeaders,
      responseHeaders,
    };
  }
}

/**
 * Create a configured pipeline with defaults
 */
export function createTrustPipeline(options?: Partial<PipelineConfig>): TrustPipeline {
  const caRegistry = options?.caRegistry || new CARegistry();
  const policyEngine = options?.policyEngine || new PolicyEngine();
  const mtlsValidator = options?.mtlsValidator || new MTLSValidator(caRegistry);
  
  return new TrustPipeline({
    caRegistry,
    policyEngine,
    mtlsValidator,
    ...options,
  });
}
