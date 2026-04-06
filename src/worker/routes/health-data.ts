/**
 * Barrel re-export for backward compatibility.
 *
 * The original monolithic health-data routes have been split into:
 *  - health-data-live.ts      (live gait/balance ingestion)
 *  - health-data-batch.ts     (single + batch processing)
 *  - health-data-analytics.ts (analytics & historical helpers)
 *  - health-data-kv.ts        (KV CRUD, legacy endpoints, Spark compat)
 *
 * Import the individual modules directly for new code.
 */
export { liveRoutes } from './health-data-live';
export { batchRoutes } from './health-data-batch';
export { analyticsRoutes } from './health-data-analytics';
export { kvRoutes } from './health-data-kv';
export { getHistoricalData, parseKVData } from './health-data-analytics';
