import { NormalizedLidarFrame, RawLidarFrame } from './types';

// Hard bounds to defend against sensor glitches / malicious payloads
const BOUNDS: Record<string, [number, number]> = {
  obstacle_distance_min: [0, 10], // meters
  lateral_deviation_mean: [0, 3], // meters
  stride_length_var: [0, 2], // m variance approx
  surface_roughness: [0, 5], // dimensionless derived index
  elevation_change_rate: [0, 5], // m/s vertical change rate
  processing_latency_ms: [0, 5_000],
};

function clamp(metric: string, val: unknown): number | undefined {
  if (typeof val !== 'number' || !Number.isFinite(val)) return undefined;
  const b = BOUNDS[metric];
  if (!b) return undefined;
  if (val < b[0] || val > b[1]) return undefined; // drop extreme outliers instead of clipping for integrity
  return Number(val);
}

export function normalizeRawFrame(
  raw: RawLidarFrame,
  now = Date.now()
): NormalizedLidarFrame | null {
  try {
    const tsRaw = raw.ts;
    let ts: number;
    if (typeof tsRaw === 'number') ts = tsRaw;
    else if (typeof tsRaw === 'string') {
      const parsed = Date.parse(tsRaw);
      if (!Number.isFinite(parsed)) ts = now;
      else ts = parsed;
    } else ts = now;

    // Derive obstacle_distance_min if not supplied from obstaclePoints
    let obstacleMin = clamp('obstacle_distance_min', raw.obstacle_distance_min);
    if (
      obstacleMin === undefined &&
      Array.isArray(raw.obstaclePoints) &&
      raw.obstaclePoints.length
    ) {
      const distances = raw.obstaclePoints
        .map((p) => (p && typeof p.d === 'number' ? p.d : undefined))
        .filter(
          (d): d is number => typeof d === 'number' && Number.isFinite(d)
        );
      if (distances.length) {
        const candidate = Math.min(...distances);
        obstacleMin = clamp('obstacle_distance_min', candidate);
      }
    }

    const metrics: NormalizedLidarFrame['metrics'] = {};
    if (obstacleMin !== undefined) metrics.obstacle_distance_min = obstacleMin;
    const maybe = (
      k: keyof NormalizedLidarFrame['metrics'],
      rawKey: keyof RawLidarFrame
    ) => {
      const v = clamp(k as string, raw[rawKey]);
      if (v !== undefined) metrics[k] = v as never;
    };
    maybe('lateral_deviation_mean', 'lateral_deviation_mean');
    maybe('stride_length_var', 'stride_length_var');
    maybe('surface_roughness', 'surface_roughness');
    maybe('elevation_change_rate', 'elevation_change_rate');

    const processing_latency = clamp(
      'processing_latency_ms',
      raw.processing_latency_ms
    );
    const hazards = Array.isArray(raw.hazards)
      ? raw.hazards
          .filter(
            (h) =>
              h && typeof h.type === 'string' && typeof h.distance === 'number'
          )
          .slice(0, 10)
          .map((h) => ({
            type: h.type,
            distance: h.distance,
            bearing_deg:
              typeof h.bearing_deg === 'number' ? h.bearing_deg : undefined,
          }))
      : undefined;

    if (Object.keys(metrics).length === 0) return null; // nothing usable
    return {
      ts,
      metrics,
      hazards,
      processing_latency_ms: processing_latency,
    };
  } catch {
    return null;
  }
}

export function normalizeBatch(
  input: RawLidarFrame[] | unknown
): NormalizedLidarFrame[] {
  if (!Array.isArray(input)) return [];
  const out: NormalizedLidarFrame[] = [];
  for (const raw of input) {
    const norm = normalizeRawFrame(raw as RawLidarFrame);
    if (norm) out.push(norm);
    if (out.length >= 50) break; // soft cap per batch
  }
  return out;
}
