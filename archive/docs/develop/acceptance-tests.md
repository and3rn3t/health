### Acceptance test stubs (golden datasets)

Files:
- `fixtures/golden/ndvi_expected.json`
- `fixtures/golden/zonal_stats_expected.json`
- `fixtures/golden/dtm_expected.json`
- Tests: `src/__tests__/analysis.acceptance.test.ts`

How to run:
- `npm run test` or `npm run test:ui`
- The acceptance tests are currently skipped; unskip as implementations are added.

Guidance:
- Replace placeholders by wiring analysis functions to compute NDVI, zonal stats, and DTM.
- Assert against golden JSON values with tolerances (e.g., mean within ±0.01).
- Keep golden inputs versioned; update outputs only after review.
