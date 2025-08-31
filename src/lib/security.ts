// Security utilities for Workers runtime (ESM). Keep small and edge-safe.
import { z } from 'zod';

// Minimal redaction-friendly logger
export const log = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(msg, safeMeta(meta)),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, safeMeta(meta)),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, safeMeta(meta)),
};

function safeMeta(meta?: Record<string, unknown>) {
  if (!meta) return {};
  try {
    // Drop keys that might contain PHI or PII
    const blocked = [
      'body',
      'data',
      'payload',
      'health',
      'value',
      'name',
      'email',
      'phone',
    ];
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta)) {
      out[k] = blocked.includes(k) ? '[redacted]' : v;
    }
    return out;
  } catch {
    return {};
  }
}

// HTTP security headers
export function applySecurityHeaders(resp: Response, csp: string): Response {
  const h = new Headers(resp.headers);
  h.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  h.set('Content-Security-Policy', csp);
  return new Response(resp.body, { status: resp.status, headers: h });
}

// CORS helper – restrict in production
export function corsHeaders(
  origin: string | null,
  allowedOrigins: string[]
): Headers {
  const headers = new Headers();
  const allow = origin && allowedOrigins.includes(origin) ? origin : '';
  if (allow) {
    headers.set('Access-Control-Allow-Origin', allow);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Headers', 'authorization, content-type');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  return headers;
}

// Bearer JWT validation (compact, Workers-native). Use cryptographic verification when you have a JWK/JWT provider.
export async function validateBearerJWT(
  token: string,
  opts: { iss?: string; aud?: string; clockSkewSec?: number } = {}
): Promise<{ ok: boolean; sub?: string; claims?: Record<string, unknown> }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false };
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    const skew = opts.clockSkewSec ?? 60;
    if (typeof payload.exp === 'number' && now > payload.exp + skew)
      return { ok: false };
    if (typeof payload.nbf === 'number' && now + skew < payload.nbf)
      return { ok: false };
    if (opts.iss && payload.iss !== opts.iss) return { ok: false };
    if (opts.aud && payload.aud !== opts.aud) return { ok: false };
    // NOTE: Signature not verified here. For production, verify with your IdP JWKs.
    return { ok: true, sub: payload.sub, claims: payload };
  } catch {
    return { ok: false };
  }
}

// Base64url helpers
function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

type JWK = JsonWebKey & { kid?: string; alg?: string; kty: string };

const jwksCache: Map<
  string,
  { fetchedAt: number; ttlMs: number; keys: Record<string, CryptoKey> }
> = new Map();

async function getCryptoKeyForKid(
  jwksUrl: string,
  kid: string
): Promise<CryptoKey | null> {
  const cacheKey = jwksUrl;
  const now = Date.now();
  const cached = jwksCache.get(cacheKey);
  if (cached && now - cached.fetchedAt < cached.ttlMs && cached.keys[kid])
    return cached.keys[kid];

  try {
    // Avoid CF-specific RequestInit typing; rely on edge cache by URL
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;
    const json = (await res.json()) as { keys?: JWK[] };
    const map: Record<string, CryptoKey> = {};
    if (json.keys && Array.isArray(json.keys)) {
      for (const k of json.keys) {
        if (k.kty !== 'RSA') continue;
        const key = await crypto.subtle.importKey(
          'jwk',
          k,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify']
        );
        if (k.kid) map[k.kid] = key;
      }
    }
    jwksCache.set(cacheKey, {
      fetchedAt: now,
      ttlMs: 5 * 60 * 1000,
      keys: map,
    });
    return map[kid] || null;
  } catch {
    return null;
  }
}

