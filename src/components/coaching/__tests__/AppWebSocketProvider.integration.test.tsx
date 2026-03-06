import { AppWebSocketProvider } from '@/contexts/AppWebSocketProvider';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We simulate a WebSocket by creating a minimal mock with EventTarget behavior.
class MockWebSocket extends EventTarget {
  readyState = 1; // OPEN
  sent: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  constructor() {
    super();
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    /* noop */
  }
}

// Patch global WebSocket used inside provider's WebSocketClient.
let mockSocket: MockWebSocket;
beforeEach(() => {
  mockSocket = new MockWebSocket();
  // @ts-expect-error override
  global.WebSocket = vi.fn(() => mockSocket);
  // Mock fetch used by WebSocketClient to resolve URL
  global.fetch = vi.fn(async (url: RequestInfo) => {
    if (typeof url === 'string' && url.includes('/api/ws-url')) {
      return new Response(JSON.stringify({ url: 'ws://example.test/mock' }), {
        status: 200,
      });
    }
    if (typeof url === 'string' && url.includes('/api/ws-telemetry')) {
      return new Response('{}', { status: 200 });
    }
    return new Response('{}', { status: 200 });
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  localStorage.clear();
});

function fireCoachEvent(
  partial: Partial<Record<string, any>> & { id: string }
) {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const evt = new MessageEvent('message', {
    data: JSON.stringify({
      type: 'micro_coach',
      id: partial.id,
      severity: partial.severity ?? 'info',
      message: partial.message ?? 'Test coaching message',
      metric: partial.metric ?? 'posture_angle',
      value: partial.value ?? 9,
      ts: new Date().toISOString(),
      cooldownSec: 60,
    }),
  });
  act(() => {
    mockSocket.dispatchEvent(evt);
  });
}

describe('AppWebSocketProvider + MicroCoachToasts integration', () => {
  it('renders toast for incoming micro_coach event when coaching enabled', async () => {
    await act(async () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="app-shell" />
        </AppWebSocketProvider>
      );
    });
    // Wait for provider to set internal socket (microtask + promise from open)
    await waitFor(() => {
      const wsMock = global.WebSocket as unknown as {
        mock?: { calls: unknown[] };
      };
      expect(wsMock.mock && wsMock.mock.calls.length).toBeGreaterThan(0);
    });
    fireCoachEvent({ id: 'test-warn' });
    const toast = await screen.findByText(
      /Test coaching message/i,
      {},
      { timeout: 500 }
    );
    expect(toast).toBeInTheDocument();
  });

  it('does not render toasts after disabling coaching via localStorage setting', async () => {
    // Pre-set disabled flag before mount
    localStorage.setItem('vs_coaching_enabled_v1', '0');
    render(
      <AppWebSocketProvider>
        <div />
      </AppWebSocketProvider>
    );
    fireCoachEvent({ id: 'test-disabled' });
    // Give a microtask flush
    await new Promise((r) => setTimeout(r, 5));
    expect(screen.queryByText(/Test coaching message/i)).toBeNull();
  });
});
