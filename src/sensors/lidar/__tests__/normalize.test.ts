import { normalizeBatch, normalizeRawFrame } from '@/sensors/lidar/normalize';
import { describe, expect, it } from 'vitest';

describe('LiDAR normalization', () => {
  it('derives obstacle_distance_min from obstaclePoints when not provided', () => {
    const frame = normalizeRawFrame({
      obstaclePoints: [{ d: 2.1 }, { d: 1.4 }, { d: 3.2 }],
    });
    expect(frame?.metrics.obstacle_distance_min).toBe(1.4);
  });

  it('drops out-of-range metrics', () => {
    const frame = normalizeRawFrame({
      obstacle_distance_min: 99,
      surface_roughness: 0.5,
    });
    expect(frame?.metrics.obstacle_distance_min).toBeUndefined();
    expect(frame?.metrics.surface_roughness).toBe(0.5);
  });

  it('returns null if no usable metrics', () => {
    const frame = normalizeRawFrame({ obstacle_distance_min: 999 });
    expect(frame).toBeNull();
  });

  it('normalizes batch and enforces caps', () => {
    const batch = normalizeBatch([
      { obstacle_distance_min: 1.2 },
      { surface_roughness: 0.3 },
      { lateral_deviation_mean: 0.4 },
    ]);
    expect(batch.length).toBe(3);
  });
});
