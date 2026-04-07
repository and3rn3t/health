---
description: 'Generate synthetic health data for testing VitalSense scoring algorithms, chart visualizations, and edge cases. Use when writing tests that need realistic health metric fixtures.'
---

Generate synthetic health data fixtures for testing. Follow existing fixture patterns in `fixtures/` and inline test data conventions.

## Data Types Available

Reference schemas in `src/schemas/health.ts` for exact shapes.

### Gait Metrics
```typescript
{
  cadence: number;          // steps/min, typical: 90-130
  stepLength: number;       // meters, typical: 0.5-0.9
  walkingSpeed: number;     // m/s, typical: 0.8-1.6
  asymmetry: number;        // %, typical: 0-15
  doubleSupportTime: number; // ms, typical: 200-400
  capturedAt: string;       // ISO 8601 timestamp
  userId?: string;
}
```

### Fall Risk
```typescript
{
  score: number;            // 0-1, threshold: 0.75
  balanceScore: number;     // 0-100
  gaitScore: number;        // 0-100
  environmentRisk: number;  // 0-100
  timestamp: string;
}
```

### Live Balance
```typescript
{
  progress: number;         // 0-100
  stability: number;        // 0-1
  duration: number;         // seconds
  exerciseType: string;     // "single-leg", "tandem", etc.
}
```

## Generation Strategies

1. **Normal range**: Generate data within typical healthy ranges
2. **Edge cases**: Values at exact thresholds (e.g., fall risk score = 0.75)
3. **Out-of-range**: Invalid/extreme values for validation testing
4. **Time series**: Sequential timestamps with realistic trends (gradual improvement, sudden decline)
5. **Missing fields**: Partial data for optional field handling
6. **Boundary values**: Min/max of zod schema constraints (0, negative, very large)

## Output Options

- **Inline fixtures**: `const mockData = [...]` for unit tests
- **Fixture files**: `fixtures/<name>.json` for shared test data
- **Factory functions**: `createMockGaitData(overrides)` for parameterized tests
- **Time series generators**: `generateTimeSeries(count, trendDirection)` for chart tests

## Guidelines
- Use deterministic values (no `Math.random()` in fixtures — use seeded generators if randomness needed)
- Include edge cases that have caused bugs: zero values, negative timestamps, Unicode in string fields
- Match zod schema exactly — the fixtures should pass schema validation
- Generate enough data points for chart testing (50-100 for time series)
- Never use real patient data or PII — all synthetic
