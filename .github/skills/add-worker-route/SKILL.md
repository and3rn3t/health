---
name: add-worker-route
description: "Add a new Hono API route to the Cloudflare Worker. Use when creating new API endpoints, WebSocket handlers, or server-side functionality. Includes route, validation, auth, and testing scaffolding."
---

# Add Worker Route

## When to Use
- Create a new API endpoint under `/api/*`
- Add a new WebSocket message handler
- Extend Worker functionality with a new domain

## Procedure

### 1. Create Route File
Create `src/worker/routes/<domain>.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Define request schema
const RequestSchema = z.object({
  // ...fields
});

app.post('/<endpoint>', async (c) => {
  const body = await c.req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }
  // Business logic using c.env for bindings
  return c.json({ data: result }, 200);
});

export default app;
```

### 2. Register Route
In `src/worker.ts`, mount the new route:
```typescript
import domainRoutes from './worker/routes/<domain>';
app.route('/api/<domain>', domainRoutes);
```

### 3. Add Zod Schema
If the route handles health data, add schemas to `src/schemas/health.ts`.
Export both schema and inferred type.

### 4. Add Auth (if protected)
Use the auth middleware from `src/worker/middleware.ts` for protected routes.

### 5. Test
- Test locally: `pnpm run cf:dev`
- Write unit tests for the route handler
- Verify with curl/Postman against `http://localhost:8789/api/<domain>`

## Checklist
- [ ] Zod validation on all inputs
- [ ] Auth middleware on protected routes
- [ ] Error responses use proper HTTP status codes
- [ ] No Node APIs used (Workers-safe only)
- [ ] No PII in error responses or logs
- [ ] Rate limiting considered for mutation endpoints