export async function verifyJwtWithJwks(
  token: string,
  opts: { iss?: string; aud?: string; jwksUrl: string; clockSkewSec?: number }
): Promise<{ ok: boolean; sub?: string; claims?: Record<string, unknown> }> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { ok: false };
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h))) as {
      alg?: string;
      kid?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return { ok: false };
    const key = await getCryptoKeyForKid(opts.jwksUrl, header.kid);
    if (!key) return { ok: false };
    const dataBytes = new TextEncoder().encode(`${h}.${p}`);
    const sigBytes = b64urlToBytes(s);
    // Copy into fresh arrays to satisfy BufferSource typing in TS DOM lib
    const dataArr = new Uint8Array(dataBytes.length);
    dataArr.set(dataBytes);
    const sigArr = new Uint8Array(sigBytes.length);
    sigArr.set(sigBytes);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      sigArr,
      dataArr
    );
    if (!valid) return { ok: false };
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(p))
    ) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    const skew = opts.clockSkewSec ?? 60;
    if (typeof payload.exp === 'number' && now > payload.exp + skew)
      return { ok: false };
    if (typeof payload.nbf === 'number' && now + skew < payload.nbf)
      return { ok: false };
    if (opts.iss && payload.iss !== opts.iss) return { ok: false };
    if (opts.aud && payload.aud !== opts.aud) return { ok: false };
    return {
      ok: true,
      sub: payload.sub as string | undefined,
      claims: payload,
    };
  } catch {
    return { ok: false };
  }
}

// Decode JWT payload without verification (for non-security-critical flows like deriving rate-limit keys).
export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(parts[1]))
    );
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Minimal audit writer: writes JSON line to R2 if bound; otherwise no-op
type StoragePutOpts = { httpMetadata?: { contentType?: string } } | undefined;
type StorageBinding =
  | {
      put: (
        key: string,
        data: string | ReadableStream | ArrayBuffer,
        opts?: StoragePutOpts
      ) => Promise<unknown>;
    }
  | undefined;

export async function writeAudit(
  env: { HEALTH_STORAGE?: StorageBinding },
  event: {
    type: string;
    at?: string;
    actor?: string;
    resource?: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const at = event.at || new Date().toISOString();
    const line =
      JSON.stringify({
        type: event.type,
        at,
        actor: event.actor ?? 'anonymous',
        resource: event.resource ?? '-',
        meta: event.meta ?? {},
      }) + '\n';
    if (env.HEALTH_STORAGE) {
      // Append-like behavior: R2 doesn't support append, so we can write separate objects per event in production.
      // For demo, we store one object per event.
      const eventKey = `audit/events/${at}_${Math.random().toString(36).slice(2)}.json`;
      await env.HEALTH_STORAGE.put(eventKey, line, {
        httpMetadata: { contentType: 'application/json' },
      });
    }
  } catch (e) {
    log.warn('audit_write_failed', { error: (e as Error).message });
  }
}

// Application-level encryption helpers (AES-GCM). Key must be 32 bytes (base64 in ENV).
export async function getAesKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  if (raw.byteLength !== 32)
    throw new Error('ENC_KEY must be 32 bytes (base64)');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptJSON<T>(key: CryptoKey, data: T): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const out = new Uint8Array(iv.byteLength + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...out));
}

export async function decryptJSON<T>(key: CryptoKey, b64: string): Promise<T> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}

// Simple schema guard wrapper for Workers handlers
export function validateBody<T>(schema: z.Schema<T>) {
  return async (
    req: Request
  ): Promise<{ ok: true; data: T } | { ok: false; error: unknown }> => {
    try {
      const json = await req.json();
      const parsed = schema.safeParse(json);
      if (!parsed.success) return { ok: false, error: parsed.error.flatten() };
      return { ok: true, data: parsed.data };
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  };
}

// --- Minimal JWT (HS256) utilities for device tokens ---
function base64urlEncode(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function signJwtHS256(
  payload: Record<string, unknown>,
  secret: string,
  header: Record<string, unknown> = {}
): Promise<string> {
  const enc = new TextEncoder();
  const h: Record<string, unknown> = { alg: 'HS256', typ: 'JWT', ...header };
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(h)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = base64urlEncode(new Uint8Array(sig));
  return `${data}.${sigB64}`;
}
