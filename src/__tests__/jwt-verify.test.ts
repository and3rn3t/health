import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyJwtWithJwks } from '../lib/security';

function b64urlEncode(input: Uint8Array): string {
  // Convert bytes to base64 using browser-compatible btoa
  let binary = '';
  for (const b of input) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlEncodeJSON(obj: unknown): string {
  const json = JSON.stringify(obj);
  return b64urlEncode(new TextEncoder().encode(json));
}

describe('verifyJwtWithJwks (positive path)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies a RS256-signed JWT against a JWKS (kid match)', async () => {
    // Generate RSA keypair for RS256
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    const kid = 'test-key-1';
    const publicJwk = (await crypto.subtle.exportKey(
      'jwk',
      keyPair.publicKey
    )) as JsonWebKey & { kid?: string };
    publicJwk.kid = kid;

    const iss = 'https://issuer.example';
    const aud = 'health-app';
    const sub = 'user-123';
    const now = Math.floor(Date.now() / 1000);
    const payload = { iss, aud, sub, iat: now, nbf: now - 1, exp: now + 300 };
    const header = { alg: 'RS256', typ: 'JWT', kid };

    const h = b64urlEncodeJSON(header);
    const p = b64urlEncodeJSON(payload);
    const data = new TextEncoder().encode(`${h}.${p}`);
    const sig = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyPair.privateKey,
      data
    );
    const s = b64urlEncode(new Uint8Array(sig));
    const token = `${h}.${p}.${s}`;

    // Mock fetch to return our JWKS containing the matching public key
    const jwks = { keys: [publicJwk] };
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => jwks,
    } as Response);

    const res = await verifyJwtWithJwks(token, {
      iss,
      aud,
      jwksUrl: 'https://example.com/jwks.json',
    });
    expect(res.ok).toBe(true);
    expect(res.sub).toBe(sub);
    expect(res.claims?.iss).toBe(iss);
    expect(res.claims?.aud).toBe(aud);
  });
});
