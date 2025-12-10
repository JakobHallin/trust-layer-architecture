/**
 * Googlebot Verification Module
 * Verifies if a request is from a legitimate Googlebot crawler
 */

// Google's published IP ranges for Googlebot
// Source: https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot
const GOOGLE_IP_RANGES = [
  '66.249.64.0/19',
  '64.233.160.0/19',
  '72.14.192.0/18',
  '209.85.128.0/17',
  '216.239.32.0/19',
  '74.125.0.0/16',
  '216.58.192.0/19',
  '172.217.0.0/16',
  '108.177.8.0/21',
  '108.177.96.0/19',
];

const GOOGLEBOT_USER_AGENTS = [
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'Mediapartners-Google',
  'AdsBot-Google',
];

interface VerificationResult {
  isVerified: boolean;
  checks: {
    userAgent: boolean;
    ipRange: boolean;
    reverseDns: boolean;
  };
  identity: string | null;
  reason: string;
}

/**
 * Check if User-Agent claims to be Googlebot
 */
export function checkUserAgent(userAgent: string): boolean {
  return GOOGLEBOT_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

/**
 * Check if IP is within Google's published ranges
 * Uses CIDR notation matching
 */
export function checkIpRange(ip: string): boolean {
  const ipLong = ipToLong(ip);
  
  for (const range of GOOGLE_IP_RANGES) {
    const [rangeIp, prefix] = range.split('/');
    const rangeLong = ipToLong(rangeIp);
    const mask = ~((1 << (32 - parseInt(prefix))) - 1) >>> 0;
    
    if ((ipLong & mask) === (rangeLong & mask)) {
      return true;
    }
  }
  return false;
}

/**
 * Convert IP string to long integer for comparison
 */
function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Verify Googlebot via reverse DNS lookup
 * In production, this would use actual DNS resolution
 */
export async function verifyReverseDns(ip: string): Promise<{
  valid: boolean;
  hostname: string | null;
}> {
  // This is the logic - actual implementation depends on your DNS resolver
  // 1. Reverse lookup: IP -> hostname
  // 2. Forward lookup: hostname -> IP
  // 3. Verify hostname ends with .google.com or .googlebot.com
  
  // Example implementation using Node.js dns module:
  /*
  const dns = require('dns').promises;
  
  try {
    const hostnames = await dns.reverse(ip);
    const hostname = hostnames[0];
    
    if (!hostname.endsWith('.google.com') && !hostname.endsWith('.googlebot.com')) {
      return { valid: false, hostname };
    }
    
    const addresses = await dns.resolve4(hostname);
    const valid = addresses.includes(ip);
    
    return { valid, hostname };
  } catch {
    return { valid: false, hostname: null };
  }
  */
  
  // Placeholder for local testing
  const isGoogleIp = checkIpRange(ip);
  return {
    valid: isGoogleIp,
    hostname: isGoogleIp ? `crawl-${ip.replace(/\./g, '-')}.googlebot.com` : null
  };
}

/**
 * Full Googlebot verification
 */
export async function verifyGooglebot(
  userAgent: string,
  ip: string
): Promise<VerificationResult> {
  const checks = {
    userAgent: checkUserAgent(userAgent),
    ipRange: checkIpRange(ip),
    reverseDns: false,
  };
  
  // Only do DNS lookup if UA and IP checks pass
  if (checks.userAgent && checks.ipRange) {
    const dnsResult = await verifyReverseDns(ip);
    checks.reverseDns = dnsResult.valid;
  }
  
  const isVerified = checks.userAgent && checks.ipRange && checks.reverseDns;
  
  return {
    isVerified,
    checks,
    identity: isVerified ? 'googlebot' : null,
    reason: !checks.userAgent 
      ? 'User-Agent does not match Googlebot'
      : !checks.ipRange 
      ? 'IP not in Google ranges'
      : !checks.reverseDns 
      ? 'Reverse DNS verification failed'
      : 'Verified Googlebot',
  };
}
