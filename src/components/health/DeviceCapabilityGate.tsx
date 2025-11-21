/**
 * Device Capability Gate Component
 * Shows/hides features based on connected device capabilities
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { AlertCircle, Bluetooth } from 'lucide-react';
import { ReactNode } from 'react';

interface DeviceCapabilityGateProps {
  requiredCapability:
    | 'healthKit'
    | 'lidar'
    | 'motionSensors'
    | 'heartRate'
    | 'fallDetection'
    | 'backgroundSync';
  fallback?: ReactNode;
  showConnectPrompt?: boolean;
  children: ReactNode;
}

export function DeviceCapabilityGate({
  requiredCapability,
  fallback,
  showConnectPrompt = true,
  children,
}: DeviceCapabilityGateProps) {
  const { devices } = useDeviceManagement();

  // Check if any connected device has the required capability
  const hasCapability = devices.some((device) => {
    if (!device.capabilities) return false;

    // Type assertion for capabilities that may not be in the base type
    const caps = device.capabilities as {
      healthKit?: boolean;
      lidar?: boolean;
      motionSensors?: boolean;
      heartRate?: boolean;
      fallDetection?: boolean;
      backgroundSync?: boolean;
      realTimeSync?: boolean;
    };

    switch (requiredCapability) {
      case 'healthKit':
        return caps.healthKit === true;
      case 'lidar':
        return caps.lidar === true;
      case 'motionSensors':
        return caps.motionSensors === true;
      case 'heartRate':
        return caps.heartRate === true;
      case 'fallDetection':
        return caps.fallDetection === true;
      case 'backgroundSync':
        return caps.backgroundSync === true;
      default:
        return false;
    }
  });

  if (hasCapability) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showConnectPrompt) {
    return null;
  }

  const capabilityNames: Record<string, string> = {
    healthKit: 'HealthKit',
    lidar: 'LiDAR',
    motionSensors: 'Motion Sensors',
    heartRate: 'Heart Rate Monitoring',
    fallDetection: 'Fall Detection',
    backgroundSync: 'Background Sync',
  };

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div>
          <p className="font-medium">
            {capabilityNames[requiredCapability]} capability required
          </p>
          <p className="text-sm text-muted-foreground">
            Connect a device with {capabilityNames[requiredCapability]} support
            to use this feature.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (globalThis.window !== undefined) {
              globalThis.window.sessionStorage.setItem(
                'open-device-setup',
                'true'
              );
              // Navigate using app's custom navigation system
              globalThis.window.dispatchEvent(
                new CustomEvent('navigate', {
                  detail: { feature: 'device-sync' },
                })
              );
            }
          }}
        >
          <Bluetooth className="mr-2 h-4 w-4" />
          Connect Device
        </Button>
      </AlertDescription>
    </Alert>
  );
}
