import { invoke } from '@/__tests__/harness/honoTestHarness';
import { describe, expect, it } from 'vitest';

// This test exercises the debug ring buffer inspection endpoint.
// It first posts a mismatch event, then fetches the debug endpoint
// and ensures at least one event is present with expected shape.

describe('version mismatch debug ring buffer', () => {
  it('captures mismatch event and exposes via debug endpoint (non-production)', async () => {
    const payload = {
      gaitLocal: 'loc1',
      gaitRemote: 'rem1',
      fallLocal: 'loc2',
      fallRemote: 'rem2',
      ts: new Date().toISOString(),
      sample: 1,
      seq: 1,
    };
    const post = await invoke<{ ok: boolean }>(
      '/api/client-analytics/version-mismatch',
      { method: 'POST', json: payload, asJson: true }
    );
    expect(post.res.status).toBe(200);
    expect(post.json?.ok).toBe(true);

    const dbg = await invoke<{ ok: boolean; events: unknown[] }>(
      '/api/_debug/version-mismatch-events',
      { asJson: true }
    );
    expect(dbg.res.status).toBe(200);
    expect(dbg.json?.ok).toBe(true);
    expect(Array.isArray(dbg.json?.events)).toBe(true);
    expect(dbg.json?.events.length).toBeGreaterThan(0);
    const last = dbg.json?.events[dbg.json?.events.length - 1];
    expect(last).toHaveProperty('gaitLocal');
    expect(last).toHaveProperty('fallLocal');
    expect(last).toHaveProperty('ts');
  });

  it('rejects invalid payload with no actual mismatch (same hashes)', async () => {
    const payload = {
      gaitLocal: 'same',
      gaitRemote: 'same',
      // no fall mismatch either
    };
    const post = await invoke<{ ok: boolean; error?: string }>(
      '/api/client-analytics/version-mismatch',
      { method: 'POST', json: payload, asJson: true }
    );
    expect(post.res.status).toBe(400);
    expect(post.json?.ok).toBe(false);
    expect(post.json?.error).toBe('invalid_payload');
  });

  it('exposes oldestEventAgeMs in diagnostics and it is non-negative', async () => {
    const diag = await invoke<{
      ok: boolean;
      analyticsVersionMismatch?: { oldestEventAgeMs?: number };
    }>('/api/_diagnostics', { asJson: true });
    expect(diag.res.status).toBe(200);
    expect(diag.json?.ok).toBe(true);
    const age = diag.json?.analyticsVersionMismatch?.oldestEventAgeMs;
    expect(typeof age).toBe('number');
    expect((age as number) >= 0).toBe(true);
  });
});
