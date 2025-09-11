import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RefreshCw, Signal, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ConnectionStats {
  totalMessages: number;
  uptime: number;
  lastHeartbeat: string | null;
}

export function LiveConnectionStatus() {
  const [stats, setStats] = useState<ConnectionStats>({
    totalMessages: 0,
    uptime: 0,
    lastHeartbeat: null,
  });

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
        }));
      },
    }),
    []
  ); // Empty deps since handlers don't depend on external values

  // WebSocket config - memoized to prevent infinite loops
  const webSocketConfig = useMemo(
    () => ({
      url: getWebSocketUrl(),
      enableInDevelopment: true,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      pingInterval: 30000,
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
      return <RefreshCw className="animate-spin h-4 w-4" />;
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
    if (connectionState.isConnected) return 'Live';
    return 'Offline';
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
          size="sm"
          className="flex h-8 items-center gap-2"
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
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
              <span className="text-xs font-mono">{getWebSocketUrl()}</span>
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
                  <span className="text-xs font-mono">
                    {stats.lastHeartbeat
                      ? new Date(stats.lastHeartbeat).toLocaleTimeString()
                      : 'Never'}
                  </span>
                </div>
              </>
            )}

            {connectionState.error && (
              <div className="bg-red-50 text-red-600 rounded p-2 text-sm">
                <strong>Error:</strong> {connectionState.error}
              </div>
            )}

            {connectionState.reconnectAttempts > 0 && (
              <div className="bg-yellow-50 text-yellow-600 rounded p-2 text-sm">
                Reconnect attempt: {connectionState.reconnectAttempts}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
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
