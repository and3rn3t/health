---
description: 'Generate a comprehensive Vitest test suite for a Cloudflare Worker route, covering all HTTP status codes (200, 400, 401, 403, 429, 500), auth, validation, and rate limiting.'
agent: 'worker-specialist'
---

Generate a complete Vitest test suite for the provided Worker route. Follow the existing test patterns in `src/__tests__/worker-*.test.ts`.

## Setup Pattern

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../worker';

const ASSETS_404 = {
  fetch: async (_req: Request) => new Response('not found', { status: 404 }),
};

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'https://allowed.test',
    ASSETS: ASSETS_404,
    ...overrides,
  };
}
```

## Required Test Cases

For each endpoint in the route file, generate tests covering:

1. **200 OK** — Valid request with correct auth, body, and bindings
2. **400 Bad Request** — Invalid JSON body, missing required fields, zod validation failure
3. **401 Unauthorized** — Missing `Authorization` header, invalid/expired JWT
4. **403 Forbidden** — Valid auth but insufficient permissions (if applicable)
5. **429 Rate Limited** — Rate limiter DO returns rejection
6. **500 Internal Error** — KV/R2 binding failures, unexpected exceptions

## Patterns to Follow

- Use `app.fetch(new Request(url, options), makeEnv())` to invoke routes
- Mock KV bindings: `{ get: vi.fn(), put: vi.fn(), list: vi.fn(), delete: vi.fn() }`
- Mock Durable Objects: `{ get: vi.fn().mockReturnValue({ fetch: vi.fn() }) }`
- Auth header: `Authorization: Bearer test-token` with mocked JWKS verification
- Verify response status AND response body structure
- Group tests by endpoint with `describe` blocks
- Use `beforeEach(() => vi.restoreAllMocks())` for isolation

## Output

Place the test file at `src/__tests__/worker-<route-name>.test.ts`.
