import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Conn = { connected: boolean; lastHeartbeat?: string };

export function WSHealthPanel() {
  // Note: Hidden in production by parent; keep hooks unconditional here
  const [status, setStatus] = useState<Conn>({ connected: false });
  const [wsUrl, setWsUrl] = useState<string>('');
  const [liveDisabled, setLiveDisabled] = useState<boolean>(false);
  const [demoDisabled, setDemoDisabled] = useState<boolean>(false);

  const effectiveUrl = useMemo(() => {
    if (wsUrl) return wsUrl;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      return `${proto}://${window.location.host}/ws`;
    } catch {
      return '';
    }
  }, [wsUrl]);

  useEffect(() => {
    try {
      const w = window as unknown as {
        __WS_URL__?: string;
        VITALSENSE_LIVE_DISABLED?: boolean;
        VITALSENSE_DISABLE_WEBSOCKET?: boolean;
        __WS_CONNECTION__?: Conn;
      };
      setWsUrl(w.__WS_URL__ || '');
      setLiveDisabled(!!w.VITALSENSE_LIVE_DISABLED);
      setDemoDisabled(!!w.VITALSENSE_DISABLE_WEBSOCKET);
      // Best-effort: pick up a connection pulse if the WS layer exposes it
      if (w.__WS_CONNECTION__) setStatus(w.__WS_CONNECTION__);
    } catch {
      /* noop */
    }
    const i = setInterval(() => {
      try {
        const w = window as unknown as { __WS_CONNECTION__?: Conn };
        if (w.__WS_CONNECTION__) setStatus(w.__WS_CONNECTION__);
      } catch {
        /* noop */
      }
    }, 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-40 opacity-80">
      <Card className="pointer-events-auto flex items-center gap-2 px-2 py-1 text-xs">
        {status.connected ? (
          <Wifi className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-600" />
        )}
        <span className="font-mono">{effectiveUrl}</span>
        <Badge variant={status.connected ? 'default' : 'secondary'}>
          {status.connected ? 'connected' : 'offline'}
        </Badge>
        {demoDisabled && <Badge variant="secondary">demo</Badge>}
        {liveDisabled && <Badge variant="secondary">live off</Badge>}
      </Card>
    </div>
  );
}

export default WSHealthPanel;
