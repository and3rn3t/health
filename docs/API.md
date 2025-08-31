# API Overview

The Cloudflare Worker exposes lightweight, edge-friendly APIs using Hono. All request bodies and query params are validated with zod.

## Base URL

- Dev: `http://localhost:8787` (Wrangler)
- Prod: Workers domain for your account/env

## Routes

### GET `/health`

- Returns a basic health payload for monitoring.
- Response: `{ status: 'healthy', timestamp, environment }`

### GET `/api/health-data`

- Lists recent processed health records from KV, optionally filtered.
- Query params (all optional):
  - `metric`: one of `heart_rate | steps | walking_steadiness | oxygen_saturation | sleep | activity | fall_event`
  - `from`, `to`: ISO timestamp bounds; applied to `processedAt`
  - `limit`: 1..500 (default 100)
  - `cursor`: opaque continuation token for pagination
- Response (backwards-compatible):
  - `{ ok: true, data: ProcessedHealthData[], nextCursor?: string, hasMore?: boolean }`
  - Clients written before pagination can keep using `data` and ignore the extra fields.
- Notes:
  - Results are sorted by `processedAt` descending.
  - If app-level encryption is enabled (ENV `ENC_KEY`), values are decrypted on read.

### POST `/api/health-data`

- Stores a processed health record in KV with a retention TTL.
- Body: `ProcessedHealthData` (see `src/schemas/health.ts` / `processedHealthDataSchema`).
- Behavior:
  - Encrypts at application layer with AES-GCM if `ENC_KEY` is configured.
  - Sets `expirationTtl` based on record type and environment (see Retention below).
  - Emits an audit line to R2 when available.
- Response: `{ ok: true, data: ProcessedHealthData }` with status 201.

### Dev/ops endpoints

- `GET /api/_audit` (dev only): List recent audit objects; optional `withBodies=1`.
- `GET /api/_ratelimit` (dev only): Probe remaining tokens for a key.
- `POST /api/_purge` (dev only): Trigger retention purge scan; supports `limit` and `prefix`.

## Security and Auth

- Strict security headers and CORS are applied globally. Allowed origins via `ALLOWED_ORIGINS`.
- Auth is enforced in production via `Authorization: Bearer` with either JWKS (`API_JWKS_URL`) or local claims verification (`API_ISS`, `API_AUD`).
- Rate limiting is applied per user or IP (Durable Object-backed when bound).
- Do not log raw health data; audit logs contain metadata only.

## Retention

- TTL is derived per record type (see `docs/RETENTION_POLICY.md`). Non-prod TTLs are capped at 2 days.
- Scheduled purge (cron) scans KV and deletes expired keys. A dev-only `/api/_purge` endpoint is also provided.

## Error handling

- 400 on zod parse failure with `{ error: 'validation_error', details }`.
- 401 on missing/invalid auth in production.
- 429 on rate limiting.
- 5xx for unexpected errors with `{ error: 'server_error' }`.

Refer to `src/worker.ts` for implementation details.
