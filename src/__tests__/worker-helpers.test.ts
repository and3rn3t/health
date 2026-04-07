import { describe, expect, it, vi, beforeEach } from 'vitest';
import { rateLimit } from '../worker/helpers';

// We test the exported pure/near-pure helpers. The Hono-context helpers
// (rateLimitDO, getVerifiedAuthSub, shouldSample) are integration-level
// and need more involved mocking; unit coverage of the core algorithm here.

describe('rateLimit (in-memory token bucket)', () => {
  beforeEach(() => {
    // Each test gets a unique IP to avoid bucket cross-talk
  });

  it('allows requests under the limit', () => {
    const ip = `rl-allow-${Date.now()}`;
    expect(rateLimit(ip, 5, 60_000)).toBe(true);
    expect(rateLimit(ip, 5, 60_000)).toBe(true);
  });

  it('rejects when tokens are exhausted', () => {
    const ip = `rl-exhaust-${Date.now()}`;
    // Drain all 2 tokens
    expect(rateLimit(ip, 2, 60_000)).toBe(true);
    expect(rateLimit(ip, 2, 60_000)).toBe(true);
    // Third request should fail
    expect(rateLimit(ip, 2, 60_000)).toBe(false);
  });

  it('refills tokens after the interval elapses', () => {
    const ip = `rl-refill-${Date.now()}`;
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Drain 1 token
    expect(rateLimit(ip, 1, 1_000)).toBe(true);
    expect(rateLimit(ip, 1, 1_000)).toBe(false);

    // Advance time past one interval
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001);
    expect(rateLimit(ip, 1, 1_000)).toBe(true);

    vi.restoreAllMocks();
  });

  it('caps token refill at the limit', () => {
    const ip = `rl-cap-${Date.now()}`;
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Use 1 of 3 tokens
    expect(rateLimit(ip, 3, 1_000)).toBe(true);

    // Advance past 5 intervals — should still cap at 3
    vi.spyOn(Date, 'now').mockReturnValue(now + 5_001);
    // 4 requests should succeed (refills to 3 after first consume)
    expect(rateLimit(ip, 3, 1_000)).toBe(true);
    expect(rateLimit(ip, 3, 1_000)).toBe(true);
    expect(rateLimit(ip, 3, 1_000)).toBe(true);
    expect(rateLimit(ip, 3, 1_000)).toBe(false);

    vi.restoreAllMocks();
  });

  it('uses default limit and interval when not provided', () => {
    const ip = `rl-default-${Date.now()}`;
    // Default is 60 tokens / 60s — should not reject in a few calls
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(ip)).toBe(true);
    }
  });
});
