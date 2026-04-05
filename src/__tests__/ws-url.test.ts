import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketClient } from '@/lib/websocketClient';

describe('WebSocketClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('resolves URL via /api/ws-url when not provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ url: 'wss://example/ws' }),
    }));
    // Stub WebSocket constructor to avoid real connections
    const wsOpenHandlers: ((ev: Event) => void)[] = [];
    class WSStub {
      readyState = 0;
      addEventListener(ev: string, cb: (ev: Event) => void) {
        if (ev === 'open') wsOpenHandlers.push(cb);
      }
      send() {}
      close() {}
    }
    vi.stubGlobal('WebSocket', WSStub as unknown as typeof WebSocket);
    const client = new WebSocketClient();
    const p = client.open();
    // trigger open
    for (const h of wsOpenHandlers) h(new Event('open'));
    await p;
    // The client may call /api/ws-telemetry first, then /api/ws-url
    // Check all fetch calls, not just the first one
    const fetchCalls = vi.mocked(fetch).mock.calls.map((call: unknown[]) => call[0]);
    const hasWsUrl = fetchCalls.some((url: unknown) => typeof url === 'string' && url.includes('/api/ws-url'));
    expect(hasWsUrl).toBe(true);
  });
});
