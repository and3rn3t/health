import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WS_TIMING } from '@/lib/motion-tokens';
import { RefreshCw, Signal, Wifi, WifiOff } from '@/lib/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ConnectionStats {
  totalMessages: number;
  uptime: number;
  lastHeartbeat: string | null;
  lastRttMs?: number | null;
}

export function LiveConnectionStatus() {
  const [stats, setStats] = useState<ConnectionStats>({
    totalMessages: 0,
    uptime: 0,
    lastHeartbeat: null,
    lastRttMs: null,
  });
  const [lastPingAt, setLastPingAt] = useState<number | null>(null);

  // Get WebSocket URL from window globals or use default
  const getWebSocketUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const customUrl = (window as Window & { __WS_URL__?: string }).__WS_URL__;
      if (customUrl) return customUrl;
    }
    return 'ws://localhost:3001';
  }, []);

  // WebSocket message handlers - memoized to prevent infinite loops
  const messageHandlers = useMemo(
    () => ({
      connection_established: () => {
        setStats((prev) => ({
          ...prev,
          lastHeartbeat: new Date().toISOString(),
        }));
      },

      live_health_update: () => {
        setStats((prev) => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          lastHeartbeat: new Date().toISOString(),
        }));
      },

      pong: () => {
        setStats((prev) => ({
          ...prev,
          lastHeartbeat: new Date().toISOString(),
          lastRttMs: lastPingAt
            ? Date.now() - lastPingAt
            : (prev.lastRttMs ?? null),
        }));
        setLastPingAt(null);
      },
    }),
    [lastPingAt]
  ); // Empty deps since handlers don't depend on external values

  // WebSocket config - memoized to prevent infinite loops
  const webSocketConfig = useMemo(
    () => ({
      url: getWebSocketUrl(),
      enableInDevelopment: true,
      reconnectAttempts: 5,
      reconnectDelay: WS_TIMING.reconnectDelay,
      pingInterval: WS_TIMING.pingInterval,
      onConnect: () => {
        console.log('Connection status widget connected');
      },
    }),
    [getWebSocketUrl]
  );

  // Initialize WebSocket connection
  const { connectionState, sendMessage, connect, disconnect } = useWebSocket(
    webSocketConfig,
    messageHandlers
  );

  // Send identification when connected - separate useEffect
  useEffect(() => {
    if (connectionState.isConnected) {
      sendMessage({
        type: 'client_identification',
        data: {
          clientType: 'status_widget',
          userId: 'demo-user',
          version: '1.0.0',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }, [connectionState.isConnected, sendMessage]);

  // Auto-connect when component mounts - use empty deps to avoid infinite loop
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Update uptime
  useEffect(() => {
    if (!connectionState.isConnected) return;

    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        uptime: prev.uptime + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState.isConnected]);

  // Reset stats when disconnected
  useEffect(() => {
    if (!connectionState.isConnected) {
      setStats({
        totalMessages: 0,
        uptime: 0,
        lastHeartbeat: null,
      });
    }
  }, [connectionState.isConnected]);

  // Get status icon and color
  const getStatusIcon = () => {
    if (connectionState.isConnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (connectionState.isConnected) {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (connectionState.isConnecting) return 'bg-yellow-500';
    if (connectionState.isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (connectionState.isConnecting) return 'Connecting...';
    if (connectionState.isConnected) {
      const rtt =
        typeof stats.lastRttMs === 'number' ? `${stats.lastRttMs}ms` : null;
      return rtt ? `Live · ${rtt}` : 'Live';
    }
    // When offline, surface latest close code if present
    let suffix: string | null = null;
    if (connectionState.error) {
      const m = /Connection closed:\s*(\d+)/.exec(connectionState.error);
      const code = m?.[1];
      if (code && code !== '1000') suffix = code;
    }
    return suffix ? `Offline · ${suffix}` : 'Offline';
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="flex h-10 items-center gap-2 px-3"
          title={
            !connectionState.isConnected && connectionState.error
              ? connectionState.error
              : undefined
          }
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Signal className="h-5 w-5" />
            <h4 className="font-semibold">Live Connection Status</h4>
            <Badge
              variant={connectionState.isConnected ? 'default' : 'secondary'}
            >
              {getStatusText()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Server</span>
              <span className="font-mono text-xs">{getWebSocketUrl()}</span>
            </div>

            {connectionState.isConnected && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono">
                    {formatUptime(stats.uptime)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-mono">{stats.totalMessages}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Heartbeat</span>
                  <span className="font-mono text-xs">
                    {stats.lastHeartbeat
                      ? new Date(stats.lastHeartbeat).toLocaleTimeString()
                      : 'Never'}
                  </span>
                </div>

                {typeof stats.lastRttMs === 'number' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last RTT</span>
                    <span className="font-mono">{stats.lastRttMs} ms</span>
                  </div>
                )}
              </>
            )}

            {connectionState.error && (
              <div className="rounded bg-red-50 p-2 text-sm text-red-600">
                <strong>Error:</strong> {connectionState.error}
              </div>
            )}

            {connectionState.reconnectAttempts > 0 && (
              <div className="rounded bg-yellow-50 p-2 text-sm text-yellow-600">
                Reconnect attempt: {connectionState.reconnectAttempts}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLastPingAt(Date.now());
                sendMessage({
                  type: 'ping',
                  data: { timestamp: Date.now() },
                  timestamp: new Date().toISOString(),
                });
              }}
              disabled={!connectionState.isConnected}
              className="flex-1"
            >
              Ping
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (connectionState.isConnected) {
                  disconnect();
                } else {
                  connect();
                }
              }}
              className="flex-1"
            >
              {connectionState.isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
