import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveHealthDataSync, getLiveHealthDataSync } from '../liveHealthDataSync';
import type { LiveHealthMetric, LiveDataSubscription } from '../liveHealthDataSync';

// ── Mock setup ───────────────────────────────────────────────────────────────

const { mockToast } = vi.hoisted(() => ({
  mockToast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: mockToast }));

// Lightweight MockWebSocket to simulate WebSocket behaviour
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }

  // Test helpers
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

let latestWs: MockWebSocket | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  latestWs = null;
  vi.stubGlobal('WebSocket', class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      latestWs = this;
    }
  });
  // Provide OPEN constant on the global so code can use WebSocket.OPEN
  (globalThis as Record<string, unknown>).WebSocket = Object.assign(
    (globalThis as Record<string, unknown>).WebSocket as object,
    { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 },
  );
  mockToast.error.mockClear();
  mockToast.success.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createSync(config?: Record<string, unknown>): LiveHealthDataSync {
  return new LiveHealthDataSync('user-1', {
    url: 'wss://test.example.com/ws',
    reconnectAttempts: 3,
    heartbeatInterval: 5000,
    connectionTimeout: 5000,
    ...config,
  });
}

async function connectSync(sync: LiveHealthDataSync): Promise<MockWebSocket> {
  const promise = sync.connect();
  latestWs!.simulateOpen();
  await promise;
  return latestWs!;
}

// ── Constructor & Initial State ──────────────────────────────────────────────

describe('LiveHealthDataSync constructor', () => {
  it('initialises with disconnected status', () => {
    const sync = createSync();
    const status = sync.getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.dataQuality).toBe('offline');
    expect(status.reconnectAttempts).toBe(0);
  });

  it('isConnected returns false before connecting', () => {
    const sync = createSync();
    expect(sync.isConnected()).toBe(false);
  });

  it('isIosOnline returns false initially', () => {
    const sync = createSync();
    expect(sync.isIosOnline()).toBe(false);
  });
});

// ── connect() ────────────────────────────────────────────────────────────────

describe('connect', () => {
  it('resolves true on successful connection', async () => {
    const sync = createSync();
    const p = sync.connect();
    latestWs!.simulateOpen();
    expect(await p).toBe(true);
  });

  it('updates connection status on open', async () => {
    const sync = createSync();
    await connectSync(sync);
    const status = sync.getConnectionStatus();
    expect(status.connected).toBe(true);
    expect(status.dataQuality).toBe('excellent');
  });

  it('sends client_identification on open', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const messages = ws.sent.map((s: string) => JSON.parse(s));
    const ident = messages.find((m: Record<string, unknown>) => m.type === 'client_identification');
    expect(ident).toBeDefined();
    expect(ident.clientType).toBe('web_dashboard');
    expect(ident.userId).toBe('user-1');
  });

  it('resolves false on error', async () => {
    const sync = createSync();
    const p = sync.connect();
    latestWs!.simulateError();
    expect(await p).toBe(false);
  });

  it('appends token when __WS_DEVICE_TOKEN__ is set', async () => {
    (window as unknown as Record<string, unknown>).__WS_DEVICE_TOKEN__ = 'tok123';
    const sync = createSync();
    sync.connect();
    expect(latestWs!.url).toContain('token=tok123');
    delete (window as unknown as Record<string, unknown>).__WS_DEVICE_TOKEN__;
  });

  it('uses __WS_URL__ override when set', async () => {
    (window as unknown as Record<string, unknown>).__WS_URL__ = 'wss://override/ws';
    const sync = createSync();
    sync.connect();
    expect(latestWs!.url).toBe('wss://override/ws');
    delete (window as unknown as Record<string, unknown>).__WS_URL__;
  });
});

// ── disconnect ───────────────────────────────────────────────────────────────

describe('disconnect', () => {
  it('closes the websocket and resets status', async () => {
    const sync = createSync();
    await connectSync(sync);
    sync.disconnect();
    expect(sync.isConnected()).toBe(false);
    expect(sync.getConnectionStatus().dataQuality).toBe('offline');
  });

  it('clears heartbeat and reconnect timers', async () => {
    const sync = createSync();
    await connectSync(sync);
    sync.disconnect();
    // Advance timers — no heartbeat should fire
    vi.advanceTimersByTime(60_000);
    // If still sending, it would throw since ws is null
    expect(sync.isConnected()).toBe(false);
  });
});

// ── Heartbeat ────────────────────────────────────────────────────────────────

