import { useEffect, useRef, useState, useCallback } from 'react';
import { z } from 'zod';

// WebSocket message schemas
const wsMessageSchema = z.object({
  type: z.enum([
    'connection_established',
    'live_health_update',
    'historical_data_update',
    'emergency_alert',
    'client_presence',
    'error',
    'pong',
  ]),
  data: z.unknown().optional(),
  timestamp: z.string().optional(),
});

export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export interface WebSocketHookReturn {
  connectionState: ConnectionState;
  sendMessage: (message: Record<string, unknown>) => void;
  connect: () => void;
  disconnect: () => void;
}

export interface MessageHandlers {
  onLiveHealthUpdate?: (data: unknown) => void;
  onHistoricalDataUpdate?: (data: unknown) => void;
  onEmergencyAlert?: (data: unknown) => void;
  onClientPresence?: (data: unknown) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(
  config: WebSocketConfig,
  handlers: MessageHandlers = {}
): WebSocketHookReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = config.reconnectAttempts ?? 5;
  const reconnectDelay = config.reconnectDelay ?? 1000;
  const pingInterval = config.pingInterval ?? 30000;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (message: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          handlers.onError?.('Failed to send message');
        }
      } else {
        console.warn('WebSocket not connected, cannot send message');
        handlers.onError?.('WebSocket not connected');
      }
    },
    [handlers]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const rawData = JSON.parse(event.data);
        const parsed = wsMessageSchema.safeParse(rawData);

        if (!parsed.success) {
          console.error('Invalid WebSocket message format:', parsed.error);
          handlers.onError?.('Invalid message format received');
          return;
        }

        const { type, data } = parsed.data;

        switch (type) {
          case 'connection_established':
            setConnectionState((prev) => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              error: null,
            }));
            reconnectAttemptsRef.current = 0;
            handlers.onConnect?.();

            // Start ping interval
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current);
            }
            pingIntervalRef.current = setInterval(() => {
              sendMessage({ type: 'ping' });
            }, pingInterval);
            break;

          case 'live_health_update':
            handlers.onLiveHealthUpdate?.(data);
            break;

          case 'historical_data_update':
            handlers.onHistoricalDataUpdate?.(data);
            break;

          case 'emergency_alert':
            handlers.onEmergencyAlert?.(data);
            break;

          case 'client_presence':
            handlers.onClientPresence?.(data);
            break;

          case 'error': {
            const errorMessage =
              ((data as Record<string, unknown>)?.message as string) ||
              'Unknown server error';
            handlers.onError?.(errorMessage);
            setConnectionState((prev) => ({ ...prev, error: errorMessage }));
            break;
          }

          case 'pong':
            // Heartbeat response - connection is alive
            break;

          default:
            console.log('Unknown message type:', type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        handlers.onError?.('Failed to parse message');
      }
    },
    [handlers, sendMessage, pingInterval]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    cleanup();

    setConnectionState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      wsRef.current = new WebSocket(config.url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');

        // Identify as web client
        sendMessage({
          type: 'client_identification',
          data: {
            clientType: 'web_app',
            userId: 'demo-user', // TODO: Get from auth context
            timestamp: new Date().toISOString(),
          },
        });
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);

        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        cleanup();
        handlers.onDisconnect?.();

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds
          );

          reconnectAttemptsRef.current += 1;

          setConnectionState((prev) => ({
            ...prev,
            reconnectAttempts: reconnectAttemptsRef.current,
          }));

          console.log(
            `Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionState((prev) => ({
            ...prev,
            error: 'Connection failed after maximum retry attempts',
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState((prev) => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false,
        }));
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState((prev) => ({
        ...prev,
        error: 'Failed to create connection',
        isConnecting: false,
      }));
    }
  }, [
    config.url,
    handleMessage,
    sendMessage,
    cleanup,
    maxReconnectAttempts,
    reconnectDelay,
    handlers,
  ]);

  const disconnect = useCallback(() => {
    cleanup();
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
    });
  }, [cleanup, maxReconnectAttempts]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [cleanup]);

  return {
    connectionState,
    sendMessage,
    connect,
    disconnect,
  };
}
