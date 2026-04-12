import { describe, expect, it } from 'vitest';
import { invoke } from '../harness/honoTestHarness';
import { buildWorkerEnv } from '@/test/factories';

const env = buildWorkerEnv();

describe('LiDAR ingest API', () => {
  it('rejects empty payload', async () => {
    const { res } = await invoke('/api/lidar/ingest', {
      method: 'POST',
      json: { frames: [] },
      env,
    });
    expect(res.status).toBe(400);
  });

  it('accepts minimal valid frame batch', async () => {
    const { res, json } = await invoke<{ ok: boolean; frames: number }>(
      '/api/lidar/ingest',
      {
        method: 'POST',
        json: {
          frames: [{ obstacle_distance_min: 1.2, surface_roughness: 0.4 }],
        },
        asJson: true,
        env,
      }
    );
    expect(res.status).toBe(200);
    expect(json?.ok).toBe(true);
    expect(json?.frames).toBe(1);
  });
});
