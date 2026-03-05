# Lessons Learned

This document captures project-level takeaways to guide future work.

## API and Data

- Start with simple list endpoints, but design for pagination early. Adding cursor support while preserving the original `data[]` shape minimized breakage.
- KV keys encode type and ISO timestamp. Sorting by `processedAt` server-side keeps results consistent even if KV listing order varies.
- App-layer encryption (AES-GCM) with a stable key (`ENC_KEY`) provides defense-in-depth on top of Workers’ storage encryption.
- TTLs must be applied at write time and reinforced by periodic purge to cover cases where TTL isn’t available or data format changes.

## Worker Runtime

- Prefer Hono and Web APIs; avoid Node-only modules. Keep `nodejs_compat` as a safety net, not a crutch.
- Durable Objects help with distributed rate limiting; fall back to in-memory in dev to keep iteration fast.
- Global middleware can affect response bodies in harnesses; tests should defensively handle empty bodies in rare paths.

## Validation and Types

- Use zod at boundaries (requests, query params, WS messages). Fail closed on parse errors.
- Keep Env bindings typed and narrow to catch missing KV/R2 methods at compile-time.

## UI and Hooks

- React Query infinite hooks map cleanly to cursor pagination; flatten pages in selectors or components.
- Keep skeletons and retry affordances simple; avoid flashing or reflow with stable heights.
- Co-locate query keys and schemas for better DX.

## Testing

- E2E tests around storage boundaries (KV/R2) are invaluable. Simulate encryption present/absent to cover both paths.
- Build before tests to catch type issues introduced by API changes.

## Ops and Security

- Don’t log PHI/PII; audits should contain metadata only (types, timestamps, correlation IDs).
- Document dev-only endpoints and guard them behind environment checks.

## What we’d do differently

- Introduce cursor pagination from day one to avoid UI pagination hacks.
- Define a shared client/server type for the paginated response to reduce drift.
