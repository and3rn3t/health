---
description: 'Generate API documentation from Hono Worker routes. Extracts endpoints, methods, request/response schemas, auth requirements, and rate limiting from route files in src/worker/routes/.'
agent: 'docs-writer'
---

Generate API documentation for the VitalSense Worker routes.

## Source Files
- Routes: `src/worker/routes/*.ts`
- Schemas: `src/schemas/health.ts`
- Middleware: `src/worker/middleware.ts`
- Types: `src/worker/types.ts`
- Existing docs: `docs/architecture/API.md`

## For Each Endpoint, Document

1. **Method + Path**: `POST /api/live/gait`
2. **Description**: One-line purpose
3. **Authentication**: Required (`Bearer <token>`) or public
4. **Rate Limiting**: Limit and window (from RateLimiter DO config)
5. **Request Body**: Zod schema fields with types, required/optional, constraints
6. **Response**: Success shape + status code
7. **Error Responses**: All possible error status codes with example bodies
8. **Example**:
   ```bash
   curl -X POST https://health.andernet.dev/api/live/gait \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"cadence": 120, "stepLength": 0.75, ...}'
   ```

## Output Format

Use Markdown tables and code blocks. Group endpoints by domain:
- Health Data (live, batch, analytics, KV)
- Auth
- Config
- Diagnostics
- Telemetry
- WebSocket

Update `docs/architecture/API.md` or create a new section if the file already exists.
