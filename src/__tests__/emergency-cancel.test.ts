import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveHealthDataSync } from '@/lib/liveHealthDataSync';

let lastMockWS: MockWebSocket | null = null;
function setLastMockWS(ws: MockWebSocket) {
  lastMockWS = ws;
}
class MockWebSocket {
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  sent: string[] = [];
  url: string;
  static readonly OPEN = 1;
  constructor(url: string) {
    this.url = url;
    setLastMockWS(this);
    queueMicrotask(() => this.onopen && this.onopen());
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    if (this.onclose) this.onclose();
  }
}

// Minimal CustomEvent polyfill for Node environment
class NodeCustomEvent<T = unknown> extends Event {
  detail: T;
  constructor(type: string, init?: { detail?: T }) {
    super(type);
    this.detail = (init && init.detail) as T;
  }
}

describe('Emergency pending/cancel flow', () => {
  let originalWindow: (Window & typeof globalThis) | undefined;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    type G = typeof globalThis & {
      WebSocket?: unknown;
      window?: Window & typeof globalThis;
      CustomEvent?: typeof CustomEvent;
    };
    const g = globalThis as G;
    // Mock WebSocket
    g.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    // Provide a minimal window with EventTarget and CustomEvent
    originalWindow = g.window;
    const eventTarget = new (class extends EventTarget {})();
    g.window = eventTarget as unknown as Window & typeof globalThis;
    g.CustomEvent = NodeCustomEvent as unknown as typeof CustomEvent;
  });

  afterEach(() => {
    vi.useRealTimers();
    type G = typeof globalThis & {
      WebSocket?: unknown;
      window?: Window & typeof globalThis;
      CustomEvent?: typeof CustomEvent;
    };
    const g = globalThis as G;
    // Optional deletes with guards
    if ('WebSocket' in g) {
      delete (g as { WebSocket?: unknown }).WebSocket;
    }
    g.window = originalWindow!;
    if ('CustomEvent' in g) {
      delete (g as { CustomEvent?: typeof CustomEvent }).CustomEvent;
    }
  });

  it('sends an emergency after the cancel window elapses', async () => {
    const sync = new LiveHealthDataSync('user-1', {
      reconnectAttempts: 0,
      heartbeatInterval: 10_000,
      connectionTimeout: 100,
    });
    const ok = await sync.connect();
    expect(ok).toBe(true);
    const ws = lastMockWS!;

    const events: string[] = [];
    window.addEventListener('emergency-pending', () => events.push('pending'));
    window.addEventListener('emergency-sent', () => events.push('sent'));

    sync.triggerEmergency({ kind: 'manual' }, 1000);
    // Should have queued pending event immediately
    expect(events).toContain('pending');

    // Advance time to fire send
    vi.advanceTimersByTime(1000);

    // Verify message was sent
    expect(ws.sent.some((s) => s.includes('"type":"emergency_alert"'))).toBe(
      true
    );
    expect(events).toContain('sent');
  });

  it('cancels a pending emergency and prevents sending', async () => {
    const sync = new LiveHealthDataSync('user-1', {
      reconnectAttempts: 0,
      heartbeatInterval: 10_000,
      connectionTimeout: 100,
    });
    const ok = await sync.connect();
    expect(ok).toBe(true);
    const ws = lastMockWS!;

    const events: string[] = [];
    window.addEventListener('emergency-pending', () => events.push('pending'));
    window.addEventListener('emergency-cancelled', () =>
      events.push('cancelled')
    );

    sync.triggerEmergency({ kind: 'manual' }, 1000);
    expect(events).toContain('pending');

    // Cancel before the window elapses
    sync.cancelPendingEmergency();

    // Advance time beyond the original window
    vi.advanceTimersByTime(1500);

    // Ensure no emergency_alert was sent
    expect(ws.sent.some((s) => s.includes('"type":"emergency_alert"'))).toBe(
      false
    );
    expect(events).toContain('cancelled');
  });
});
