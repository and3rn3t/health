import type { Context } from 'hono';
import {
  decodeJwtPayload,
  log,
  verifyJwtWithJwks,
} from '@/lib/security';
import { z } from 'zod/v3';
import type { Env } from './types';

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const buckets = new Map<string, { tokens: number; last: number }>();
const BUCKET_MAX_SIZE = 10_000;

function pruneBuckets(): void {
  if (buckets.size <= BUCKET_MAX_SIZE) return;
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (now - b.last > 120_000) buckets.delete(key);
  }
  // If still over limit after time-based pruning, drop oldest entries
  if (buckets.size > BUCKET_MAX_SIZE) {
    const sorted = [...buckets.entries()].sort((a, b) => a[1].last - b[1].last);
    const toRemove = sorted.slice(0, buckets.size - BUCKET_MAX_SIZE);
    for (const [key] of toRemove) buckets.delete(key);
  }
}

export function rateLimit(
  ip: string,
  limit = 60,
  intervalMs = 60_000
): boolean {
  pruneBuckets();
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: limit, last: now };
  const elapsed = now - b.last;
  const refill = Math.floor(elapsed / intervalMs) * limit;
  b.tokens = Math.min(limit, b.tokens + refill);
  b.last = now;
  if (b.tokens <= 0) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

