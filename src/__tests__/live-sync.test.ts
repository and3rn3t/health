import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LiveHealthDataSync,
  type LiveHealthMetric,
} from '../lib/liveHealthDataSync';

class MockWebSocket {
  static lastInstance: MockWebSocket | null = null;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  sent: string[] = [];
  url: string;
  static OPEN = 1;
  constructor(url: string) {
    this.url = url;
    MockWebSocket.lastInstance = this;
    // open automatically
    queueMicrotask(() => this.onopen && this.onopen());
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    if (this.onclose) this.onclose();
  }
}

describe('LiveHealthDataSync (WebSocket client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    const g = globalThis as unknown as { WebSocket: unknown };
    g.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });
  afterEach(() => {
    vi.useRealTimers();
    const g = globalThis as unknown as { WebSocket?: unknown };
    delete g.WebSocket;
  });

  it('connects, identifies client, and sends heartbeat pings', async () => {
    const sync = new LiveHealthDataSync('user-1', {
      heartbeatInterval: 100,
      reconnectAttempts: 0,
    });
    const ok = await sync.connect();
    expect(ok).toBe(true);
    const ws = MockWebSocket.lastInstance!;
    // First message should be client_identification
    expect(ws.sent.some((s) => s.includes('client_identification'))).toBe(true);
    // Advance timers to trigger heartbeat ping
    vi.advanceTimersByTime(100);
    expect(ws.sent.some((s) => s.includes('"type":"ping"'))).toBe(true);
  });

  it('delivers live updates to subscribers and respects filters', async () => {
    const sync = new LiveHealthDataSync('user-1', {
      heartbeatInterval: 1,
      reconnectAttempts: 0,
    });
    await sync.connect();
    const ws = MockWebSocket.lastInstance!;
    const received: LiveHealthMetric[] = [];
    sync.subscribe({
      id: 's1',
      metricTypes: ['heart_rate'],
      callback: (d) => received.push(d),
      filters: { deviceId: 'watch-1', minConfidence: 0.8 },
    });
    // Simulate server message (valid Mail)
    const payload: LiveHealthMetric = {
      timestamp: new Date().toISOString(),
      metricType: 'heart_rate',
      value: 70,
      unit: 'bpm',
      deviceId: 'watch-1',
      confidence: 0.85,
      source: 'apple_watch',
    };
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'live_health_update',
        data: payload,
        timestamp: new Date().toISOString(),
      }),
    });
    expect(received.length).toBe(1);
    // Filtered out: wrong device
    const wrongDevice = { ...payload, deviceId: 'watch-2' };
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'live_health_update',
        data: wrongDevice,
        timestamp: new Date().toISOString(),
      }),
    });
    expect(received.length).toBe(1);
    // Filtered out: low confidence
    const lowConf = { ...payload, confidence: 0.5 };
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'live_health_update',
        data: lowConf,
        timestamp: new Date().toISOString(),
      }),
    });
    expect(received.length).toBe(1);
  });

  it('attempts reconnect with backoff when connection closes', async () => {
    const sync = new LiveHealthDataSync('user-1', {
      reconnectAttempts: 2,
      heartbeatInterval: 100,
      connectionTimeout: 100,
    });
    await sync.connect();
    const ws = MockWebSocket.lastInstance!;
    // Close connection -> attempt reconnect scheduled
    ws.close();
    const status1 = sync.getConnectionStatus();
    expect(status1.connected).toBe(false);
    expect(status1.reconnectAttempts).toBe(1);
    // Fast-forward timers to trigger reconnect attempt #2 as well
    vi.advanceTimersToNextTimer();
    const status2 = sync.getConnectionStatus();
    expect(status2.reconnectAttempts).toBeGreaterThanOrEqual(1);
  });
});
