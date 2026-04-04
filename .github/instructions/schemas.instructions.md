---
description: "Use when creating or modifying zod schemas, data validation, health data types, WebSocket message types, or API request/response shapes."
applyTo: "src/schemas/**/*.ts"
---

# Schema & Validation Guidelines — VitalSense

## Core Principles
- All data boundaries validated with **zod** — WebSocket payloads, Worker bodies, query params.
- Canonical schemas live in `src/schemas/health.ts`.
- Fail closed: invalid data → reject (400 / drop message), never silently accept.

## Patterns
- Export both the schema and its inferred type: `export const FooSchema = z.object({...}); export type Foo = z.infer<typeof FooSchema>;`
- WebSocket envelopes: `{ type: string, data: unknown, timestamp: string }` — validate with discriminated union.
- Pagination: `{ data: T[], nextCursor?: string, hasMore?: boolean }`.
- Health data is sensitive — never include PII in schema error messages.

## Naming
- Schema: `PascalCaseSchema` (e.g., `HealthMetricSchema`).
- Type: `PascalCase` (e.g., `HealthMetric`).
- Keep schemas co-located with their domain when possible, or import from `src/schemas/`.
