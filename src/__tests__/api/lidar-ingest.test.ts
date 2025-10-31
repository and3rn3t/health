import { app } from '@/worker';
import { describe, expect, it } from 'vitest';

describe('LiDAR ingest API', () => {
  it('rejects empty payload', async () => {
    const res = await app.request('/api/lidar/ingest', {
      method: 'POST',
      body: JSON.stringify({ frames: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('accepts minimal valid frame batch', async () => {
    const res = await app.request('/api/lidar/ingest', {
      method: 'POST',
      body: JSON.stringify({
        frames: [{ obstacle_distance_min: 1.2, surface_roughness: 0.4 }],
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; frames: number };
    expect(json.ok).toBe(true);
    expect(json.frames).toBe(1);
  });
});
