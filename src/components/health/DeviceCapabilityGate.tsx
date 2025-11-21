/**
 * Device Capability Gate Component
 * Shows/hides features based on connected device capabilities
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { AlertCircle, Bluetooth, Smartphone } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeviceCapabilityGateProps {
  requiredCapability: 'healthKit' | 'lidar' | 'motionSensors' | 'heartRate' | 'fallDetection' | 'backgroundSync';
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
  const navigate = useNavigate();

  // Check if any connected device has the required capability
  const hasCapability = devices.some((device) => {
    if (!device.capabilities) return false;

    switch (requiredCapability) {
      case 'healthKit':
        return device.capabilities.healthKit === true;
      case 'lidar':
        return device.capabilities.lidar === true;
      case 'motionSensors':
        return device.capabilities.motionSensors === true;
      case 'heartRate':
        return device.capabilities.heartRate === true;
      case 'fallDetection':
        return device.capabilities.fallDetection === true;
      case 'backgroundSync':
        return device.capabilities.backgroundSync === true;
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
            Connect a device with {capabilityNames[requiredCapability]} support to use this feature.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (globalThis.window !== undefined) {
              globalThis.window.sessionStorage.setItem('open-device-setup', 'true');
            }
            navigate('/device-sync');
          }}
        >
          <Bluetooth className="mr-2 h-4 w-4" />
          Connect Device
        </Button>
      </AlertDescription>
    </Alert>
  );
}
