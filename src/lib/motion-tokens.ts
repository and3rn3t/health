/**
 * Centralized motion / timing tokens.
 *
 * All animation durations, WebSocket timing, and toast durations
 * live here so they stay in sync across components, hooks, and Worker HTML.
 *
 * CSS counterparts are in main.css (--vs-motion-duration-*).
 */

// ─── UI Animation Durations (ms) ────────────────────────────────────────────
// Mirror the CSS custom properties in main.css:
//   --vs-motion-duration-fast: 120ms
//   --vs-motion-duration-base: 180ms

export const MOTION = {
  /** Micro-interactions: toggles, icon spins (120 ms) */
  fast: 120,
  /** Standard transitions: panels, dialogs (180 ms) */
  base: 180,
  /** Emphasis transitions: page changes, modals (300 ms) */
  slow: 300,
} as const;

// ─── Toast / Notification Durations (ms) ─────────────────────────────────────

export const TOAST_DURATION = {
  /** Default toast visibility */
  default: 5_000,
  /** Brief confirmation toasts */
  short: 3_000,
  /** Persistent warnings / errors */
  long: 8_000,
} as const;

// ─── WebSocket / Network Timing (ms) ─────────────────────────────────────────

export const WS_TIMING = {
  /** Delay before the first reconnect attempt */
  reconnectDelay: 2_000,
  /** Heartbeat / ping interval */
  pingInterval: 30_000,
  /** Give up connecting after this long */
  connectionTimeout: 10_000,
  /** Minimum gap between connection attempts (storm protection) */
  connectionThrottle: 5_000,
} as const;

// ─── API Timing (ms) ─────────────────────────────────────────────────────────

export const API_TIMING = {
  /** Default fetch timeout */
  timeout: 10_000,
} as const;
