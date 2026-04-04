---
description: "Use when creating or modifying React hooks, custom hooks, data fetching hooks, or WebSocket hooks."
applyTo: "src/hooks/**/*.ts"
---

# React Hooks Guidelines — VitalSense

## Conventions
- Always prefix with `use*`.
- One hook per file; named export matching the filename.
- Explicit return types — no implicit `any`.

## State Management
- `useKV` for lightweight client persistence (from `@github/spark/hooks`).
- `@tanstack/react-query` for server state — co-locate query keys with hooks.
- `useMemo` / `useCallback` for expensive computations or stable references.

## Existing Hooks (compose from these)
- `useAuth` — Auth0 authentication state
- `useCloudflareKV` — KV storage operations
- `useDeviceManagement` — connected device state
- `useLiveHealthData` — real-time health metrics
- `useWebSocket` — auto-reconnect WebSocket with backoff, heartbeat, zod guards
- `useThemeMode` — light/dark theme toggling
- `useMobile` — responsive breakpoint detection
- `useLiveRegion` — ARIA live region announcements
- `useErrorHandling` — error boundary integration
- `useOnceToast` — deduplicated toast notifications

## Testing
- Test hooks with `@testing-library/react` `renderHook`.
- Mock external dependencies (fetch, WebSocket, localStorage).
- Test cleanup/unmount behavior for subscriptions and timers.
