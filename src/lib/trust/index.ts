/**
 * Trust System - Main Entry Point
 * 
 * This module provides the core trust verification and classification
 * logic for the three-lane trust architecture.
 * 
 * Architecture:
 * 1. Request Classification - Assigns lane based on mTLS/bot/anonymous
 * 2. Certificate Validation - Full mTLS chain validation with revocation
 * 3. Policy Engine - Flexible rule-based access control
 * 4. Pipeline - Combines all stages into a single processing flow
 */

// Googlebot verification
export { 
  verifyGooglebot, 
  checkUserAgent, 
  checkIpRange 
} from './googlebot-verifier';

// Request classification
export { 
  classifyRequest,
  type TrustLane,
  type ClientIdentity,
  type ClassificationResult,
  type RequestContext,
} from './request-classifier';

// Certificate management
export {
  parseCertificatePEM,
  extractIdentityClaims,
  CARegistry,
  type CertificateInfo,
  type ClientIdentityClaim,
  type TrustedCA,
} from './certificate-manager';

// mTLS validation
export {
  MTLSValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationPolicy,
} from './mtls-validator';

// Policy engine
export {
  PolicyEngine,
  EXAMPLE_POLICIES,
  type AccessPolicy,
  type PolicyCondition,
  type PolicyDecision,
  type PolicyEvaluationContext,
} from './policy-engine';

// Complete pipeline
export {
  TrustPipeline,
  createTrustPipeline,
  type PipelineResult,
  type PipelineStage,
  type PipelineConfig,
} from './pipeline';

export { 
  createTrustMiddleware,
  type TrustMiddlewareConfig,
} from './middleware';
