import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidWsUrl,
  isValidTtl,
  clampTtl,
  decodeJwtExp,
} from '../lib/wsSettings';
import { LiveHealthDataSync } from '../lib/liveHealthDataSync';

class MockWebSocket {
  static readonly last: MockWebSocket | null = null;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  sent: string[] = [];
  url: string;
  static readonly OPEN = 1;
  constructor(url: string) {
    this.url = url;
    (MockWebSocket as unknown as { last: MockWebSocket | null }).last = this;
    queueMicrotask(() => this.onopen && this.onopen());
  }
  send(data: string) {
    this.sent.push(data);
  }
}

describe('wsSettings helpers', () => {
  it('validates ws/wss URLs and TTL bounds', () => {
    expect(isValidWsUrl('ws://localhost:3001')).toBe(true);
    expect(isValidWsUrl('wss://example.com')).toBe(true);
    expect(isValidWsUrl('http://bad')).toBe(false);
    expect(isValidTtl(60)).toBe(true);
    expect(isValidTtl(59)).toBe(false);
    expect(clampTtl(10)).toBe(60);
    expect(clampTtl(5000)).toBe(3600);
  });

  it('decodes exp from JWT', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 600;
    const payload = btoa(JSON.stringify({ exp }));
    const token = `${header}.${payload}.sig`;
    expect(decodeJwtExp(token)).toBe(exp);
  });
});

describe('LiveHealthDataSync WS URL override', () => {
  beforeEach(() => {
    const g = globalThis as unknown as { WebSocket: unknown };
    g.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  it('uses window.__WS_URL__ when provided', async () => {
    // Provide a window object for the client to read override from
    (globalThis as unknown as { window?: { __WS_URL__?: string } }).window =
      (globalThis as unknown as { window?: { __WS_URL__?: string } }).window ||
      ({} as { __WS_URL__?: string });
    (
      globalThis as unknown as { window: { __WS_URL__?: string } }
    ).window.__WS_URL__ = 'ws://override:3002';
    const sync = new LiveHealthDataSync('u1', {});
    const ok = await sync.connect();
    expect(ok).toBe(true);
    expect(MockWebSocket.last?.url).toBe('ws://override:3002');
    // cleanup global hint
    delete (globalThis as unknown as { window: { __WS_URL__?: string } }).window
      .__WS_URL__;
  });
});
