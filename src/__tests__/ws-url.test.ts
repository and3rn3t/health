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
    const wsOpenHandlers: any[] = [];
    class WSStub {
      readyState = 0;
      addEventListener(ev: string, cb: any) {
        if (ev === 'open') wsOpenHandlers.push(cb);
      }
      send() {}
      close() {}
    }
    vi.stubGlobal('WebSocket', WSStub as any);
    const client = new WebSocketClient();
    const p = client.open();
    // trigger open
    for (const h of wsOpenHandlers) h();
    await p;
    expect((fetch as any).mock.calls[0][0]).toContain('/api/ws-url');
  });
});
