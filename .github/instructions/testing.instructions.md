---
description: "Use when writing or modifying tests, test utilities, test fixtures, or debugging test failures. Covers Vitest patterns, mocking, and test conventions."
applyTo: "src/**/*.test.{ts,tsx}"
---

# Testing Guidelines — VitalSense

## Framework
- **Vitest** with jsdom environment for web tests.
- Config: `vitest.config.ts` — colocated `*.test.ts(x)` + `__tests__/` discovery.
- Setup: `vitest.setup.ts` for global fixtures and mocks.

## Conventions
- Co-locate tests next to source: `Component.tsx` → `Component.test.tsx`.
- Shared test utilities in `src/test/`.
- Fixtures in `fixtures/` at project root.
- Descriptive test names: `it('should display alert when fall risk exceeds threshold')`.

## Patterns
- Use `@testing-library/react` for component tests — query by role/label, not implementation.
- Mock external dependencies (fetch, WebSocket, HealthKit) — never hit real APIs.
- Use `vi.mock()` for module mocks, `vi.fn()` for function mocks.
- Test zod schema validation at boundaries.

## What to Test
- Component rendering and user interactions.
- Hook behavior and state transitions.
- Zod schema parsing (valid and invalid inputs).
- Worker route handlers (request → response).
- Error boundary fallback rendering.

## Commands
- `pnpm test` — run all tests
- `pnpm test:ui` — Vitest UI dashboard
- `pnpm test:coverage` — coverage report
