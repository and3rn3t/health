import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { validateBody, log } from '../lib/security';

describe('validateBody helper', () => {
  it('returns ok:true with parsed data on valid JSON matching schema', async () => {
    const schema = z.object({ a: z.string(), n: z.number() });
    const handler = validateBody(schema);
    const req = new Request('http://local', {
      method: 'POST',
      body: JSON.stringify({ a: 'x', n: 2 }),
    });
    const res = await handler(req);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual({ a: 'x', n: 2 });
  });

  it('returns ok:false with invalid_json on bad JSON', async () => {
    const schema = z.object({ a: z.string() });
    const handler = validateBody(schema);
    const req = new Request('http://local', { method: 'POST', body: '{bad' });
    const res = await handler(req);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid_json');
  });

  it('returns ok:false with flattened zod error on schema mismatch', async () => {
    const schema = z.object({ a: z.string() });
    const handler = validateBody(schema);
    const req = new Request('http://local', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });
    const res = await handler(req);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toHaveProperty('fieldErrors');
  });
});

describe('logger redaction', () => {
  const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const spyErr = vi.spyOn(console, 'error').mockImplementation(() => {});
  beforeEach(() => {
    spyLog.mockClear();
    spyWarn.mockClear();
    spyErr.mockClear();
  });
  afterEach(() => {
    spyLog.mockReset();
    spyWarn.mockReset();
    spyErr.mockReset();
  });

  it('redacts sensitive meta fields', () => {
    const meta = {
      name: 'Alice',
      email: 'a@b.c',
      phone: '123',
      payload: { x: 1 },
      data: 'secret',
      body: 'phi',
      value: 'pii',
      other: 'ok',
    };
    log.info('msg', meta);
    expect(spyLog).toHaveBeenCalled();
    const args = spyLog.mock.calls[0] as unknown[];
    const out = args[1] as Record<string, unknown>;
    expect(out.name).toBe('[redacted]');
    expect(out.email).toBe('[redacted]');
    expect(out.phone).toBe('[redacted]');
    expect(out.payload).toBe('[redacted]');
    expect(out.data).toBe('[redacted]');
    expect(out.body).toBe('[redacted]');
    expect(out.value).toBe('[redacted]');
    expect(out.other).toBe('ok');
  });
});
