# API Overview

The Cloudflare Worker exposes lightweight, edge-friendly APIs using Hono. All request bodies and query params should be validated with zod.

## Base URL

- In dev: `http://localhost:8787` (via Wrangler)
- In prod: your Workers domain

## Routes

- GET `/health`
  - Returns `{ ok: true, env: { ... } }` (non-sensitive subset).
- GET `/api/health-data`
  - Placeholder for time-series queries. Use query params `from`, `to`, `metric`.
- POST `/api/health-data`
  - Accepts a JSON body matching `processedHealthDataSchema`. Stores data in KV if bound.

## Error handling

- 400 on zod parse failure with `{ error: 'validation_error', details }`.
- 5xx for unexpected errors with `{ error: 'server_error' }`.

Refer to `src/worker.ts` for the actual implementation.