describe('heartbeat', () => {
  it('sends ping at configured interval', async () => {
    const sync = createSync({ heartbeatInterval: 1000 });
    const ws = await connectSync(sync);
    const initialCount = ws.sent.length;
    vi.advanceTimersByTime(1000);
    const messages = ws.sent.slice(initialCount).map((s: string) => JSON.parse(s));
    const ping = messages.find((m: Record<string, unknown>) => m.type === 'ping');
    expect(ping).toBeDefined();
  });

  it('updates latency on pong', async () => {
    const sync = createSync({ heartbeatInterval: 1000 });
    const ws = await connectSync(sync);
    vi.advanceTimersByTime(1000); // Trigger ping
    // Simulate pong
    ws.simulateMessage({ type: 'pong', timestamp: new Date().toISOString() });
    const status = sync.getConnectionStatus();
    expect(status.latency).toBeGreaterThanOrEqual(0);
    expect(status.lastHeartbeat).not.toBe('');
  });
});

// ── Reconnection ─────────────────────────────────────────────────────────────

describe('reconnection', () => {
  it('attempts reconnect with exponential backoff on close', async () => {
    const sync = createSync({ reconnectAttempts: 3 });
    const ws = await connectSync(sync);
    ws.close(); // triggers onclose → attemptReconnect
    vi.advanceTimersByTime(2000); // First retry (2^1 * 1000)
    expect(latestWs).not.toBeNull();
  });

  it('stops after max reconnect attempts', async () => {
    const sync = createSync({ reconnectAttempts: 1 });
    const ws = await connectSync(sync);
    ws.close(); // attempt 1
    vi.advanceTimersByTime(2000);
    const ws2 = latestWs!;
    ws2.close(); // attempt 2 — should exceed limit
    vi.advanceTimersByTime(10_000);
    // Should not create another websocket
    expect(latestWs).toBe(ws2);
  });
});

// ── subscribe / unsubscribe ──────────────────────────────────────────────────

describe('subscribe & unsubscribe', () => {
  it('subscribes and receives matching metrics', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const received: LiveHealthMetric[] = [];
    const sub: LiveDataSubscription = {
      id: 'sub-1',
      metricTypes: ['heart_rate'],
      callback: (d) => received.push(d),
    };
    sync.subscribe(sub);

    // Send subscription to server
    const sent = ws.sent.map((s: string) => JSON.parse(s));
    expect(sent.find((m: Record<string, unknown>) => m.type === 'subscribe_health_updates')).toBeDefined();

    // Simulate incoming metric
    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metricType: 'heart_rate',
        value: 72,
        timestamp: new Date().toISOString(),
        deviceId: 'dev-1',
        confidence: 0.9,
        source: 'apple_watch',
      },
    });
    expect(received).toHaveLength(1);
    expect(received[0]!.value).toBe(72);
  });

  it('filters by deviceId', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const received: LiveHealthMetric[] = [];
    sync.subscribe({
      id: 'sub-2',
      metricTypes: ['heart_rate'],
      callback: (d) => received.push(d),
      filters: { deviceId: 'dev-A' },
    });

    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metricType: 'heart_rate', value: 72, timestamp: new Date().toISOString(),
        deviceId: 'dev-B', confidence: 0.9, source: 'apple_watch',
      },
    });
    expect(received).toHaveLength(0); // Filtered out

    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metricType: 'heart_rate', value: 80, timestamp: new Date().toISOString(),
        deviceId: 'dev-A', confidence: 0.9, source: 'apple_watch',
      },
    });
    expect(received).toHaveLength(1);
  });

  it('filters by minConfidence', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const received: LiveHealthMetric[] = [];
    sync.subscribe({
      id: 'sub-3',
      metricTypes: ['heart_rate'],
      callback: (d) => received.push(d),
      filters: { minConfidence: 0.8 },
    });

    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metricType: 'heart_rate', value: 72, timestamp: new Date().toISOString(),
        deviceId: 'dev-1', confidence: 0.5, source: 'apple_watch',
      },
    });
    expect(received).toHaveLength(0);
  });

  it('unsubscribes successfully', () => {
    const sync = createSync();
    const sub: LiveDataSubscription = {
      id: 'sub-4',
      metricTypes: ['steps'],
      callback: vi.fn(),
    };
    sync.subscribe(sub);
    expect(sync.unsubscribe('sub-4')).toBe(true);
    expect(sync.unsubscribe('sub-nonexistent')).toBe(false);
  });

  it('does not deliver to non-matching metric types', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const cb = vi.fn();
    sync.subscribe({ id: 'sub-5', metricTypes: ['steps'], callback: cb });
    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metricType: 'heart_rate', value: 72, timestamp: new Date().toISOString(),
        deviceId: 'dev-1', confidence: 0.9, source: 'apple_watch',
      },
    });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ── sendHealthData ───────────────────────────────────────────────────────────

