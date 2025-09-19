import { WebSocketClient } from '@/lib/websocketClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('WebSocketClient (schema enforcement)', () => {
  let mockWs: {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let original: unknown;
  let msgHandler: ((ev: { data: string }) => void) | null = null;

  beforeEach(() => {
    original = global.WebSocket;
    mockWs = {
      readyState: 1,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn((event: string, handler: any) => {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event === 'message') msgHandler = handler;
        if (event === 'open') setTimeout(() => handler({}), 0);
      }),
      removeEventListener: vi.fn(),
    };
    // @ts-expect-error override for test environment
    global.WebSocket = vi.fn(() => mockWs);
    // @ts-expect-error override fetch for test
    global.fetch = vi.fn(async () => ({
      json: async () => ({ url: 'ws://localhost:9999' }),
    }));
  });

  afterEach(() => {
    global.WebSocket = original;
  });

  it('drops invalid envelope when enforceSchema true', async () => {
    const received: unknown[] = [];
    const client = new WebSocketClient({
      url: 'ws://localhost:9999',
      enforceSchema: true,
    });
    client.subscribe('live_health_update', (m) => received.push(m));
    await client.open();
    msgHandler?.({
      data: JSON.stringify({
        type: 'live_health_update',
        data: { metric: 'heart_rate', value: 1 },
      }),
    });
    expect(received.length).toBe(0);
  });

  it('accepts valid envelope when enforceSchema true', async () => {
    const received: unknown[] = [];
    const client = new WebSocketClient({
      url: 'ws://localhost:9999',
      enforceSchema: true,
    });
    client.subscribe('live_health_update', (m) => received.push(m));
    await client.open();
    msgHandler?.({
      data: JSON.stringify({
        type: 'live_health_update',
        data: { metric: 'heart_rate', value: 70, unit: 'bpm' },
        timestamp: new Date().toISOString(),
      }),
    });
    expect(received.length).toBe(1);
  });
});
