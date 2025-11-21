/**
 * Device Health Monitor Component
 * Monitors device health and shows alerts for issues
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface DeviceHealthState {
  batteryAlerts: Set<string>;
  disconnectedAlerts: Set<string>;
}

export function DeviceHealthMonitor() {
  const { devices } = useDeviceManagement();
  const alertStateRef = useRef<DeviceHealthState>({
    batteryAlerts: new Set(),
    disconnectedAlerts: new Set(),
  });

  useEffect(() => {
    const state = alertStateRef.current;

    devices.forEach((device) => {
      // Low battery alert (< 20%)
      if (device.battery !== undefined) {
        if (device.battery < 20 && !state.batteryAlerts.has(device.id)) {
          state.batteryAlerts.add(device.id);
          toast.warning(`${device.name} battery is low (${device.battery}%)`, {
            description: 'Consider charging your device soon',
            duration: 5000,
          });
        } else if (device.battery >= 20) {
          state.batteryAlerts.delete(device.id);
        }
      }

      // Disconnected alert
      if (device.status === 'disconnected') {
        if (!state.disconnectedAlerts.has(device.id)) {
          state.disconnectedAlerts.add(device.id);
          toast.error(`${device.name} disconnected`, {
            description: 'Device is no longer connected. Check your connection.',
            duration: 5000,
          });
        }
      } else {
        state.disconnectedAlerts.delete(device.id);
      }

      // Error status alert
      if (device.status === 'error') {
        toast.error(`${device.name} connection error`, {
          description: 'There was an issue connecting to this device.',
          duration: 5000,
        });
      }
    });
  }, [devices]);

  // Silent component - no UI
  return null;
}