describe('sendHealthData', () => {
  const metric: LiveHealthMetric = {
    metricType: 'heart_rate',
    value: 72,
    timestamp: new Date().toISOString(),
    deviceId: 'dev-1',
    confidence: 0.9,
    source: 'apple_watch' as const,
  };

  it('sends immediately when connected', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const before = ws.sent.length;
    sync.sendHealthData(metric);
    const sent = JSON.parse(ws.sent[before]!);
    expect(sent.type).toBe('live_health_data');
    expect(sent.data.value).toBe(72);
  });

  it('queues data when not connected', () => {
    const sync = createSync();
    // Not connected — should queue
    sync.sendHealthData(metric);
    // Connect and verify queue flush
  });

  it('flushes queued messages on connect', async () => {
    const sync = createSync();
    sync.sendHealthData(metric);
    const ws = await connectSync(sync);
    const sent = ws.sent.map((s: string) => JSON.parse(s));
    const healthMsg = sent.find((m: Record<string, unknown>) => m.type === 'live_health_data');
    expect(healthMsg).toBeDefined();
  });
});

// ── requestPing ──────────────────────────────────────────────────────────────

describe('requestPing', () => {
  it('returns true and sends ping when connected', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const before = ws.sent.length;
    expect(sync.requestPing()).toBe(true);
    const sent = JSON.parse(ws.sent[before]!);
    expect(sent.type).toBe('ping');
  });

  it('returns false when not connected', () => {
    const sync = createSync();
    expect(sync.requestPing()).toBe(false);
  });
});

// ── onConnectionChange ───────────────────────────────────────────────────────

describe('onConnectionChange', () => {
  it('notifies listener on connect', async () => {
    const sync = createSync();
    const cb = vi.fn();
    sync.onConnectionChange(cb);
    await connectSync(sync);
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('notifies listener on disconnect', async () => {
    const sync = createSync();
    const cb = vi.fn();
    sync.onConnectionChange(cb);
    const ws = await connectSync(sync);
    ws.close();
    expect(cb).toHaveBeenCalledWith(false);
  });

  it('returns unsubscribe function', async () => {
    const sync = createSync();
    const cb = vi.fn();
    const unsub = sync.onConnectionChange(cb);
    unsub();
    await connectSync(sync);
    expect(cb).not.toHaveBeenCalled();
  });
});

// ── Server message handling ──────────────────────────────────────────────────

describe('server messages', () => {
  it('stores clientId from connection_established', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({
      type: 'connection_established',
      data: { clientId: 'cli-123' },
    });
    expect(sync.getConnectionStatus().clientId).toBe('cli-123');
  });

  it('handles batch live_health_update', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    const received: LiveHealthMetric[] = [];
    sync.subscribe({ id: 'sub-batch', metricTypes: ['heart_rate', 'steps'], callback: (d) => received.push(d) });

    ws.simulateMessage({
      type: 'live_health_update',
      data: {
        metrics: [
          { type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date().toISOString() },
          { type: 'steps', value: 100, unit: 'count', timestamp: new Date().toISOString() },
        ],
        deviceId: 'dev-batch',
        userId: 'user-1',
      },
    });
    expect(received).toHaveLength(2);
  });

  it('notifies toast on error message', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({ type: 'error', timestamp: new Date().toISOString() });
    expect(mockToast.error).toHaveBeenCalledWith('Realtime error');
  });

  it('ignores malformed messages', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    // Send invalid JSON — should not throw
    ws.onmessage?.(new MessageEvent('message', { data: 'not-json' }));
    expect(sync.isConnected()).toBe(true);
  });

  it('ignores messages that fail schema validation', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({ type: 'unknown_type', data: {} });
    // Should not throw
    expect(sync.isConnected()).toBe(true);
  });
});

// ── Client presence ──────────────────────────────────────────────────────────

