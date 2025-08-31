import { describe, it, expect } from 'vitest';
import {
  applySecurityHeaders,
  corsHeaders,
  getAesKey,
  encryptJSON,
  decryptJSON,
  decodeJwtPayload,
} from '../lib/security';

describe('security headers and CORS', () => {
  it('applySecurityHeaders sets CSP and security headers', () => {
    const base = new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
    const csp = "default-src 'self'";
    const out = applySecurityHeaders(base, csp);
    expect(out.headers.get('Content-Security-Policy')).toBe(csp);
    expect(out.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(out.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('corsHeaders returns empty when origin not allowed', () => {
    const h = corsHeaders('https://evil.test', ['https://allowed.test']);
    expect(h.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('corsHeaders echoes allowed origin and sets Vary', () => {
    const h = corsHeaders('https://allowed.test', ['https://allowed.test']);
    expect(h.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(h.get('Vary')).toBe('Origin');
  });
});

describe('crypto helpers edge cases', () => {
  it('getAesKey throws when key is wrong length', async () => {
    await expect(getAesKey('short')).rejects.toBeInstanceOf(Error);
  });

  it('decryptJSON throws with wrong key', async () => {
    const key1 = await getAesKey(
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    );
    const key2 = await getAesKey(
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    );
    const ct = await encryptJSON(key1, { x: 1 });
    await expect(decryptJSON(key2, ct)).rejects.toBeTruthy();
  });
});

describe('decodeJwtPayload', () => {
  it('returns null for malformed tokens and object for valid base64', () => {
    expect(decodeJwtPayload('bad')).toBeNull();
    const hdr = btoa(JSON.stringify({ alg: 'none' }));
    const pl = btoa(JSON.stringify({ sub: 'u1' }));
    const token = `${hdr}.${pl}.sig`;
    const out = decodeJwtPayload(token);
    expect(out).not.toBeNull();
    if (out && typeof out === 'object') {
      expect((out as { [k: string]: unknown })['sub']).toBe('u1');
    }
  });
});
