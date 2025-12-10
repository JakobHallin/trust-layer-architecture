import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';

// ============================================
// Types
// ============================================

type TrustLane = 'trusted' | 'public' | 'blocked';

interface ClientIdentity {
  type: 'mtls' | 'bot' | 'anonymous';
  id?: string;
  verified: boolean;
  trustLevel?: 'internal' | 'partner' | 'vendor';
  permissions?: string[];
}

interface ClassificationResult {
  lane: TrustLane;
  identity: ClientIdentity;
  metadata: {
    checks: string[];
    riskScore: number;
    timestamp: number;
  };
}

interface RequestContext {
  ip: string;
  userAgent: string;
  uri: string;
  method: string;
  mtls: {
    verified: boolean;
    clientId?: string;
    fingerprint?: string;
    serial?: string;
    subject?: string;
    issuer?: string;
  };
}

// ============================================
// Logger
// ============================================

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// ============================================
// Googlebot Verification
// ============================================

const GOOGLE_IP_RANGES = [
  '66.249.64.0/19',
  '64.233.160.0/19',
  '72.14.192.0/18',
  '209.85.128.0/17',
  '216.239.32.0/19',
  '66.102.0.0/20',
];

const GOOGLEBOT_UA_PATTERNS = [
  /Googlebot/i,
  /Googlebot-Image/i,
  /Googlebot-News/i,
  /Googlebot-Video/i,
  /APIs-Google/i,
  /AdsBot-Google/i,
  /Mediapartners-Google/i,
];

