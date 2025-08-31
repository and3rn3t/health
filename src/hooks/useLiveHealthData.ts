import { useState, useEffect, useCallback } from 'react';
import {
  getLiveHealthDataSync,
  LiveHealthMetric,
  ConnectionStatus,
} from '@/lib/liveHealthDataSync';

export function useLiveHealthData(userId: string = 'default-user') {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0,
    latency: 0,
    dataQuality: 'offline',
  });

  const [liveMetrics, setLiveMetrics] = useState<LiveHealthMetric[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<
    Record<string, LiveHealthMetric>
  >({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingEmergency, setPendingEmergency] = useState<{
    expiresAt: number;
    data: Record<string, unknown>;
  } | null>(null);

  const healthDataSync = getLiveHealthDataSync(userId);

  const connectToHealthData = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connected = await healthDataSync.connect();
      setConnectionStatus(healthDataSync.getConnectionStatus());

      if (connected) {
        // Subscribe to all health metrics
        healthDataSync.subscribe({
          id: 'main-dashboard',
          metricTypes: [
            'heart_rate',
            'walking_steadiness',
            'steps',
            'activity',
            'fall_event',
          ],
          callback: (data: LiveHealthMetric) => {
            setLiveMetrics((prev) => [...prev.slice(-99), data]); // Keep last 100 metrics
            setLatestMetrics((prev) => ({
              ...prev,
              [data.metricType]: data,
            }));
          },
        });
      }
    } catch (error) {
      console.error('Failed to connect to health data:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [healthDataSync]);

  const disconnectFromHealthData = useCallback(() => {
    healthDataSync.disconnect();
    setConnectionStatus(healthDataSync.getConnectionStatus());
  }, [healthDataSync]);

  const triggerEmergency = useCallback(
    (emergencyData: Record<string, unknown>) => {
      healthDataSync.triggerEmergency(emergencyData);
    },
    [healthDataSync]
  );

  const cancelPendingEmergency = useCallback(() => {
    healthDataSync.cancelPendingEmergency();
  }, [healthDataSync]);

  // Auto-connect on mount
  useEffect(() => {
    connectToHealthData();

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(healthDataSync.getConnectionStatus());
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      disconnectFromHealthData();
    };
  }, [connectToHealthData, disconnectFromHealthData, healthDataSync]);

  // Track pending emergency state via DOM events from the WS client
  useEffect(() => {
    const onPending = (e: Event) => {
      const ce = e as CustomEvent<{
        expiresAt: number;
        data: Record<string, unknown>;
      }>;
      setPendingEmergency({
        expiresAt: ce.detail.expiresAt,
        data: ce.detail.data,
      });
    };
    const onSent = () => setPendingEmergency(null);
    const onCancelled = () => setPendingEmergency(null);
    window.addEventListener('emergency-pending', onPending as EventListener);
    window.addEventListener('emergency-sent', onSent as EventListener);
    window.addEventListener(
      'emergency-cancelled',
      onCancelled as EventListener
    );
    return () => {
      window.removeEventListener(
        'emergency-pending',
        onPending as EventListener
      );
      window.removeEventListener('emergency-sent', onSent as EventListener);
      window.removeEventListener(
        'emergency-cancelled',
        onCancelled as EventListener
      );
    };
  }, []);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    connectionStatus,
    liveMetrics,
    latestMetrics,
    isConnecting,
    connectToHealthData,
    disconnectFromHealthData,
    triggerEmergency,
    cancelPendingEmergency,
    pendingEmergency,
  };
}