export async function rateLimitDO(
  c: Context<{ Bindings: Env }>,
  key: string,
  limit = 60,
  intervalMs = 60_000
): Promise<boolean> {
  try {
    if (!c.env.RATE_LIMITER) return rateLimit(key, limit, intervalMs);
    const id = c.env.RATE_LIMITER.idFromName(key);
    const stub = c.env.RATE_LIMITER.get(id);
    const u = new URL('https://do.local/consume');
    u.searchParams.set('key', key);
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('intervalMs', String(intervalMs));
    const resp = await stub.fetch(new Request(u.toString()));
    if (!resp.ok) return false;
    const body = (await resp.json().catch(() => ({ ok: false }))) as {
      ok?: boolean;
    };
    return Boolean(body.ok);
  } catch (err) {
    log.warn('rate_limiter_do_error', {
      error: err instanceof Error ? err.message : String(err),
      key,
    });
    return rateLimit(key, limit, intervalMs);
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export function deriveRateLimitKey(c: Context<{ Bindings: Env }>): string {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const sub = token
    ? (decodeJwtPayload(token)?.sub as string | undefined)
    : undefined;
  return sub || c.req.header('CF-Connecting-IP') || 'anon';
}

export function getAuthSub(c: Context<{ Bindings: Env }>): string | null {
  try {
    const auth = c.req.header('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const sub = token
      ? (decodeJwtPayload(token)?.sub as string | undefined)
      : undefined;
    return sub ?? null;
  } catch {
    return null;
  }
}

/** Verified auth sub cache scoped to a request (avoids double JWKS calls). */
const verifiedSubCache = new WeakMap<Request, string | null>();

/**
 * Return the `sub` claim only after cryptographic JWT verification.
 * Falls back to unverified decode in non-production environments.
 */
export async function getVerifiedAuthSub(
  c: Context<{ Bindings: Env }>
): Promise<string | null> {
  const cached = verifiedSubCache.get(c.req.raw);
  if (cached !== undefined) return cached;

  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    verifiedSubCache.set(c.req.raw, null);
    return null;
  }

  // Non-production: allow unverified decode for local dev/testing
  if (c.env.ENVIRONMENT !== 'production') {
    const sub = getAuthSub(c);
    verifiedSubCache.set(c.req.raw, sub);
    return sub;
  }

  const jwksUrl =
    c.env.API_JWKS_URL ||
    (c.env.AUTH0_DOMAIN
      ? `https://${c.env.AUTH0_DOMAIN}/.well-known/jwks.json`
      : undefined);
  if (!jwksUrl) {
    verifiedSubCache.set(c.req.raw, null);
    return null;
  }

  try {
    const result = await verifyJwtWithJwks(token, {
      iss:
        c.env.API_ISS ||
        (c.env.AUTH0_DOMAIN ? `https://${c.env.AUTH0_DOMAIN}/` : undefined),
      aud: c.env.API_AUD,
      jwksUrl,
    });
    const sub = result.ok ? (result.sub as string) ?? null : null;
    verifiedSubCache.set(c.req.raw, sub);
    return sub;
  } catch {
    verifiedSubCache.set(c.req.raw, null);
    return null;
  }
}

export async function requireAuth(
  c: Context<{ Bindings: Env }>
): Promise<boolean> {
  if (!c.env) return true;

  // Skip auth only in non-production environments
  if (c.env.ENVIRONMENT !== 'production') return true;

  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const jwksUrl =
    c.env.API_JWKS_URL ||
    (c.env.AUTH0_DOMAIN
      ? `https://${c.env.AUTH0_DOMAIN}/.well-known/jwks.json`
      : undefined);
  if (!jwksUrl) return false;
  const check = await verifyJwtWithJwks(token, {
    iss:
      c.env.API_ISS ||
      (c.env.AUTH0_DOMAIN ? `https://${c.env.AUTH0_DOMAIN}/` : undefined),
    aud: c.env.API_AUD,
    jwksUrl,
  });
  return check.ok;
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

export function shouldSample(c: Context<{ Bindings: Env }>): boolean {
  const env = c.env.ENVIRONMENT || 'development';
  const rateStr = c.env.LOG_SAMPLE_RATE;
  let rate = 1;
  if (rateStr) {
    const parsed = Number(rateStr);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) rate = parsed;
  } else if (env === 'production') {
    rate = 0.1;
  }
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomValue = array[0]! / (0xffffffff + 1);
  return randomValue < rate;
}

export function shouldSampleWithKey(
  c: Context<{ Bindings: Env }>,
  key: keyof Env | 'LOG_WS_SAMPLE_RATE' | 'LOG_CLIENT_ERROR_SAMPLE_RATE',
  fallbackDev = 1,
  fallbackProd = 0.1
): boolean {
  const env = c.env.ENVIRONMENT || 'development';
  const raw = (c.env as Record<string, string | undefined>)[key as string];
  let rate: number | null = null;
  if (raw) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) rate = parsed;
  }
  rate ??= env === 'production' ? fallbackProd : fallbackDev;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomValue = array[0]! / (0xffffffff + 1);
  return randomValue < rate;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** Resolve the first available Analytics Engine dataset from env bindings. */
export function getAnalyticsDataset(
  env: Env
): AnalyticsEngineDataset | undefined {
  return env.ANALYTICS || env.HEALTH_ANALYTICS || env.PERFORMANCE_ANALYTICS || env.SECURITY_ANALYTICS;
}

export async function pushAnalytics(
  c: Context<{ Bindings: Env }>,
  data: {
    path: string;
    method: string;
    status: number;
    durMs: number;
    correlationId: string;
    sub: string | null;
  }
): Promise<void> {
  try {
    const ds = getAnalyticsDataset(c.env);
    if (!ds) return;
    ds.writeDataPoint({
      blobs: [
        c.env.ENVIRONMENT || 'development',
        data.path,
        data.method,
        String(data.status),
        data.sub ? '1' : '0',
        data.correlationId,
      ],
      doubles: [data.durMs],
    });
  } catch {
    // best-effort only
  }
}

export function writeAnalyticsPoint(
  c: Context<{ Bindings: Env }>,
  blobs: string[],
  doubles: number[]
): boolean {
  try {
    const ds = getAnalyticsDataset(c.env);
    if (!ds) return false;
    const safeBlobs = blobs.map((b) => (b ?? '').toString().slice(0, 512));
    const safeDoubles = doubles.map((n) => (Number.isFinite(n) ? n : -1));
    ds.writeDataPoint({ blobs: safeBlobs, doubles: safeDoubles });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// WebSocket broadcast
// ---------------------------------------------------------------------------

export async function broadcastUserLiveEvent(
  c: Context<{ Bindings: Env }>,
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const ns = c.env.HEALTH_WEBSOCKET;
    if (!ns) return;
    const id = ns.idFromName(userId);
    const stub = ns.get(id);
    await stub.fetch(
      new Request('https://do.local/broadcast', {
        method: 'POST',
        body: JSON.stringify({ userId, payload }),
        headers: { 'content-type': 'application/json' },
      })
    );
  } catch (e) {
    log.warn('broadcast_user_event_failed', { err: (e as Error).message });
  }
}

// ---------------------------------------------------------------------------
// CORS helper (re-export)
// ---------------------------------------------------------------------------

export { corsHeaders, log } from '@/lib/security';

// ---------------------------------------------------------------------------
// Version mismatch buffer (in-memory, ephemeral)
// ---------------------------------------------------------------------------

export const VERSION_MISMATCH_BUFFER_SIZE = 50;
const VERSION_MISMATCH_RETENTION_MS = 30 * 60 * 1000; // 30 minutes

export const versionMismatchBuffer: Array<{
  ts: string;
  gaitLocal: string | null;
  gaitRemote: string | null;
  fallLocal: string | null;
  fallRemote: string | null;
  sample?: number;
  seq?: number;
}> = [];

function pruneMismatchBuffer(now = Date.now()) {
  const toKeep: typeof versionMismatchBuffer = [];
  for (const ev of versionMismatchBuffer) {
    const age = now - Date.parse(ev.ts);
    if (!(Number.isFinite(age) && age > VERSION_MISMATCH_RETENTION_MS)) {
      toKeep.push(ev);
    }
  }
  versionMismatchBuffer.length = 0;
  for (const ev of toKeep.slice(-VERSION_MISMATCH_BUFFER_SIZE)) {
    versionMismatchBuffer.push(ev);
  }
  if (versionMismatchBuffer.length > VERSION_MISMATCH_BUFFER_SIZE) {
    versionMismatchBuffer.splice(
      0,
      versionMismatchBuffer.length - VERSION_MISMATCH_BUFFER_SIZE
    );
  }
}

export function pushVersionMismatch(ev: (typeof versionMismatchBuffer)[0]) {
  versionMismatchBuffer.push(ev);
  pruneMismatchBuffer();
}

export const versionMismatchIngestSchema = z
  .object({
    ts: z.string().datetime().optional(),
    gaitLocal: z.string().min(1).optional(),
    gaitRemote: z.string().min(1).optional(),
    fallLocal: z.string().min(1).optional(),
    fallRemote: z.string().min(1).optional(),
    sample: z.number().int().nonnegative().optional(),
    seq: z.number().int().nonnegative().optional(),
  })
  .refine(
    (d) =>
      (d.gaitLocal && d.gaitRemote && d.gaitLocal !== d.gaitRemote) ||
      (d.fallLocal && d.fallRemote && d.fallLocal !== d.fallRemote),
    'no_mismatch_detected'
  );
