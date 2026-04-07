---
description: 'Debug a Cloudflare Worker issue by tracing request flow through Hono middleware, checking bindings, inspecting Durable Object state, and analyzing logs.'
agent: 'worker-specialist'
---

Debug the described Cloudflare Worker issue systematically:

1. **Identify the route**: Locate the Hono handler in `src/worker/routes/` that processes the request
2. **Trace middleware**: Check `src/worker/middleware.ts` — auth, CORS, logging. Verify the request passes through correctly
3. **Check bindings**: Verify KV, R2, Durable Object, and Analytics Engine bindings in `wrangler.toml` match what the route expects via `c.env`
4. **Validate schemas**: Confirm zod schemas in `src/schemas/health.ts` match the actual request/response shapes
5. **Inspect Durable Objects**: Check `HealthWebSocket` or `RateLimiter` DO state if relevant
6. **Review error handling**: Verify proper HTTP status codes and error responses
7. **Check environment**: Compare `[env.development]` vs `[env.production]` in `wrangler.toml` for config mismatches

Provide:
- Root cause analysis
- Specific file and line references
- Suggested fix with code
- Verification steps (`pnpm run cf:dev` + curl commands to test)
