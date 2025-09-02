import { describe, it, expect } from 'vitest';
import { messageEnvelopeSchema } from '../schemas/health';
import { cn } from '../lib/utils';

describe('schemas', () => {
  it('validates message Mail types', () => {
    const ok = messageEnvelopeSchema.safeParse({
      type: 'live_health_update',
      data: { x: 1 },
      timestamp: new Date().toISOString(),
    });
    expect(ok.success).toBe(true);
    const bad = messageEnvelopeSchema.safeParse({ type: 'not_a_type' });
    expect(bad.success).toBe(false);
  });
});

describe('utils', () => {
  it('cn merges classes predictably', () => {
    const maybe = ''; // simulate a falsy value that should be ignored
    const out = cn('px-2', 'py-1', maybe, 'px-4');
    expect(out).toContain('px-4');
    expect(out).toContain('py-1');
    expect(out).toContain('px-4');
  });
});
