# Copilot Prompt Recipes

Use these prompts to get high-quality, stack-aligned help from Copilot Chat.

## React Query + zod

- "Create a React Query hook for GET /api/health-data with zod validation and loading/error UI using our Button and Alert components."

## WebSocket client utility

- "Add a WebSocket client that connects to ws://localhost:3001, validates envelopes with messageEnvelopeSchema, and exposes subscribe(type, handler). Include reconnect with backoff and ping/pong."

## Hono route with validation

- "Add a Hono POST /api/health-data route that validates against processedHealthDataSchema, writes to KV if available, and returns the stored record with a 201."

## UI: Tailwind + Radix

- "Build a compact card list to display recent health alerts. Use our tokens, Tailwind utilities, and existing ui primitives."

## Type-safe refactor

- "Refactor src/lib/liveHealthDataSync.ts to use the zod schemas for parsing incoming WS messages and narrow types across the pipeline."