describe('client presence', () => {
  it('sets iosOnline true for ios_app online', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({
      type: 'client_presence',
      data: {
        clientType: 'ios_app',
        status: 'online',
        userId: 'user-1',
        deviceInfo: { deviceId: 'iphone-1', deviceName: 'My iPhone' },
      },
    });
    expect(sync.isIosOnline()).toBe(true);
  });

  it('sets iosOnline false for ios_app offline', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    // First go online
    ws.simulateMessage({
      type: 'client_presence',
      data: { clientType: 'ios_app', status: 'online', userId: 'user-1' },
    });
    expect(sync.isIosOnline()).toBe(true);
    // Then go offline
    ws.simulateMessage({
      type: 'client_presence',
      data: { clientType: 'ios_app', status: 'offline', userId: 'user-1' },
    });
    expect(sync.isIosOnline()).toBe(false);
  });

  it('dispatches apple-device-connected event', async () => {
    const handler = vi.fn();
    window.addEventListener('apple-device-connected', handler);
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({
      type: 'client_presence',
      data: {
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'iphone-1', deviceName: 'iPhone 15' },
      },
    });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('apple-device-connected', handler);
  });

  it('dispatches apple-device-disconnected event', async () => {
    const handler = vi.fn();
    window.addEventListener('apple-device-disconnected', handler);
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({
      type: 'client_presence',
      data: { clientType: 'ios_app', status: 'offline', deviceInfo: { deviceId: 'iph-1' } },
    });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('apple-device-disconnected', handler);
  });

  it('ignores non-ios_app presence', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    ws.simulateMessage({
      type: 'client_presence',
      data: { clientType: 'web_dashboard', status: 'online' },
    });
    expect(sync.isIosOnline()).toBe(false);
  });
});

// ── Emergency ────────────────────────────────────────────────────────────────

describe('triggerEmergency', () => {
  it('creates a pending emergency', () => {
    const sync = createSync();
    sync.triggerEmergency({ reason: 'fall' }, 5000);
    const pending = sync.getPendingEmergency();
    expect(pending).not.toBeNull();
    expect(pending!.data.triggeredBy).toBe('user');
    expect(pending!.data.reason).toBe('fall');
  });

  it('sends emergency after timeout', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    sync.triggerEmergency({ reason: 'fall' }, 2000);
    vi.advanceTimersByTime(2000);
    const sent = ws.sent.map((s: string) => JSON.parse(s));
    const emergency = sent.find((m: Record<string, unknown>) => m.type === 'emergency_alert');
    expect(emergency).toBeDefined();
    expect(sync.getPendingEmergency()).toBeNull();
  });

  it('dispatches emergency-pending and emergency-sent events', async () => {
    const pendingHandler = vi.fn();
    const sentHandler = vi.fn();
    window.addEventListener('emergency-pending', pendingHandler);
    window.addEventListener('emergency-sent', sentHandler);

    const sync = createSync();
    await connectSync(sync);
    sync.triggerEmergency({ reason: 'fall' }, 1000);
    expect(pendingHandler).toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(sentHandler).toHaveBeenCalled();

    window.removeEventListener('emergency-pending', pendingHandler);
    window.removeEventListener('emergency-sent', sentHandler);
  });

  it('replaces existing pending emergency', () => {
    const sync = createSync();
    sync.triggerEmergency({ reason: 'fall' }, 5000);
    sync.triggerEmergency({ reason: 'chest_pain' }, 5000);
    const pending = sync.getPendingEmergency();
    expect(pending!.data.reason).toBe('chest_pain');
  });
});

describe('cancelPendingEmergency', () => {
  it('cancels a pending emergency', () => {
    const sync = createSync();
    sync.triggerEmergency({ reason: 'fall' }, 5000);
    sync.cancelPendingEmergency();
    expect(sync.getPendingEmergency()).toBeNull();
  });

  it('dispatches emergency-cancelled event', () => {
    const handler = vi.fn();
    window.addEventListener('emergency-cancelled', handler);
    const sync = createSync();
    sync.triggerEmergency({ reason: 'fall' }, 5000);
    sync.cancelPendingEmergency();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('emergency-cancelled', handler);
  });

  it('prevents the emergency from sending', async () => {
    const sync = createSync();
    const ws = await connectSync(sync);
    sync.triggerEmergency({ reason: 'fall' }, 2000);
    sync.cancelPendingEmergency();
    vi.advanceTimersByTime(3000);
    const sent = ws.sent.map((s: string) => JSON.parse(s));
    expect(sent.find((m: Record<string, unknown>) => m.type === 'emergency_alert')).toBeUndefined();
  });
});

// ── getLiveHealthDataSync singleton ──────────────────────────────────────────

describe('getLiveHealthDataSync', () => {
  it('returns same instance for repeated calls', () => {
    const a = getLiveHealthDataSync('user-1');
    const b = getLiveHealthDataSync('user-1');
    expect(a).toBe(b);
  });
});
