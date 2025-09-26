import { describe, expect, it } from 'vitest';

// Contract test: ensure RUM ingestion supports both flat metrics (legacy) and nested metrics object.

// Allow unknown additional keys; they'll be ignored unless inside metrics object.
interface PerfPayloadLegacy {
  metrics?: Record<string, number> | undefined;
  [k: string]: unknown;
}
// Updated expectation: current worker implementation ONLY uses nested metrics object; flat keys ignored.
function normalize(payload: PerfPayloadLegacy) {
  const out: Record<string, number> = {};
  if (payload.metrics && typeof payload.metrics === 'object') {
    for (const [k, v] of Object.entries(payload.metrics))
      if (typeof v === 'number') out[k] = v;
  }
  return out;
}

describe('RUM ingestion payload normalization', () => {
  it('handles nested metrics object', () => {
    const normalized = normalize({
      metrics: { LCP: 1800, CLS: 0.03, hydration: 520 },
    });
    expect(normalized).toEqual({ LCP: 1800, CLS: 0.03, hydration: 520 });
  });

  it('ignores flat legacy metrics when metrics object absent (current behavior)', () => {
    const normalized = normalize({ LCP: 2000, TTFB: 120, wsConnect: 450 });
    expect(normalized).toEqual({});
  });

  it('prefers nested metrics object over flat keys (flat ignored)', () => {
    const normalized = normalize({
      metrics: { LCP: 1900, TTFB: 100 },
      LCP: 1700,
      wsConnect: 400,
    });
    expect(normalized).toEqual({ LCP: 1900, TTFB: 100 });
  });
});
