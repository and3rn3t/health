import { Badge } from '@/components/ui/badge';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { Wifi } from 'lucide-react';
import { useState } from 'react';

type Props = { readonly userId?: string };

export function RealtimeStatusBar({ userId = 'default-user' }: Props) {
  const { connectionStatus } = useLiveHealthData(userId);
  const [iosOnline] = useState<boolean>(false);

  // iOS connectivity monitoring disabled for debugging

  return (
    <div className="bg-card/90 border-border fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between rounded-xl border px-3 py-2 shadow backdrop-blur">
      <div className="flex items-center gap-2">
        <Wifi
          className={`h-4 w-4 ${connectionStatus.connected ? 'text-green-500' : 'text-red-500'}`}
        />
        <span className="text-foreground text-sm">
          {connectionStatus.connected ? 'Connected' : 'Disconnected'}
        </span>
        <Badge variant="secondary" className="ml-2">
          {connectionStatus.latency} ms
        </Badge>
        <Badge variant="outline" className="ml-2 capitalize">
          {connectionStatus.dataQuality}
        </Badge>
        <Badge variant={iosOnline ? 'secondary' : 'outline'} className="ml-2">
          iOS {iosOnline ? 'online' : 'offline'}
        </Badge>
      </div>
    </div>
  );
}

export default RealtimeStatusBar;
