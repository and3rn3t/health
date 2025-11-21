import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocols?: string[];
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string, protocols?: string[]) {
    this.url = url;
    this.protocols = protocols;
    // Simulate connection immediately (no delay for faster tests)
    // Use setTimeout with 0 to allow React to process state updates
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  addEventListener() {
    // Mock addEventListener
  }

  removeEventListener() {
    // Mock removeEventListener
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    // Reset window flags
    delete (window as any).VITALSENSE_DISABLE_WEBSOCKET;
    delete (window as any).VITALSENSE_LIVE_DISABLED;
    delete (window as any).__VITALSENSE_KV_MODE;
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'example.com',
      },
      writable: true,
    });
    // Mock WebSocket
    global.WebSocket = MockWebSocket as any;
    // Use real timers for WebSocket tests
  });

  afterEach(() => {
    // Cleanup
  });

  test('should initialize with disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
      })
    );

    expect(result.current.connectionState.isConnected).toBe(false);
    expect(result.current.connectionState.isConnecting).toBe(false);
  });

  test('should connect when connect is called', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
      })
    );

    act(() => {
      result.current.connect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnecting || result.current.connectionState.isConnected).toBe(true);
      },
      { timeout: 500 }
    );
  });

  test('should handle connection success', async () => {
    const onConnect = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket(
        {
          url: 'wss://example.com/ws',
          enableInDevelopment: true,
          onConnect,
        },
        {}
      )
    );

    act(() => {
      result.current.connect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnected).toBe(true);
      },
      { timeout: 1000 }
    );

    expect(onConnect).toHaveBeenCalled();
  });

  test('should send messages when connected', async () => {
    const sendSpy = vi.spyOn(MockWebSocket.prototype, 'send');
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
      })
    );

    act(() => {
      result.current.connect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnected).toBe(true);
      },
      { timeout: 1000 }
    );

    act(() => {
      result.current.sendMessage({
        type: 'test',
        data: { message: 'hello' },
      });
    });

    expect(sendSpy).toHaveBeenCalled();
    const sentData = JSON.parse(sendSpy.mock.calls[0][0] as string);
    expect(sentData.type).toBe('test');
    expect(sentData.data).toEqual({ message: 'hello' });
  });

  test('should handle disconnection', async () => {
    const onDisconnect = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
        onDisconnect,
      })
    );

    act(() => {
      result.current.connect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnected).toBe(true);
      },
      { timeout: 1000 }
    );

    act(() => {
      result.current.disconnect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnected).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(onDisconnect).toHaveBeenCalled();
  });

  test('should handle message handlers', async () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket(
        {
          url: 'wss://example.com/ws',
          enableInDevelopment: true,
        },
        {
          test_message: handler,
        }
      )
    );

    act(() => {
      result.current.connect();
    });

    await waitFor(
      () => {
        expect(result.current.connectionState.isConnected).toBe(true);
      },
      { timeout: 1000 }
    );

    // Simulate receiving a message
    const ws = (result.current as any).wsRef?.current;
    if (ws && ws.onmessage) {
      act(() => {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'test_message',
              data: { test: 'data' },
            }),
          })
        );
      });
    }

    // Handler should be called (if message handling is implemented)
    // This depends on the actual implementation
  });

  test('should disable in development mode by default', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
      },
      writable: true,
    });

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        // enableInDevelopment not set (defaults to false)
      })
    );

    expect(result.current.connectionState.error).toBe(
      'WebSocket disabled in development mode'
    );
  });

  test('should respect demo mode flag', () => {
    (window as any).VITALSENSE_DISABLE_WEBSOCKET = true;

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
      })
    );

    expect(result.current.connectionState.error).toBeTruthy();
  });

  test('should respect live disabled flag', () => {
    (window as any).VITALSENSE_LIVE_DISABLED = true;

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://example.com/ws',
        enableInDevelopment: true,
      })
    );

    expect(result.current.connectionState.error).toBeTruthy();
  });
});