function checkGooglebotUA(userAgent: string): boolean {
  return GOOGLEBOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function checkIpInRange(ip: string, cidr: string): boolean {
  const [rangeIp, bits] = cidr.split('/');
  const mask = ~((1 << (32 - parseInt(bits))) - 1);
  return (ipToNumber(ip) & mask) === (ipToNumber(rangeIp) & mask);
}

function checkGooglebotIP(ip: string): boolean {
  return GOOGLE_IP_RANGES.some(range => checkIpInRange(ip, range));
}

// ============================================
// Classification Logic
// ============================================

function classifyRequest(ctx: RequestContext): ClassificationResult {
  const checks: string[] = [];
  let riskScore = 50; // Start neutral

  // Check 1: mTLS verification
  if (ctx.mtls.verified && ctx.mtls.clientId) {
    checks.push('mtls:verified');
    
    // Determine trust level from cert subject/issuer
    let trustLevel: 'internal' | 'partner' | 'vendor' = 'vendor';
    if (ctx.mtls.issuer?.includes('internal')) {
      trustLevel = 'internal';
      riskScore = 0;
    } else if (ctx.mtls.issuer?.includes('partner')) {
      trustLevel = 'partner';
      riskScore = 10;
    } else {
      riskScore = 20;
    }

    return {
      lane: 'trusted',
      identity: {
        type: 'mtls',
        id: ctx.mtls.clientId,
        verified: true,
        trustLevel,
        permissions: extractPermissions(ctx.mtls.subject),
      },
      metadata: {
        checks,
        riskScore,
        timestamp: Date.now(),
      },
    };
  }

  // Check 2: Googlebot verification
  const isGooglebotUA = checkGooglebotUA(ctx.userAgent);
  const isGooglebotIP = checkGooglebotIP(ctx.ip);

  if (isGooglebotUA) {
    checks.push('bot:ua-match');
    if (isGooglebotIP) {
      checks.push('bot:ip-verified');
      riskScore = 15;
      
      return {
        lane: 'public',
        identity: {
          type: 'bot',
          id: 'googlebot',
          verified: true,
        },
        metadata: {
          checks,
          riskScore,
          timestamp: Date.now(),
        },
      };
    } else {
      // Fake Googlebot - block it
      checks.push('bot:ip-mismatch');
      checks.push('blocked:fake-bot');
      riskScore = 100;

      return {
        lane: 'blocked',
        identity: {
          type: 'bot',
          id: 'fake-googlebot',
          verified: false,
        },
        metadata: {
          checks,
          riskScore,
          timestamp: Date.now(),
        },
      };
    }
  }

  // Check 3: Known bad patterns
  if (isSuspiciousRequest(ctx)) {
    checks.push('blocked:suspicious');
    riskScore = 90;

    return {
      lane: 'blocked',
      identity: {
        type: 'anonymous',
        verified: false,
      },
      metadata: {
        checks,
        riskScore,
        timestamp: Date.now(),
      },
    };
  }

  // Default: Public lane for anonymous traffic
  checks.push('anonymous:public');
  riskScore = calculateRiskScore(ctx);

  return {
    lane: 'public',
    identity: {
      type: 'anonymous',
      verified: false,
    },
    metadata: {
      checks,
      riskScore,
      timestamp: Date.now(),
    },
  };
}

function extractPermissions(subject?: string): string[] {
  if (!subject) return [];
  // Extract OU (Organizational Unit) as permissions
  const ouMatch = subject.match(/OU=([^,/]+)/g);
  return ouMatch?.map(ou => ou.replace('OU=', '')) || [];
}

function isSuspiciousRequest(ctx: RequestContext): boolean {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\.\//,           // Path traversal
    /<script/i,         // XSS attempt
    /union\s+select/i,  // SQL injection
    /eval\(/i,          // Code injection
  ];

  return suspiciousPatterns.some(pattern => 
    pattern.test(ctx.uri) || pattern.test(ctx.userAgent)
  );
}

function calculateRiskScore(ctx: RequestContext): number {
  let score = 50;

  // Lower risk for known browser user agents
  if (/Mozilla|Chrome|Safari|Firefox|Edge/.test(ctx.userAgent)) {
    score -= 10;
  }

  // Higher risk for missing user agent
  if (!ctx.userAgent || ctx.userAgent.length < 10) {
    score += 20;
  }

  // Higher risk for automated tool signatures
  if (/curl|wget|python|java|go-http/i.test(ctx.userAgent)) {
    score += 15;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================
// Metrics
// ============================================

const metrics = {
  requests: { trusted: 0, public: 0, blocked: 0 },
  latency: [] as number[],
  startTime: Date.now(),
};

function recordMetric(lane: TrustLane, latencyMs: number) {
  metrics.requests[lane]++;
  metrics.latency.push(latencyMs);
  if (metrics.latency.length > 1000) {
    metrics.latency.shift();
  }
}

// ============================================
// Express App
// ============================================

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', uptime: Date.now() - metrics.startTime });
});

// Metrics endpoint
app.get('/metrics', (req: Request, res: Response) => {
  const avgLatency = metrics.latency.length > 0
    ? metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length
    : 0;

  res.json({
    uptime: Date.now() - metrics.startTime,
    requests: metrics.requests,
    avgLatencyMs: Math.round(avgLatency * 100) / 100,
  });
});

// Main classification endpoint (called by nginx auth_request)
app.post('/classify', (req: Request, res: Response) => {
  const start = Date.now();

  // Build context from nginx headers
  const ctx: RequestContext = {
    ip: req.headers['x-real-ip'] as string || req.ip || '',
    userAgent: req.headers['x-user-agent'] as string || '',
    uri: req.headers['x-original-uri'] as string || '/',
    method: req.headers['x-original-method'] as string || 'GET',
    mtls: {
      verified: req.headers['x-client-verify'] === 'SUCCESS',
      clientId: req.headers['x-client-id'] as string,
      fingerprint: req.headers['x-client-fingerprint'] as string,
      serial: req.headers['x-client-cert-serial'] as string,
      subject: req.headers['x-client-cert-subject'] as string,
      issuer: req.headers['x-client-cert-issuer'] as string,
    },
  };

  const result = classifyRequest(ctx);

  // Record metrics
  recordMetric(result.lane, Date.now() - start);

  // Log classification
  logger.info({
    event: 'classification',
    lane: result.lane,
    identity: result.identity,
    riskScore: result.metadata.riskScore,
    checks: result.metadata.checks,
  });

  // Set response headers for nginx
  res.setHeader('X-Trust-Lane', result.lane);
  res.setHeader('X-Trust-Risk', result.metadata.riskScore.toString());
  res.setHeader('X-Trust-Identity', result.identity.id || 'anonymous');
  
  // Rate limit header based on lane
  const rateLimit = result.lane === 'trusted' ? 10000 
    : result.lane === 'public' ? 100 
    : 0;
  res.setHeader('X-Rate-Limit', rateLimit.toString());

  // Return 200 for allow, 403 for block
  if (result.lane === 'blocked') {
    res.status(403).json({
      error: 'Access denied',
      reason: result.metadata.checks,
    });
  } else {
    res.status(200).json(result);
  }
});

// Validation endpoint (for detailed cert validation)
app.post('/validate', (req: Request, res: Response) => {
  const { certificate, policy } = req.body;

  // Placeholder for full certificate validation
  res.json({
    valid: true,
    message: 'Certificate validation not yet implemented',
    policy,
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Trust service listening on port ${PORT}`);
});
