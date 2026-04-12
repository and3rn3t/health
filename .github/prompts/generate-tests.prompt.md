---
description: 'Generate a comprehensive Vitest unit test file for a given component, hook, or utility. Follows VitalSense testing patterns with mocking, accessibility checks, and edge cases.'
---

Generate comprehensive Vitest unit tests for the provided code:

- Use `@testing-library/react` for component tests — query by role/label
- Use `renderHook` from `@testing-library/react` for hook tests
- Include happy path, edge cases, and error scenarios
- Mock external dependencies (fetch, WebSocket, HealthKit, KV)
- Use `vi.mock()` for module mocks, `vi.fn()` for function mocks
- Test accessibility attributes (ARIA labels, roles, keyboard navigation)
- Follow existing test patterns in `src/**/__tests__/`
- Use descriptive test names: `it('should display alert when fall risk exceeds threshold')`
- Group related tests with `describe` blocks
- Never test implementation details — test behavior and outcomes
