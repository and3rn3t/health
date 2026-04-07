---
description: 'Generate Vitest tests for a React hook, including async behavior, cleanup, WebSocket mocking, and edge cases. Use when testing custom hooks in src/hooks/.'
---

Generate comprehensive Vitest tests for the provided React hook. Follow patterns from existing VitalSense hook tests.

## Setup

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

## Required Test Cases

### State & Lifecycle
- **Initial state**: Verify default returned values match expected defaults
- **State transitions**: Trigger actions (via `act()`), verify state changes
- **Cleanup**: Verify listeners/timers/subscriptions are removed on unmount
- **Re-render stability**: Verify memoized values don't change on re-render with same inputs

### Async Behavior
- **Loading states**: Verify `isLoading` / pending state during async operations
- **Success path**: Mock fetch/API, verify data populates correctly
- **Error handling**: Mock rejections, verify error state
- **Abort/cancel**: Verify AbortController cleanup on unmount during pending requests

### WebSocket Hooks (if applicable)
Mock WebSocket constructor and instances:
```typescript
const mockWs = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};
vi.stubGlobal('WebSocket', vi.fn(() => mockWs));
```
Test: connection, reconnection with backoff, message parsing with zod, heartbeat/ping, disconnect cleanup.

### Auth Hooks (if applicable)
Mock Auth0 client:
```typescript
vi.mock('@auth0/auth0-spa-js', () => ({
  Auth0Client: vi.fn().mockImplementation(() => ({
    getTokenSilently: vi.fn().mockResolvedValue('mock-token'),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
  })),
}));
```

## Patterns
- Use `renderHook(() => useHookName(args))` — not wrapped in a component
- Wrap state updates in `act()` or use `waitFor()` for async assertions
- Use `result.current` to access hook return values
- Test with different input combinations via parameterized tests
- Verify `vi.fn()` call counts for side effects (fetch, WebSocket.send, etc.)
- Always `afterEach(() => vi.restoreAllMocks())`

## Output
Place test file at `src/hooks/<hookName>.test.ts` (colocated with the hook).
