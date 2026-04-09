import { AppWsContext } from '@/contexts/AppWebSocketContext';
import { AppWebSocketProvider } from '@/contexts/AppWebSocketProvider';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

class MockWebSocket extends EventTarget {
  readyState = 1;
  send() {
    /* noop */
  }
  close() {
    /* noop */
  }
}

let mockSocket: MockWebSocket;

beforeEach(() => {
  mockSocket = new MockWebSocket();
  // @ts-expect-error override global
  global.WebSocket = vi.fn(function () { return mockSocket; });
  global.fetch = vi.fn(async (url: RequestInfo) => {
    if (typeof url === 'string' && url.includes('/api/ws-url')) {
      return new Response(JSON.stringify({ url: 'ws://example.test/mock' }), {
        status: 200,
      });
    }
    return new Response('{}', { status: 200 });
  }) as any;
  localStorage.clear();
  localStorage.setItem('vs_lidar_enabled', '1');
});

describe('AppWebSocketProvider LiDAR assimilation', () => {
  it('records lidar_metrics payload values into lastMetrics', async () => {
    let ctxValue: any = null;
    render(
      <AppWebSocketProvider>
        <AppWsContext.Consumer>
          {(v) => {
            ctxValue = v;
            return null;
          }}
        </AppWsContext.Consumer>
      </AppWebSocketProvider>
    );

    // Wait briefly for provider effect to attach message listener
    for (let i = 0; i < 10; i++) {
      if (ctxValue?.socket || (ctxValue as any)?.client) break;
      await new Promise((r) => setTimeout(r, 5));
    }
    // Dispatch LIDAR metrics event after listener likely attached
    for (let attempt = 0; attempt < 5; attempt++) {
      const evt = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'lidar_metrics',
          obstacle_distance_min: 0.85,
          lateral_deviation_mean: 0.5,
          surface_roughness: 0.12,
        }),
      });
      await act(async () => {
        mockSocket.dispatchEvent(evt);
      });
      await new Promise((r) => setTimeout(r, 25));
      if (ctxValue?.lastMetrics?.obstacle_distance_min === 0.85) break;
    }
    expect(ctxValue?.lastMetrics?.obstacle_distance_min).toBe(0.85);
    expect(ctxValue?.lastMetrics?.lateral_deviation_mean).toBe(0.5);
    expect(ctxValue?.lastMetrics?.surface_roughness).toBe(0.12);
  });
});
