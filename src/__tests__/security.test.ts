/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import {
  getAesKey,
  encryptJSON,
  decryptJSON,
  validateBearerJWT,
} from '../lib/security';
import { processedHealthDataSchema } from '../schemas/health';

describe('security utils', () => {
  it('AES-GCM roundtrip encrypts JSON', async () => {
    // Fixed 32-byte base64 key for test
    const b64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const key = await getAesKey(b64);
    const out = await encryptJSON(key, { a: 1, b: 'x' });
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(16);
  });

  it('AES-GCM decrypts data correctly', async () => {
    const b64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const key = await getAesKey(b64);
    const payload = { foo: 'bar', n: 42 };
    const ct = await encryptJSON(key, payload);
    const pt = await decryptJSON<typeof payload>(key, ct);
    expect(pt).toEqual(payload);
  });

  it('zod boundary rejects invalid health data', () => {
    const invalid: any = { type: 'unknown', processedAt: 'not-a-date' };
    const parsed = processedHealthDataSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects JWT when claims mismatch', async () => {
    // exp=1 (past), aud/iss mismatch
    const bad =
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJub3QiLCJpc3MiOiJub3QiLCJleHAiOjF9.sig';
    const res = await validateBearerJWT(bad, {
      iss: 'expected',
      aud: 'expected',
    });
    expect(res.ok).toBe(false);
  });

  it('validateBearerJWT rejects malformed tokens', async () => {
    const bad = 'a.b.c';
    const res = await validateBearerJWT(bad, { iss: 'x', aud: 'y' });
    expect(res.ok).toBe(false);
  });
});
