import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

// WebSocket message schema validation
const wsMessageSchema = z.object({
  type: z.string(),
  data: z.unknown(),
  timestamp: z.string().datetime().optional(),
});

export type WebSocketMessage = z.infer<typeof wsMessageSchema>;

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export interface MessageHandlers {
  [messageType: string]: (data: unknown) => void;
}

export interface WebSocketHookReturn {
  connectionState: ConnectionState;
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  enableInDevelopment?: boolean; // Set to true to enable WebSocket connections in development mode
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(
  config: WebSocketConfig,
  handlers: MessageHandlers = {}
): WebSocketHookReturn {
  type WindowWithKvMode = Window & {
    __VITALSENSE_KV_MODE?: 'local' | 'network';
  };
  // Check if we're in development mode and if WebSocket should be enabled
  const isDevelopment = import.meta.env.DEV;
  // Demo mode flag injected by Worker for /demo route
  type WindowWithDemo = Window & { VITALSENSE_DISABLE_WEBSOCKET?: boolean };
  const isDemoMode =
    typeof window !== 'undefined' &&
    (window as WindowWithDemo).VITALSENSE_DISABLE_WEBSOCKET === true;
  // User-controlled live toggle
  type WindowWithLive = Window & { VITALSENSE_LIVE_DISABLED?: boolean };
  const isLiveDisabled =
    typeof window !== 'undefined' &&
    (window as WindowWithLive).VITALSENSE_LIVE_DISABLED === true;
  const enableInDev = config.enableInDevelopment ?? false;

  // TEMPORARY FIX - Disable WebSocket entirely to stop message flood
  const shouldConnect = false; // !isDemoMode && !isLiveDisabled && (!isDevelopment || enableInDev);

  // Production-ready WebSocket hook with proper connection limits
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: shouldConnect ? null : 'WebSocket disabled in development mode',
    reconnectAttempts: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectionAttemptRef = useRef<number>(0);
  const lastConnectionAttempt = useRef<number>(0);

  // Production connection limits - prevent connection storms
  const maxReconnectAttempts = config.reconnectAttempts ?? 5;
  const reconnectDelay = config.reconnectDelay ?? 1000;
  const pingInterval = config.pingInterval ?? 30000;
  const maxConnectionAttempts = 3; // Max simultaneous connection attempts
  const connectionThrottle = 5000; // 5 seconds between connection attempts
  const connectionTimeout = 10000; // 10 second connection timeout

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      // Skip sending in development mode unless explicitly enabled
      if (!shouldConnect) {
        console.info(
          'WebSocket message not sent (development mode):',
          message.type
        );
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          config.onError?.('Failed to send message');
        }
      } else {
        console.warn('WebSocket not connected, cannot send message');
        config.onError?.('WebSocket not connected');
      }
    },
    [config, shouldConnect]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        const validatedMessage = wsMessageSchema.parse(message);

        const bumpHeartbeat = () => {
          try {
            (
              window as unknown as {
                __WS_CONNECTION__?: {
                  connected: boolean;
                  lastHeartbeat?: string;
                };
              }
            ).__WS_CONNECTION__ = {
              connected: true,
              lastHeartbeat: new Date().toISOString(),
            };
          } catch {
            /* noop */
          }
        };

        const defaultHandlers: MessageHandlers = {
          connection_established: () => bumpHeartbeat(),
          pong: () => bumpHeartbeat(),
        };

        const handler =
          handlers[validatedMessage.type] ||
          defaultHandlers[validatedMessage.type];
        if (handler) {
          handler(validatedMessage.data);
        } else {
          console.warn(`No handler for message type: ${validatedMessage.type}`);
        }
      } catch (error) {
        console.error('Invalid WebSocket message received:', error);
        config.onError?.('Invalid message format received');
      }
    },
    [handlers, config]
  );

  const connect = useCallback(() => {
    // Skip connection in development mode unless explicitly enabled
    if (!shouldConnect) {
      console.info(
        'WebSocket connections disabled in development mode. Set enableInDevelopment: true to enable.'
      );
      return;
    }

    // If the app is configured to require a device token, avoid connecting without one
    try {
      const w = window as unknown as WindowWithKvMode & {
        __WS_DEVICE_TOKEN__?: string;
      };
      const token = w.__WS_DEVICE_TOKEN__ || '';
      // Heuristic: if a token is expected but missing, skip connect to avoid server 401 noise
      if (token === '' && typeof w.__VITALSENSE_KV_MODE !== 'undefined') {
        // In production we default to KV local mode; device token-less connects can be skipped
        console.info('WebSocket connect skipped (no device token present)');
        return;
      }
    } catch {
      // ignore
    }

    // Throttle connection attempts to prevent storms
    const now = Date.now();
    if (now - lastConnectionAttempt.current < connectionThrottle) {
      console.warn('Connection attempt throttled, please wait');
      return;
    }
    lastConnectionAttempt.current = now;

    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current >= maxConnectionAttempts) {
      console.warn('Max connection attempts reached, please wait');
      return;
    }

    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      console.warn('WebSocket already connecting or connected');
      return;
    }

    connectionAttemptRef.current++;
    setConnectionState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      // Default to same-origin /ws in production if no URL provided
      let url = config.url;
      if (!url && typeof window !== 'undefined') {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        url = `${proto}://${window.location.host}/ws`;
      }
      const ws = new WebSocket(url, config.protocols);
      wsRef.current = ws;

      // Connection timeout
      const timeoutId = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setConnectionState((prev) => ({
            ...prev,
            isConnecting: false,
            error: 'Connection timeout',
          }));
          connectionAttemptRef.current = Math.max(
            0,
            connectionAttemptRef.current - 1
          );
        }
      }, connectionTimeout);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        connectionAttemptRef.current = Math.max(
          0,
          connectionAttemptRef.current - 1
        );
        setConnectionState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
        }));
        reconnectAttemptsRef.current = 0;
        config.onConnect?.();

        // Setup ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          sendMessage({
            type: 'ping',
            data: {},
            timestamp: new Date().toISOString(),
          });
        }, pingInterval);
      };

      ws.onmessage = handleMessage;

      const applyClosedState = (event: CloseEvent) => {
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error:
            event.code === 1000
              ? null
              : `Connection closed: ${event.code} ${event.reason}`,
        }));
      };

      const scheduleReconnect = (delay: number, doConnect: () => void) => {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          setConnectionState((prev) => ({
            ...prev,
            reconnectAttempts: reconnectAttemptsRef.current,
          }));
          doConnect();
        }, delay);
      };

      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        connectionAttemptRef.current = Math.max(
          0,
          connectionAttemptRef.current - 1
        );

        applyClosedState(event);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        config.onDisconnect?.();

        // Auto-reconnect with exponential backoff (if not manually closed)
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
          );
          scheduleReconnect(delay, connect);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          setConnectionState((prev) => ({
            ...prev,
            error: 'Max reconnection attempts reached',
          }));
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        connectionAttemptRef.current = Math.max(
          0,
          connectionAttemptRef.current - 1
        );
        console.error('WebSocket error:', error);
        setConnectionState((prev) => ({
          ...prev,
          isConnecting: false,
          error: 'WebSocket connection error',
        }));
        config.onError?.('WebSocket connection error');
      };
    } catch (error) {
      connectionAttemptRef.current = Math.max(
        0,
        connectionAttemptRef.current - 1
      );
      console.error('Failed to create WebSocket:', error);
      setConnectionState((prev) => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to create WebSocket connection',
      }));
      config.onError?.('Failed to create WebSocket connection');
    }
  }, [
    config,
    shouldConnect,
    sendMessage,
    handleMessage,
    maxReconnectAttempts,
    reconnectDelay,
    pingInterval,
    connectionThrottle,
    maxConnectionAttempts,
    connectionTimeout,
  ]);

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    cleanup();
    setConnectionState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
    }));
  }, [cleanup, maxReconnectAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    sendMessage,
    connect,
    disconnect,
  };
}
