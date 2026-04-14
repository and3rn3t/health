import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// The module under test uses `crypto.subtle` which is available in Node 18+ via globalThis
import {
  applySecurityHeaders,
  corsHeaders,
  validateBearerJWT,
  decodeJwtPayload,
  writeAudit,
  getAesKey,
  encryptJSON,
  decryptJSON,
  validateBody,
  signJwtHS256,
  log,
} from '../security';
import { z } from 'zod/v3';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fake JWT with a JSON payload (no cryptographic signature). */
function fakeJwt(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'none' },
): string {
  const h = btoa(JSON.stringify(header));
  const p = btoa(JSON.stringify(payload));
  return `${h}.${p}.fake-sig`;
}

function futureEpoch(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

function pastEpoch(seconds: number): number {
  return Math.floor(Date.now() / 1000) - seconds;
}

// ---------------------------------------------------------------------------
// safeMeta / log (PII redaction)
// ---------------------------------------------------------------------------

describe('log (PII-safe logger)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('redacts blocked PII keys', () => {
    log.info('test', { email: 'a@b.com', action: 'login' });
    expect(consoleSpy).toHaveBeenCalledWith('test', {
      email: '[redacted]',
      action: 'login',
    });
  });

  it('redacts health-related keys', () => {
    log.warn('test', { heartRate: 72, speed: 1.2, region: 'us' });
    const meta = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    expect(meta).toEqual({
      heartRate: '[redacted]',
      speed: '[redacted]',
      region: 'us',
    });
  });

  it('redacts all known blocked keys', () => {
    const blocked = [
      'body', 'data', 'payload', 'health', 'value', 'name', 'email',
      'phone', 'speed', 'stepFrequency', 'asymmetry', 'stability',
      'instantaneousStability', 'overallScore', 'score', 'heartRate',
      'bloodPressure', 'glucose', 'weight', 'bmi', 'percent', 'userId',
      'ssn', 'dob', 'dateOfBirth', 'address', 'diagnosis', 'medication',
    ];
    const meta: Record<string, unknown> = {};
    for (const k of blocked) meta[k] = 'secret';
    meta['safe'] = 'visible';

    log.error('check', meta);
    const logged = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<string, unknown>;
    for (const k of blocked) {
      expect(logged[k]).toBe('[redacted]');
    }
    expect(logged['safe']).toBe('visible');
  });

  it('returns empty object when meta is undefined', () => {
    log.info('no-meta');
    expect(consoleSpy).toHaveBeenCalledWith('no-meta', {});
  });
});

// ---------------------------------------------------------------------------
// applySecurityHeaders
// ---------------------------------------------------------------------------

