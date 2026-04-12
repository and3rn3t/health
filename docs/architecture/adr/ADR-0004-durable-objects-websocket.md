# ADR-0004: Durable Objects for WebSocket State

## Status
Accepted

## Date
2025-07-20

## Context
VitalSense streams real-time health data from iOS devices to the web dashboard via WebSocket. Requirements:
- Authenticated, persistent WebSocket connections
- Per-user session state (connection metadata, last heartbeat, active subscriptions)
- Graceful handling of reconnections without data loss
- Rate limiting on POST endpoints

## Decision
Use **Cloudflare Durable Objects** for WebSocket connection management and rate limiting.

### Architecture
- `HealthWebSocket` DO: Manages authenticated WebSocket sessions. Each user gets a unique DO instance via `idFromName(userId)`. Handles connection upgrade, heartbeat, message routing, and session cleanup.
- `RateLimiter` DO: Sliding window rate limiting for POST endpoints, keyed by IP + path.

### Key Reasons
1. **Single-instance guarantee**: Each DO runs in exactly one location, eliminating distributed state coordination for per-user WebSocket sessions.
2. **Hibernation API**: WebSocket connections survive Worker restarts. DO can hibernate between messages, reducing cost for idle connections.
3. **Transactional storage**: DO storage provides strongly consistent reads/writes within a single instance — perfect for session state.
4. **Co-location**: DO auto-migrates to be near the user, minimizing WebSocket latency.

## Consequences
- **Single-leader bottleneck**: All requests for a user route to one DO instance. Not suitable for fan-out broadcasting (use DO → KV for that).
- **Cold start on first access**: ~50ms for DO activation. Mitigated by hibernation API keeping existing connections alive.
- **Debugging complexity**: DO state is opaque from outside. Added `/api/diagnostics` route for operational visibility.
- **Migration required**: Schema changes to DO storage require migration declarations in `wrangler.toml`.

## Alternatives Rejected
- **Redis (Upstash)**: External dependency, adds latency, doesn't integrate with Workers hibernation API.
- **Supabase Realtime**: Additional service to manage, PostgreSQL dependency, not edge-native.
- **Workers KV for sessions**: Eventually consistent — unacceptable for WebSocket state where messages must be ordered.
