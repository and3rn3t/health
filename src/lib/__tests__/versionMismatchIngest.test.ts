import { invoke } from '@/__tests__/harness/honoTestHarness';
import { describe, expect, it } from 'vitest';

describe('version mismatch client analytics ingestion', () => {
  it('accepts POST /api/client-analytics/version-mismatch', async () => {
    const payload = {
      gaitLocal: 'aaaa1111',
      gaitRemote: 'bbbb2222',
      fallLocal: 'cccc3333',
      fallRemote: 'dddd4444',
      ts: new Date().toISOString(),
    };
    const { res, json } = await invoke<{ ok: boolean }>(
      '/api/client-analytics/version-mismatch',
      { method: 'POST', json: payload, asJson: true }
    );
    expect(res.status).toBe(200);
    expect(json?.ok).toBe(true);
  });
});
