/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { z } from 'zod';
import { processedHealthDataSchema, healthMetricSchema } from '@/schemas/health';

type Env = {
  ENVIRONMENT?: string;
  HEALTH_KV?: { put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void> };
  ASSETS: {
    fetch: (req: Request) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Env }>();

// Serve static assets via Wrangler [assets] binding; fallback to next on 404
app.use('/*', async (c, next) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  if (res.status === 404) return next();
  return res;
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  environment: c.env.ENVIRONMENT || 'unknown',
  });
});

// WebSocket endpoint for real-time health data (not implemented in Worker yet)
app.get('/ws', (c) => {
  return c.text('WebSocket endpoint not available on Worker. Use local bridge server.', 426);
});

// API routes for health data
app.get('/api/health-data', async (c) => {
  // Validate query params
  const querySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    metric: healthMetricSchema.shape.type.optional(),
  });

  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parse = querySchema.safeParse(params);
  if (!parse.success) {
    return c.json({ error: 'validation_error', details: parse.error.flatten() }, 400);
  }

  // Stubbed response for now
  return c.json({
    ok: true,
    query: parse.data,
    data: [],
  });
});

app.post('/api/health-data', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = processedHealthDataSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'validation_error', details: parsed.error.flatten() }, 400);
  }

  // Optionally persist if KV is bound
  try {
    const kv = c.env.HEALTH_KV;
    if (kv) {
      const key = `health:${parsed.data.type}:${parsed.data.processedAt}`;
      await kv.put(key, JSON.stringify(parsed.data), { expirationTtl: 60 * 60 * 24 }); // 24h TTL for demo
    }
  } catch (e) {
    // Fail closed without leaking sensitive data
    return c.json({ error: 'server_error' }, 500);
  }

  return c.json({ ok: true, data: parsed.data }, 201);
});

// SPA fallback to index.html using ASSETS binding
app.get('*', async (c) => {
  const url = new URL('/index.html', c.req.url);
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
