import { NextRequest, NextResponse } from 'next/server';

// Security middleware for additional protection
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  // Rate limiting headers (basic implementation)
  const rateLimitKey = request.ip || 'unknown';
  
  // Security headers that can't be set in next.config.js
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Remove server information
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Block common attack patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /vbscript:/i,  // VBScript protocol
    /onload=/i,  // Event handlers
    /onerror=/i,
  ];

  const fullUrl = pathname + searchParams.toString();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      console.warn(`Blocked suspicious request: ${fullUrl} from IP: ${request.ip}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Block requests with suspicious user agents
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
  ];

  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      console.warn(`Blocked suspicious user agent: ${userAgent} from IP: ${request.ip}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Add security monitoring headers
  response.headers.set('X-Security-Status', 'Protected');
  response.headers.set('X-Request-ID', crypto.randomUUID());

  return response;
}

// Health check endpoint
export function healthCheck(request: NextRequest) {
  if (request.nextUrl.pathname === '/health') {
    return new NextResponse(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
  return null;
}

// Security monitoring for API routes
export function apiSecurityMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/api/')) {
    // Log API access for monitoring
    console.log(`API Access: ${request.method} ${pathname} from ${request.ip} at ${new Date().toISOString()}`);
    
    // Add API-specific security headers
    const response = NextResponse.next();
    response.headers.set('X-API-Version', '1.0');
    response.headers.set('X-API-Security', 'enabled');
    
    return response;
  }
  
  return NextResponse.next();
}