describe('applySecurityHeaders', () => {
  it('sets all required security headers', () => {
    const original = new Response('ok', { status: 200 });
    const secured = applySecurityHeaders(original, "default-src 'self'");

    expect(secured.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secured.headers.get('X-Frame-Options')).toBe('DENY');
    expect(secured.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(secured.headers.get('Permissions-Policy')).toBe(
      'geolocation=(), microphone=(), camera=()',
    );
    expect(secured.headers.get('Content-Security-Policy')).toBe(
      "default-src 'self'",
    );
  });

  it('preserves original status code', () => {
    const original = new Response('not found', { status: 404 });
    const secured = applySecurityHeaders(original, '');
    expect(secured.status).toBe(404);
  });

  it('preserves original body', async () => {
    const original = new Response('body-text');
    const secured = applySecurityHeaders(original, '');
    expect(await secured.text()).toBe('body-text');
  });
});

// ---------------------------------------------------------------------------
// corsHeaders
// ---------------------------------------------------------------------------

describe('corsHeaders', () => {
  const allowed = ['https://app.vitalsense.dev', 'http://localhost:5173'];

  it('sets CORS headers for an allowed origin', () => {
    const h = corsHeaders('https://app.vitalsense.dev', allowed);
    expect(h.get('Access-Control-Allow-Origin')).toBe('https://app.vitalsense.dev');
    expect(h.get('Vary')).toBe('Origin');
    expect(h.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(h.get('Access-Control-Allow-Methods')).toBe('GET,POST,OPTIONS');
  });

  it('sets no CORS headers for a disallowed origin', () => {
    const h = corsHeaders('https://evil.com', allowed);
    expect(h.get('Access-Control-Allow-Origin')).toBeNull();
    expect(h.get('Vary')).toBeNull();
  });

  it('sets no CORS headers when origin is null', () => {
    const h = corsHeaders(null, allowed);
    expect(h.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateBearerJWT
// ---------------------------------------------------------------------------

describe('validateBearerJWT', () => {
  it('returns ok for a valid, non-expired token', async () => {
    const token = fakeJwt({ sub: 'user-1', exp: futureEpoch(600) });
    const result = await validateBearerJWT(token);
    expect(result.ok).toBe(true);
    expect(result.sub).toBe('user-1');
  });

  it('rejects an expired token (beyond clock skew)', async () => {
    const token = fakeJwt({ sub: 'x', exp: pastEpoch(300) });
    const result = await validateBearerJWT(token);
    expect(result.ok).toBe(false);
  });

  it('accepts a token within clock skew window', async () => {
    const token = fakeJwt({ sub: 'x', exp: pastEpoch(30) });
    const result = await validateBearerJWT(token, { clockSkewSec: 60 });
    expect(result.ok).toBe(true);
  });

  it('rejects a token with future nbf beyond skew', async () => {
    const token = fakeJwt({ sub: 'x', nbf: futureEpoch(300) });
    const result = await validateBearerJWT(token);
    expect(result.ok).toBe(false);
  });

  it('rejects when issuer does not match', async () => {
    const token = fakeJwt({ sub: 'x', iss: 'wrong-iss', exp: futureEpoch(600) });
    const result = await validateBearerJWT(token, { iss: 'expected-iss' });
    expect(result.ok).toBe(false);
  });

  it('rejects when audience does not match', async () => {
    const token = fakeJwt({ sub: 'x', aud: 'wrong-aud', exp: futureEpoch(600) });
    const result = await validateBearerJWT(token, { aud: 'expected-aud' });
    expect(result.ok).toBe(false);
  });

  it('rejects a token with fewer than 3 parts', async () => {
    const result = await validateBearerJWT('only.two');
    expect(result.ok).toBe(false);
  });

  it('rejects a non-Base64 payload', async () => {
    const result = await validateBearerJWT('a.!!!.c');
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// decodeJwtPayload
// ---------------------------------------------------------------------------

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const token = fakeJwt({ sub: 'u1', role: 'admin' });
    const payload = decodeJwtPayload(token);
    expect(payload).toEqual({ sub: 'u1', role: 'admin' });
  });

  it('returns null for a token with < 2 parts', () => {
    expect(decodeJwtPayload('single-part')).toBeNull();
  });

  it('returns null for invalid Base64', () => {
    expect(decodeJwtPayload('a.!!!invalid.c')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// writeAudit
// ---------------------------------------------------------------------------

describe('writeAudit', () => {
  it('writes audit event to R2 when HEALTH_STORAGE is bound', async () => {
    const putFn = vi.fn().mockResolvedValue(undefined);
    const env = { HEALTH_STORAGE: { put: putFn } };

    await writeAudit(env, {
      type: 'login',
      actor: 'user-1',
      resource: '/api/health',
      meta: { ip: '1.2.3.4' },
    });

    expect(putFn).toHaveBeenCalledTimes(1);
    const [key, body, opts] = putFn.mock.calls[0] as [string, string, { httpMetadata: { contentType: string } }];
    expect(key).toMatch(/^audit\/events\//);
    expect(key).toMatch(/\.json$/);
    const parsed = JSON.parse(body.trim());
    expect(parsed.type).toBe('login');
    expect(parsed.actor).toBe('user-1');
    expect(opts.httpMetadata.contentType).toBe('application/json');
  });

  it('no-ops when HEALTH_STORAGE is undefined', async () => {
    // Should not throw
    await writeAudit({}, { type: 'test' });
  });

  it('defaults actor and resource when omitted', async () => {
    const putFn = vi.fn().mockResolvedValue(undefined);
    await writeAudit({ HEALTH_STORAGE: { put: putFn } }, { type: 'anon' });

    const body = JSON.parse((putFn.mock.calls[0]![1] as string).trim());
    expect(body.actor).toBe('anonymous');
    expect(body.resource).toBe('-');
  });

  it('swallows R2 write errors', async () => {
    const putFn = vi.fn().mockRejectedValue(new Error('R2 down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await writeAudit({ HEALTH_STORAGE: { put: putFn } }, { type: 'fail' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// AES-GCM encryption helpers
// ---------------------------------------------------------------------------

describe('getAesKey / encryptJSON / decryptJSON', () => {
  // Generate a valid 32-byte key in base64
  const raw32 = new Uint8Array(32);
  crypto.getRandomValues(raw32);
  const base64Key = btoa(String.fromCharCode(...raw32));

  it('round-trips encrypt then decrypt', async () => {
    const key = await getAesKey(base64Key);
    const data = { secret: 'hello', nested: { n: 42 } };
    const ct = await encryptJSON(key, data);
    expect(typeof ct).toBe('string');
    const pt = await decryptJSON(key, ct);
    expect(pt).toEqual(data);
  });

  it('rejects a key that is not 32 bytes', async () => {
    const short = btoa('too-short');
    await expect(getAesKey(short)).rejects.toThrow('ENC_KEY must be 32 bytes');
  });

  it('produces different ciphertext for the same plaintext (random IV)', async () => {
    const key = await getAesKey(base64Key);
    const ct1 = await encryptJSON(key, 'same');
    const ct2 = await encryptJSON(key, 'same');
    expect(ct1).not.toBe(ct2);
  });
});

// ---------------------------------------------------------------------------
// validateBody
// ---------------------------------------------------------------------------

describe('validateBody', () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  it('returns ok with parsed data for valid input', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', age: 30 }),
    });
    const result = await validateBody(schema)(req);
    expect(result).toEqual({ ok: true, data: { name: 'Ada', age: 30 } });
  });

  it('returns error for invalid schema input', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ name: 123 }),
    });
    const result = await validateBody(schema)(req);
    expect(result.ok).toBe(false);
  });

  it('returns error for non-JSON body', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      body: 'not json',
    });
    const result = await validateBody(schema)(req);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: unknown }).error).toBe('invalid_json');
  });
});

// ---------------------------------------------------------------------------
// signJwtHS256
// ---------------------------------------------------------------------------

describe('signJwtHS256', () => {
  const secret = 'test-secret-key-for-hmac-signing';

  it('produces a 3-part dot-separated JWT', async () => {
    const jwt = await signJwtHS256({ sub: 'user-1' }, secret);
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);
  });

  it('encodes the payload correctly', async () => {
    const payload = { sub: 'u1', role: 'admin', exp: 1234567890 };
    const jwt = await signJwtHS256(payload, secret);
    const decoded = decodeJwtPayload(jwt);
    expect(decoded).toMatchObject(payload);
  });

  it('defaults header to alg=HS256 typ=JWT', async () => {
    const jwt = await signJwtHS256({}, secret);
    const headerPart = jwt.split('.')[0]!;
    // Restore base64url to base64
    const b64 = headerPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const header = JSON.parse(atob(padded));
    expect(header.alg).toBe('HS256');
    expect(header.typ).toBe('JWT');
  });

  it('produces different signatures for different secrets', async () => {
    const jwt1 = await signJwtHS256({ sub: 'x' }, 'secret-a');
    const jwt2 = await signJwtHS256({ sub: 'x' }, 'secret-b');
    const sig1 = jwt1.split('.')[2];
    const sig2 = jwt2.split('.')[2];
    expect(sig1).not.toBe(sig2);
  });
});
