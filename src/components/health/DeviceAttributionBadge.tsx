/**
 * Device Attribution Badge
 * Shows which device a metric came from
 */

import { Badge } from '@/components/ui/badge';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { Bluetooth, Smartphone, Watch } from '@/lib/icons';
import { useMemo } from 'react';

interface DeviceAttributionBadgeProps {
  deviceId?: string;
  source?: string;
  compact?: boolean;
}

export function DeviceAttributionBadge({
  deviceId,
  source,
  compact = false,
}: DeviceAttributionBadgeProps) {
  const { getDevice } = useDeviceManagement();

  const device = useMemo(() => {
    if (deviceId) {
      return getDevice(deviceId);
    }
    return null;
  }, [deviceId, getDevice]);

  const getDeviceIcon = () => {
    if (device) {
      switch (device.type) {
        case 'apple_watch':
        case 'watch':
          return Watch;
        case 'iphone':
        case 'phone':
        case 'ipad':
          return Smartphone;
        default:
          return Bluetooth;
      }
    }
    if (source) {
      if (source.includes('watch')) return Watch;
      if (source.includes('iphone') || source.includes('phone'))
        return Smartphone;
    }
    return Bluetooth;
  };

  const getDeviceName = () => {
    if (device) return device.name;
    if (source) {
      if (source === 'apple_watch') return 'Apple Watch';
      if (source === 'iphone') return 'iPhone';
      if (source === 'health_app') return 'Health App';
    }
    return 'Device';
  };

  const IconComponent = getDeviceIcon();
  const deviceName = getDeviceName();

  if (compact) {
    return (
      <Badge variant="outline" className="text-xs">
        <IconComponent className="mr-1 h-3 w-3" />
        {deviceName}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <IconComponent className="h-3 w-3" />
      <span>{deviceName}</span>
    </Badge>
  );
}
