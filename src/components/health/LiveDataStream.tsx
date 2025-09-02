import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessedHealthData } from '@/schemas/health';
import {
  Activity,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LiveStreamMetric {
  timestamp: string;
  heartRate?: number;
  steps?: number;
  walkingSteadiness?: number;
  bloodOxygen?: number;
}

interface WebSocketMessage {
  type: string;
  data?: LiveStreamMetric;
  processedData?: ProcessedHealthData;
  quality?: 'excellent' | 'good' | 'poor';
  error?: string;
  userId?: string;
}

interface LiveDataStreamProps {
  userId: string;
  onDataReceived?: (data: ProcessedHealthData) => void;
}

export default function LiveDataStream({
  userId,
  onDataReceived,
}: LiveDataStreamProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<LiveStreamMetric | null>(
    null
  );
  const [connectionQuality, setConnectionQuality] = useState<
    'excellent' | 'good' | 'poor'
  >('good');
  const [streamStats, setStreamStats] = useState({
    packetsReceived: 0,
    packetsLost: 0,
    uptime: 0,
    lastHeartbeat: null as string | null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const uptimeIntervalRef = useRef<number | null>(null);

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      setStreamStats((prev) => ({
        ...prev,
        packetsReceived: prev.packetsReceived + 1,
        lastHeartbeat: new Date().toISOString(),
      }));

      switch (message.type) {
        case 'live_health_update':
          if (message.data) {
            setCurrentMetrics(message.data);
            setIsStreaming(true);
          }

          // Forward processed data to parent component
          if (onDataReceived && message.processedData) {
            onDataReceived(message.processedData);
          }
          break;

        case 'connection_quality':
          if (message.quality) {
            setConnectionQuality(message.quality);
          }
          break;

        case 'heartbeat_response':
          // Connection is healthy
          break;

        case 'error':
          console.error('WebSocket error message:', message.error);
          setStreamStats((prev) => ({
            ...prev,
            packetsLost: prev.packetsLost + 1,
          }));
          break;
      }
    },
    [onDataReceived]
  );

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      // Use environment-specific WebSocket URL
      const wsUrl = import.meta.env.DEV
        ? 'ws://localhost:3001'
        : 'wss://vitalsense.health/ws';

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for live streaming');
        setIsConnected(true);
        setConnectionQuality('excellent');

        // Send subscription message for user's live data
        wsRef.current?.send(
          JSON.stringify({
            type: 'subscribe_live_data',
            userId,
            metrics: [
              'heart_rate',
              'steps',
              'walking_steadiness',
              'blood_oxygen',
            ],
          })
        );

        // Start heartbeat
        startHeartbeat();
        startUptimeCounter();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsStreaming(false);
        cleanup();

        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionQuality('poor');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionQuality('poor');
    }
  }, [userId, handleWebSocketMessage]);

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Every 30 seconds
  };

  const startUptimeCounter = () => {
    uptimeIntervalRef.current = window.setInterval(() => {
      setStreamStats((prev) => ({
        ...prev,
        uptime: prev.uptime + 1,
      }));
    }, 1000);
  };

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (uptimeIntervalRef.current) {
      clearInterval(uptimeIntervalRef.current);
    }
  };

  const toggleStreaming = () => {
    if (isConnected && wsRef.current) {
      const action = isStreaming ? 'pause_stream' : 'resume_stream';
      wsRef.current.send(JSON.stringify({ type: action, userId }));
      setIsStreaming(!isStreaming);
    }
  };

  const resetConnection = () => {
    wsRef.current?.close();
    setStreamStats({
      packetsReceived: 0,
      packetsLost: 0,
      uptime: 0,
      lastHeartbeat: null,
    });
    connectWebSocket();
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      cleanup();
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4 text-red-500" />;
    if (connectionQuality === 'excellent')
      return <Wifi className="h-4 w-4 text-green-500" />;
    if (connectionQuality === 'good')
      return <Wifi className="h-4 w-4 text-yellow-500" />;
    return <Wifi className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Health Data Stream
          </CardTitle>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            onClick={toggleStreaming}
            disabled={!isConnected}
            variant={isStreaming ? 'secondary' : 'default'}
            size="sm"
          >
            {isStreaming ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isStreaming ? 'Pause Stream' : 'Start Stream'}
          </Button>
          <Button onClick={resetConnection} variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Connection
          </Button>
        </div>

        {/* Connection Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Uptime</div>
            <div className="font-mono">{formatUptime(streamStats.uptime)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Packets Received</div>
            <div className="font-mono">
              {streamStats.packetsReceived.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Packet Loss</div>
            <div className="font-mono text-red-500">
              {streamStats.packetsLost}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Quality</div>
            <Badge
              variant={
                connectionQuality === 'excellent' ? 'default' : 'secondary'
              }
            >
              {connectionQuality}
            </Badge>
          </div>
        </div>

        {/* Live Metrics Display */}
        {isStreaming && currentMetrics && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Real-time Metrics</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {currentMetrics.heartRate && (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Heart Rate
                      </div>
                      <div className="text-lg font-semibold">
                        {currentMetrics.heartRate} BPM
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {currentMetrics.steps && (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-muted-foreground text-sm">Steps</div>
                      <div className="text-lg font-semibold">
                        {currentMetrics.steps.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {currentMetrics.walkingSteadiness && (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Walking Steadiness
                      </div>
                      <div className="text-lg font-semibold">
                        {currentMetrics.walkingSteadiness}%
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {currentMetrics.bloodOxygen && (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Blood Oxygen
                      </div>
                      <div className="text-lg font-semibold">
                        {currentMetrics.bloodOxygen}%
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {!isConnected && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Live streaming is not available. Please check your connection and
              try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
