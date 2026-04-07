/**
 * Device Status Indicator Component
 * Compact device status for navigation header
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { Bluetooth, WifiOff } from '@/lib/icons';
import { DeviceStatusCard } from './DeviceStatusCard';

export function DeviceStatusIndicator() {
  const { hasConnectedDevices, connectedCount } = useDeviceManagement();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2"
          title={
            hasConnectedDevices
              ? `${connectedCount} device${connectedCount !== 1 ? 's' : ''} connected`
              : 'No devices connected'
          }
        >
          {hasConnectedDevices ? (
            <Bluetooth className="h-4 w-4 text-primary" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge
            variant={hasConnectedDevices ? 'default' : 'secondary'}
            className="h-5 min-w-5 px-1 text-xs"
          >
            {connectedCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <DeviceStatusCard compact={false} showQuickActions={true} />
      </PopoverContent>
    </Popover>
  );
}
