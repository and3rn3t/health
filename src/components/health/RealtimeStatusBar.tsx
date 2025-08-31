import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from '@phosphor-icons/react';
import { Wifi } from 'lucide-react';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { getLiveHealthDataSync } from '@/lib/liveHealthDataSync';

type Props = { readonly userId?: string };

export function RealtimeStatusBar({ userId = 'default-user' }: Props) {
  const { connectionStatus, pendingEmergency, cancelPendingEmergency } =
    useLiveHealthData(userId);
  const [iosOnline, setIosOnline] = useState<boolean>(false);

  useEffect(() => {
    const i = setInterval(() => {
      try {
        const sync = getLiveHealthDataSync(userId);
        setIosOnline(sync.isIosOnline());
      } catch {
        /* noop */
      }
    }, 2000);
    return () => clearInterval(i);
  }, [userId]);

  const remainingSec = useMemo(() => {
    if (!pendingEmergency) return 0;
    const ms = Math.max(0, pendingEmergency.expiresAt - Date.now());
    return Math.ceil(ms / 1000);
  }, [pendingEmergency]);

  return (
    <div className="border-border bg-card/90 fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between rounded-xl border px-3 py-2 shadow backdrop-blur">
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

      {pendingEmergency ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Emergency in {remainingSec}s</span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={cancelPendingEmergency}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default RealtimeStatusBar;
