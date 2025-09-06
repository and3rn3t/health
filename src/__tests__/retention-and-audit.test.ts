import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTtlSecondsForType } from '../lib/retention';
import { writeAudit } from '../lib/security';

describe('retention policy', () => {
  it('returns longer TTLs in production and caps to 2 days in dev', () => {
    const prod = getTtlSecondsForType('walking_steadiness', 'production');
    const dev = getTtlSecondsForType('walking_steadiness', 'development');
    expect(prod).toBeGreaterThan(dev);
    expect(dev).toBeLessThanOrEqual(2 * 24 * 60 * 60);
  });

  it('falls back to default 30 days for unknown types (prod), but caps in dev', () => {
    const prod = getTtlSecondsForType('unknown_metric', 'production');
    const dev = getTtlSecondsForType('unknown_metric', 'development');
    expect(prod).toBe(30 * 24 * 60 * 60);
    expect(dev).toBeLessThanOrEqual(2 * 24 * 60 * 60);
  });
});

describe('audit writer', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('writes newline-delimited JSON to R2 when binding present', async () => {
    const puts: Array<{ key: string; data: string }> = [];
    const env = {
      HEALTH_STORAGE: {
        put: async (
          key: string,
          data: string | ReadableStream<unknown> | ArrayBuffer
        ): Promise<unknown> => {
          puts.push({ key, data: data as string });
          return undefined;
        },
      },
    } as {
      HEALTH_STORAGE: {
        put: (
          key: string,
          data: string | ReadableStream<unknown> | ArrayBuffer
        ) => Promise<unknown>;
      };
    };

    await writeAudit(env, {
      type: 'test_event',
      actor: 'tester',
      resource: 'unit',
      meta: { x: 1 },
    });
    expect(puts.length).toBe(1);
    const { key, data } = puts[0];
    expect(key.startsWith('audit/events/')).toBe(true);
    expect(data.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(data.trim());
    expect(parsed.type).toBe('test_event');
    expect(parsed.actor).toBe('tester');
    expect(parsed.resource).toBe('unit');
  });
});
