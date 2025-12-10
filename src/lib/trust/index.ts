/**
 * Trust System - Main Entry Point
 * 
 * This module provides the core trust verification and classification
 * logic for the three-lane trust architecture.
 */

export { 
  verifyGooglebot, 
  checkUserAgent, 
  checkIpRange 
} from './googlebot-verifier';

export { 
  classifyRequest,
  type TrustLane,
  type ClientIdentity,
  type ClassificationResult,
  type RequestContext,
} from './request-classifier';

export { 
  createTrustMiddleware,
  type TrustMiddlewareConfig,
} from './middleware';
