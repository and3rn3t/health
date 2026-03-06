# Performance & LiDAR Metrics Schema

Unified Analytics Engine doubles array (index-based contract) used by both RUM (`/api/_perf_ingest`) and LiDAR ingestion (`/api/lidar/ingest`).

| Index | Field                      | Source                | Notes |
|-------|----------------------------|-----------------------|-------|
| 0     | lcp                        | RUM (Largest Contentful Paint) | `-1` placeholder for LiDAR events |
| 1     | ttfb                       | RUM (Time To First Byte)       | `-1` placeholder for LiDAR events |
| 2     | hydration                  | RUM (App hydration duration)   | `-1` placeholder for LiDAR events |
| 3     | wsConnect                  | RUM (WebSocket connect ms)     | `-1` placeholder for LiDAR events |
| 4     | lidarIngestInterval        | LiDAR ingest batch span (last.ts - first.ts) | `-1` placeholder for RUM events; spans frames in single POST |
| 5     | lidarObstacleDistanceMin   | LiDAR `obstacle_distance_min` from last frame | `-1` placeholder for RUM events |

## Emission Rules

- RUM endpoint always writes a 6-length doubles array with indexes 4–5 set to `-1`.
- LiDAR endpoint writes a 6-length array with indexes 0–3 set to `-1` to avoid polluting core web perf distributions.
- Missing/invalid numeric values are normalized to `-1`.

## Rollup & Evaluation

`scripts/node/analysis/perf-rollup.js` selects the six doubles into named columns. New buckets were added:

- `lidarIngestInterval` (percentiles used: p95)
- `lidarObstacleDistanceMin` (percentiles used: p90)

`scripts/node/analysis/perf-eval.js` compares:

- `lidarIngestInterval` p95 against `slo.config.json` key `lidarIngestIntervalP95Ms`
- `lidarObstacleDistanceMin` p90 against `slo.config.json` key `lidarObstacleDistanceMinP90`

## Backward Compatibility

Older rows (before schema extension) may have only 4 doubles. The rollup script defensively slices and maps numbers; missing indexes appear as `NaN` and are filtered out before percentile calculations.

## Future Extensions

If additional sensor domains are added:

1. Append new indexes at the end (do not reshuffle existing order).
2. Update this document, rollup parser slice length, and evaluation mapping.
3. Leave placeholders (`-1`) for events that do not provide the new metrics to keep array length consistent.

## Rationale

- Keeps a single dataset for lightweight percentile scans (simpler than multi-dataset joins).
- Placeholder approach prevents skew from mixing unrelated metric domains while preserving fixed positional contract.
- Negative sentinel `-1` chosen (instead of 0) so distribution filters can `> -0.5` safely.

## Validation Guardrails

Recommended lightweight tests (future):

- A contract test asserting RUM emission length === 6 (mock dataset writer).
- A LiDAR ingest test asserting emission length === 6 with indexes 0–3 === -1 given a multi-frame batch.

---
_Last updated: 2025-09-24_
