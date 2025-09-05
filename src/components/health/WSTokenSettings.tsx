import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getLiveHealthDataSync } from '@/lib/liveHealthDataSync';
import {
  clampTtl,
  decodeJwtExp,
  isValidTtl,
  isValidWsUrl,
} from '@/lib/wsSettings';
import { useKV } from '@github/spark/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function WSTokenSettings() {
  // Restored KV persistence for production use
  const [storedToken, setStoredToken] = useKV<string>('ws-device-token', '');

  // Empty default means: use same-origin /ws implicitly
  const [wsUrl, setWsUrl] = useKV<string>('ws-url', '');

  const [userId, setUserId] = useKV<string>('ws-user-id', 'default-user');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [draftUser, setDraftUser] = useState('');
  const [ttlSec, setTtlSec] = useState<number>(600);
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown] = useState<string>('');
  const [connected] = useState<boolean>(false);
  const [autoRefreshExp, setAutoRefreshExp] = useState<number | null>(null);
  const [lastRtt] = useState<number | null>(null);
  const [liveEnabled, setLiveEnabled] = useKV<boolean>('ws-live-enabled', true);

  // Sync global hint for ws client on mount and when stored token changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (storedToken) {
          (
            window as unknown as { __WS_DEVICE_TOKEN__?: string }
          ).__WS_DEVICE_TOKEN__ = storedToken;
        } else {
          delete (window as unknown as { __WS_DEVICE_TOKEN__?: string })
            .__WS_DEVICE_TOKEN__;
        }
        if (wsUrl) {
          (window as unknown as { __WS_URL__?: string }).__WS_URL__ = wsUrl;
        }
        // expose live-enabled as a global switch for hooks
        (
          window as unknown as { VITALSENSE_LIVE_DISABLED?: boolean }
        ).VITALSENSE_LIVE_DISABLED = !liveEnabled;
      }
    } catch {
      // ignore
    }
  }, [storedToken, wsUrl, liveEnabled]);

  // Track token expiry and connected state - DISABLED for debugging
  useEffect(() => {
    const exp = storedToken ? decodeJwtExp(storedToken) : null;
    setExpiresAt(exp ? exp * 1000 : null);
    // Polling removed to reduce console noise
  }, [storedToken, userId]);

  useEffect(() => {
    setDraft(storedToken || '');
    // Prefer same-origin when no explicit URL is set
    const defaultSameOrigin = (() => {
      try {
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        return `${proto}://${location.host}/ws`;
      } catch {
        return '';
      }
    })();
    setDraftUrl(wsUrl || defaultSameOrigin);
    setDraftUser(userId || 'default-user');
  }, [open, storedToken, wsUrl, userId]);

  const masked = storedToken
    ? `${storedToken.slice(0, 8)}…${storedToken.slice(-6)}`
    : 'not set';

  const onSave = () => {
    const url = draftUrl.trim();
    if (url && !isValidWsUrl(url)) {
      toast.error('WS URL must start with ws:// or wss://');
      return;
    }
    const ttl = Number(ttlSec) || 600;
    if (!isValidTtl(ttl)) {
      toast.error('TTL must be between 60 and 3600 seconds');
      return;
    }
    setStoredToken(draft.trim());
    setWsUrl(url);
    setUserId((draftUser || 'default-user').trim());
    setOpen(false);
    toast.success('WebSocket token saved');
  };

  const onTestConnection = () => {
    try {
      const sync = getLiveHealthDataSync(userId || 'default-user');
      const sent = sync.requestPing();
      if (!sent) toast.error('WebSocket not connected');
    } catch {
      toast.error('Unable to ping');
    }
  };

  const onClear = () => {
    setStoredToken('');
    setDraft('');
    setOpen(false);
    toast.success('WebSocket token cleared');
  };

  const onGetToken = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/device/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: draftUser || 'default-user',
          clientType: 'web_dashboard',
          ttlSec: clampTtl(ttlSec),
        }),
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          toast.error('Sign-in required to issue a device token');
          return;
        }
        throw new Error(`Failed: ${resp.status}`);
      }
      const json = (await resp.json()) as {
        ok?: boolean;
        token?: string;
        expiresIn?: number;
      };
      if (json?.token) {
        setDraft(json.token);
        setStoredToken(json.token);
        const suffix = json?.expiresIn
          ? ` (expires in ${json.expiresIn}s)`
          : '';
        toast.success('Token issued' + suffix);
      } else {
        toast.error('No token returned');
      }
    } catch {
      toast.error('Failed to get token');
    } finally {
      setLoading(false);
    }
  };

  const onGetIosToken = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/device/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: draftUser || 'default-user',
          clientType: 'ios_app',
          ttlSec: clampTtl(ttlSec),
        }),
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          toast.error('Sign-in required to issue a device token');
          return;
        }
        throw new Error(`Failed: ${resp.status}`);
      }
      const json = (await resp.json()) as {
        token?: string;
        expiresIn?: number;
      };
      if (json?.token) {
        setDraft(json.token);
        setStoredToken(json.token);
        toast.success('iOS token issued');
      } else {
        toast.error('No token returned');
      }
    } catch {
      toast.error('Failed to get iOS token');
    } finally {
      setLoading(false);
    }
  };

  // Silent auto-refresh when token is near expiry (< 2 minutes)
  useEffect(() => {
    if (!expiresAt) return;
    const remainSec = Math.floor((expiresAt - Date.now()) / 1000);
    if (
      remainSec > 0 &&
      remainSec <= 120 &&
      autoRefreshExp !== expiresAt &&
      !loading
    ) {
      // Attempt refresh; ignore errors
      (async () => {
        try {
          const resp = await fetch('/api/device/auth', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              userId: (draftUser || userId || 'default-user').trim(),
              clientType: 'web_dashboard',
              ttlSec: clampTtl(ttlSec),
            }),
          });
          if (!resp.ok) {
            if (resp.status === 401 && remainSec <= 30) {
              toast.error('Sign-in required to refresh token');
            }
          }
          const json = (await resp.json().catch(() => null)) as {
            token?: string;
          } | null;
          if (json?.token) {
            setStoredToken(json.token);
            setDraft(json.token);
          } else if (remainSec <= 30) {
            toast.error('Token refresh failed and expiry is near');
          }
        } catch {
          if (remainSec <= 30)
            toast.error('Token refresh failed and expiry is near');
        } finally {
          setAutoRefreshExp(expiresAt);
        }
      })();
    }
  }, [
    expiresAt,
    autoRefreshExp,
    loading,
    ttlSec,
    draftUser,
    userId,
    setStoredToken,
  ]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="inline-flex items-center gap-2 shadow"
              >
                <span
                  className={
                    'inline-block h-2 w-2 rounded-full ' +
                    (connected ? 'bg-green-500' : 'bg-gray-400')
                  }
                  aria-label={connected ? 'connected' : 'disconnected'}
                />
                WS Token{expiresAt ? ` (${countdown})` : ''}
                {!storedToken ? (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-medium text-black">
                    !
                  </span>
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
                {expiresAt ? (
                  <div>
                    Expires at: {new Date(expiresAt).toLocaleTimeString()} (
                    {countdown})
                  </div>
                ) : (
                  <div>No token</div>
                )}
                <div>RTT: {lastRtt != null ? `${lastRtt} ms` : '—'}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>WebSocket Device Token</DialogTitle>
            <DialogDescription>
              Paste a short-lived device token. It will be stored locally and
              appended to WS connections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="text-sm">
                <div className="font-medium">Live updates</div>
                <div className="text-muted-foreground text-xs">
                  Enable realtime WebSocket processing
                </div>
              </div>
              <Button
                variant={liveEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLiveEnabled(!liveEnabled)}
              >
                {liveEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-url">WebSocket URL</Label>
              <Input
                id="ws-url"
                type="text"
                placeholder={`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`}
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.currentTarget.value)}
                autoComplete="off"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Effective:{' '}
                <span className="font-mono">
                  {wsUrl ||
                    `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`}
                </span>
              </p>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-user">User ID</Label>
              <Input
                id="ws-user"
                type="text"
                placeholder="default-user"
                value={draftUser}
                onChange={(e) => setDraftUser(e.currentTarget.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-ttl">Token TTL (seconds)</Label>
              <Input
                id="ws-ttl"
                type="number"
                min={60}
                max={3600}
                value={ttlSec}
                onChange={(e) =>
                  setTtlSec(Number(e.currentTarget.value) || 600)
                }
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-token">Token</Label>
              <Input
                id="ws-token"
                type="text"
                placeholder="eyJhbGciOi..."
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
                autoComplete="off"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Current: <span className="font-mono">{masked}</span>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onTestConnection}>
                Test connection
              </Button>
              <Button variant="outline" onClick={onGetToken} disabled={loading}>
                {loading ? 'Issuing…' : 'Get web token'}
              </Button>
              <Button
                variant="outline"
                onClick={onGetIosToken}
                disabled={loading}
              >
                {loading ? 'Issuing…' : 'Get iOS token'}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={onClear}>
                Clear
              </Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WSTokenSettings;
