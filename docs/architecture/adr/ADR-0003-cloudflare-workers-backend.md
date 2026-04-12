# ADR-0003: Cloudflare Workers as Backend Runtime

## Status
Accepted

## Date
2025-06-15

## Context
VitalSense needed a backend for API routes, static asset serving, WebSocket connections, and real-time health data streaming. Options considered:
- Traditional Node.js server (Express/Fastify) on a VPS or container host
- AWS Lambda + API Gateway
- Cloudflare Workers + Durable Objects

## Decision
Use **Cloudflare Workers** with the **Hono** framework as the backend runtime.

### Key Reasons
1. **Edge-first**: Workers execute at 300+ locations, minimizing latency for geographically distributed users (patients + caregivers).
2. **Zero cold starts**: V8 isolate architecture ensures sub-millisecond startup, critical for fall detection emergency alerts.
3. **Durable Objects**: Provide strongly consistent, single-instance coordination for WebSocket sessions — ideal for real-time health data streaming without external pub/sub.
4. **Integrated serving**: Worker serves both the React SPA (`dist/`) and API routes from a single deployment, simplifying infrastructure.
5. **Cost model**: Pay-per-request pricing is more efficient than always-on servers for a health monitoring app with bursty traffic patterns.
6. **Built-in KV/R2**: Serverless storage for health data and file uploads without managing databases.

## Consequences
- **No Node.js APIs**: Worker code is limited to Web APIs (Request, Response, fetch, crypto). This requires careful dependency selection.
- **Execution limits**: 30s CPU time (paid plan), 128MB memory. Health data processing must be chunked.
- **Vendor lock-in**: Durable Objects and Workers KV are Cloudflare-specific. Migration would require rewriting state management.
- **Testing complexity**: Need miniflare for local development and testing against Worker bindings.

## Alternatives Rejected
- **AWS Lambda**: Cold starts (100ms+) unacceptable for emergency alert paths. API Gateway adds complexity.
- **Node.js on Fly.io**: Better Node.js compatibility but higher operational overhead and no built-in Durable Objects equivalent.
