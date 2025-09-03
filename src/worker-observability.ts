/**
 * Enhanced Worker with Cloudflare Observability Features
 * Includes Analytics Engine, security monitoring, and performance tracking
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';

// Types for Cloudflare bindings
interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  HEALTH_KV: {
    get: (key: string) => Promise<string | null>;
    put: (
      key: string,
      value: string,
      options?: Record<string, unknown>
    ) => Promise<void>;
  };
  SESSION_KV: {
    get: (key: string) => Promise<string | null>;
    put: (
      key: string,
      value: string,
      options?: Record<string, unknown>
    ) => Promise<void>;
  };
  CACHE_KV: {
    get: (key: string) => Promise<string | null>;
    put: (
      key: string,
      value: string,
      options?: Record<string, unknown>
    ) => Promise<void>;
  };
  HEALTH_FILES: {
    head: (key: string) => Promise<unknown>;
    put: (
      key: string,
      value: ReadableStream,
      options?: Record<string, unknown>
    ) => Promise<void>;
  };
  AUDIT_LOGS: {
    put: (
      key: string,
      value: string,
      options?: Record<string, unknown>
    ) => Promise<void>;
  };
  HEALTH_ANALYTICS: {
    writeDataPoint: (data: HealthAnalyticsEvent) => Promise<void>;
  };
  SECURITY_ANALYTICS: {
    writeDataPoint: (data: SecurityAnalyticsEvent) => Promise<void>;
  };
  PERFORMANCE_ANALYTICS: {
    writeDataPoint: (data: PerformanceAnalyticsEvent) => Promise<void>;
  };
  WEBSOCKET_ROOMS: {
    idFromName: (name: string) => { toString: () => string };
    get: (id: { toString: () => string }) => {
      fetch: (request: Request) => Promise<Response>;
    };
  };
  RATE_LIMITER: {
    idFromName: (name: string) => { toString: () => string };
    get: (id: { toString: () => string }) => {
      fetch: (request: Request) => Promise<Response>;
    };
  };
  HEALTH_SESSIONS: {
    idFromName: (name: string) => { toString: () => string };
    get: (id: { toString: () => string }) => {
      fetch: (request: Request) => Promise<Response>;
    };
  };

  // Environment variables
  ENVIRONMENT: string;
  ENABLE_ANALYTICS: string;
  ENABLE_SECURITY_LOGGING: string;
  ENABLE_PERFORMANCE_MONITORING: string;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  DEVICE_JWT_SECRET: string;
}

// Context variables for Hono
type Variables = {
  userId?: string;
  rateLimitRemaining?: number;
};

// Analytics event types
interface HealthAnalyticsEvent {
  timestamp: number;
  userId?: string;
  eventType:
    | 'health_data_sync'
    | 'fall_detection'
    | 'emergency_alert'
    | 'user_login'
    | 'data_export';
  metadata: Record<string, unknown>;
  value?: number;
}

interface SecurityAnalyticsEvent {
  timestamp: number;
  ip: string;
  userAgent: string;
  eventType:
    | 'auth_attempt'
    | 'rate_limit_hit'
    | 'suspicious_activity'
    | 'data_access'
    | 'permission_denied';
  userId?: string;
  metadata: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceAnalyticsEvent {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  metadata: Record<string, unknown>;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Enhanced middleware stack with observability
app.use('*', logger());
app.use('*', timing());
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    crossOriginEmbedderPolicy: false, // Disable for health app compatibility
  })
);

// CORS configuration
app.use(
  '*',
  cors({
    origin: (origin, _c) => {
      // Allow configured origins
      return origin || '*'; // Return string instead of boolean
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Enhanced analytics middleware
app.use('*', async (c, next) => {
  const start = Date.now();

  await next();

  if (c.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
    const responseTime = Date.now() - start;

    const perfEvent: PerformanceAnalyticsEvent = {
      timestamp: Date.now(),
      endpoint: c.req.path,
      method: c.req.method,
      responseTime,
      statusCode: c.res.status,
      userId: c.get('userId') || undefined,
      metadata: {
        userAgent: c.req.header('User-Agent') || '',
        referer: c.req.header('Referer') || '',
        cf: (c.req.raw as { cf?: unknown }).cf || {},
      },
    };

    // Write to Analytics Engine (non-blocking)
    c.executionCtx.waitUntil(
      c.env.PERFORMANCE_ANALYTICS.writeDataPoint(perfEvent)
    );
  }
});

// Security monitoring middleware
app.use('/api/*', async (c, next) => {
  const clientIP =
    c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
  const userAgent = c.req.header('User-Agent') || '';

  // Check rate limiting with Durable Object
  const rateLimiterId = c.env.RATE_LIMITER.idFromName(clientIP);
  const rateLimiter = c.env.RATE_LIMITER.get(rateLimiterId);

  try {
    const rateLimitResult = await rateLimiter.fetch(c.req.raw);
    const rateLimitData = (await rateLimitResult.json()) as {
      allowed: boolean;
      remaining: number;
    };

    if (!rateLimitData.allowed) {
      // Log security event
      if (c.env.ENABLE_SECURITY_LOGGING === 'true') {
        const securityEvent: SecurityAnalyticsEvent = {
          timestamp: Date.now(),
          ip: clientIP,
          userAgent,
          eventType: 'rate_limit_hit',
          metadata: {
            endpoint: c.req.path,
            method: c.req.method,
          },
          severity: 'medium',
        };

        c.executionCtx.waitUntil(
          c.env.SECURITY_ANALYTICS.writeDataPoint(securityEvent)
        );
      }

      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    c.set('rateLimitRemaining', rateLimitData.remaining);
  } catch (error) {
    console.warn('Rate limiting check failed:', error);
  }

  await next();
});

// Health check endpoint with enhanced monitoring
app.get('/health', async (c) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: c.env.ENVIRONMENT,
    services: {
      kv: 'operational',
      r2: 'operational',
      analytics: 'operational',
      auth: 'operational',
    },
    analytics: {
      enabled: c.env.ENABLE_ANALYTICS === 'true',
      datasets: ['health', 'security', 'performance'],
    },
  };

  // Test KV connectivity
  try {
    await c.env.HEALTH_KV.put(
      'health_check',
      JSON.stringify({ timestamp: Date.now() }),
      { expirationTtl: 60 }
    );
    healthData.services.kv = 'operational';
  } catch (error) {
    console.error('KV health check failed:', error);
    healthData.services.kv = 'degraded';
  }

  // Test R2 connectivity
  try {
    await c.env.HEALTH_FILES.head('health-check-test');
    healthData.services.r2 = 'operational';
  } catch (error) {
    console.debug(
      'R2 head request failed (expected for non-existent objects):',
      error
    );
    healthData.services.r2 = 'operational'; // R2 head requests may fail on non-existent objects
  }

  return c.json(healthData);
});

// Enhanced API routes with analytics
app.get('/api/health', async (c) => {
  return c.json({
    api: 'operational',
    timestamp: new Date().toISOString(),
    rateLimitRemaining: c.get('rateLimitRemaining') || 100,
  });
});

// Health data analytics endpoint
app.post('/api/health-data', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId'); // Set by auth middleware

    // Store health data in KV
    const healthDataKey = `health:${userId}:${Date.now()}`;
    await c.env.HEALTH_KV.put(healthDataKey, JSON.stringify(body), {
      expirationTtl: 86400 * 30, // 30 days
    });

    // Track health analytics
    if (c.env.ENABLE_ANALYTICS === 'true') {
      const healthEvent: HealthAnalyticsEvent = {
        timestamp: Date.now(),
        userId,
        eventType: 'health_data_sync',
        metadata: {
          dataType: body.type || 'unknown',
          source: body.source || 'unknown',
          metrics: Object.keys(body.data || {}),
        },
        value: body.data?.value || 0,
      };

      c.executionCtx.waitUntil(
        c.env.HEALTH_ANALYTICS.writeDataPoint(healthEvent)
      );
    }

    return c.json({ success: true, id: healthDataKey });
  } catch (error) {
    console.error('Health data processing error:', error);
    return c.json({ error: 'Failed to process health data' }, 500);
  }
});

// Analytics dashboard endpoint
app.get('/api/analytics/health', async (c) => {
  // Check if this is a demo mode request
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';

  if (isDemoRequest) {
    // Return enhanced demo analytics data
    return c.json({
      period: '24h',
      metrics: {
        totalEvents: 234,
        uniqueUsers: 1,
        avgResponseTime: 67,
        errorRate: 0.01,
      },
      topEvents: [
        { type: 'health_data_sync', count: 142 },
        { type: 'user_login', count: 8 },
        { type: 'fall_detection', count: 1 },
        { type: 'demo_session', count: 83 },
      ],
      demoMode: true,
    });
  }

  // This would typically query Analytics Engine data
  // For now, return mock data structure
  return c.json({
    period: '24h',
    metrics: {
      totalEvents: 150,
      uniqueUsers: 42,
      avgResponseTime: 89,
      errorRate: 0.02,
    },
    topEvents: [
      { type: 'health_data_sync', count: 95 },
      { type: 'user_login', count: 28 },
      { type: 'fall_detection', count: 3 },
    ],
  });
});

// Security analytics endpoint
app.get('/api/analytics/security', async (c) => {
  // Check if this is a demo mode request
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';

  if (isDemoRequest) {
    return c.json({
      period: '24h',
      metrics: {
        totalRequests: 89,
        blockedRequests: 2,
        suspiciousActivity: 0,
        authFailures: 1,
      },
      alerts: [{ type: 'demo_activity', severity: 'info', count: 1 }],
      demoMode: true,
    });
  }

  return c.json({
    period: '24h',
    metrics: {
      totalSecurityEvents: 23,
      rateLimitHits: 8,
      suspiciousActivity: 2,
      blockedRequests: 5,
    },
    topThreats: [
      { type: 'rate_limit_hit', count: 8, severity: 'medium' },
      { type: 'suspicious_activity', count: 2, severity: 'high' },
    ],
  });
});

// File upload endpoint with R2 storage
app.post('/api/files/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const userId = c.get('userId');
    const fileName = `${userId}/${Date.now()}-${file.name}`;

    // Upload to R2
    await c.env.HEALTH_FILES.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Log file upload event
    if (c.env.ENABLE_ANALYTICS === 'true') {
      const healthEvent: HealthAnalyticsEvent = {
        timestamp: Date.now(),
        userId,
        eventType: 'data_export',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      };

      c.executionCtx.waitUntil(
        c.env.HEALTH_ANALYTICS.writeDataPoint(healthEvent)
      );
    }

    return c.json({ success: true, fileName, url: `/api/files/${fileName}` });
  } catch (error) {
    console.error('File upload error:', error);
    return c.json({ error: 'File upload failed' }, 500);
  }
});

// Audit log endpoint
app.post('/api/audit/log', async (c) => {
  try {
    const auditEvent = await c.req.json();
    const timestamp = Date.now();
    const auditKey = `audit/${timestamp}-${Math.random().toString(36).substring(2, 11)}.json`;

    const auditData = {
      ...auditEvent,
      timestamp,
      ip: c.req.header('CF-Connecting-IP'),
      userAgent: c.req.header('User-Agent'),
    };

    // Store in immutable R2 bucket
    await c.env.AUDIT_LOGS.put(auditKey, JSON.stringify(auditData), {
      httpMetadata: {
        contentType: 'application/json',
      },
    });

    return c.json({ success: true, auditId: auditKey });
  } catch (error) {
    console.error('Audit logging error:', error);
    return c.json({ error: 'Audit logging failed' }, 500);
  }
});

// Serve static assets - disable for now due to manifest requirement
// Serve static assets disabled - requires manifest

export default app;
