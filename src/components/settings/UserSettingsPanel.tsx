import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useKV } from '@/hooks/useCloudflareKV';
import {
  DEFAULT_SETTINGS,
  type AllSettings,
  type SyncFrequency,
  type ThemeMode,
} from '@/lib/settingsTypes';
import { Lock, Settings, Shield, Users, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Minimal iOS-like spinner component
function IOSSpinner({ size = 16 }: Readonly<{ size?: number }>) {
  let sizeClass = 'h-4 w-4';
  if (size <= 12) {
    sizeClass = 'h-3 w-3';
  } else if (size > 16) {
    sizeClass = 'h-5 w-5';
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-block ${sizeClass} animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  );
}

export default function UserSettingsPanel() {
  const [settings, setSettings] = useKV<AllSettings>(
    'user-settings',
    DEFAULT_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<
    '2fa' | 'export' | 'save' | 'reset' | null
  >(null);

  // no-op

  // Provide a safe list of timezones with graceful fallback for environments lacking Intl.supportedValuesOf
  const timeZones = useMemo<string[]>(() => {
    try {
      const anyIntl = Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      };
      if (typeof anyIntl.supportedValuesOf === 'function') {
        return anyIntl.supportedValuesOf('timeZone') ?? [];
      }
    } catch {
      // ignore
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? [tz] : ['UTC'];
  }, []);

  // Snapshot for safe reads when settings might be undefined initially
  const s: AllSettings = settings ?? DEFAULT_SETTINGS;

  // Helper to update settings using a functional updater and default fallback
  const updateSettings = (updater: (prev: AllSettings) => AllSettings) =>
    setSettings((prev) => updater(prev ?? DEFAULT_SETTINGS));

  const onSave = async () => {
    setSaving(true);
    setBusyAction('save');
    try {
      // No-op persist to ensure value exists; keeps types safe
      updateSettings((prev) => ({ ...prev }));
      toast.success('Settings saved');
    } finally {
      setSaving(false);
      setBusyAction((a) => (a === 'save' ? null : a));
    }
  };

  const onReset = async () => {
    setResetting(true);
    setBusyAction('reset');
    try {
      setSettings(DEFAULT_SETTINGS);
      toast.success('Settings reset to defaults');
    } finally {
      setResetting(false);
      setBusyAction((a) => (a === 'reset' ? null : a));
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setBusy(true);
      setBusyAction('2fa');
      const enabled = s.privacy.twoFactorEnabled;
      const path = enabled ? '/api/user/2fa/disable' : '/api/user/2fa/enable';
      const headers: Record<string, string> = { 'cache-control': 'no-store' };
      const res = await fetch(path, { method: 'POST', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        enabled?: boolean;
      };
      const next = Boolean(body.enabled);
      updateSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, twoFactorEnabled: next },
      }));
      toast.success(next ? 'Two-factor enabled' : 'Two-factor disabled');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'unknown error';
      toast.error(`2FA update failed: ${m}`);
    } finally {
      setBusy(false);
      setBusyAction((a) => (a === '2fa' ? null : a));
    }
  };

  const exportData = async () => {
    try {
      setBusy(true);
      setBusyAction('export');
      const headers: Record<string, string> = { 'cache-control': 'no-store' };
      const res = await fetch('/api/user/export', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vitalsense-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'unknown error';
      toast.error(`Export failed: ${m}`);
    } finally {
      setBusy(false);
      setBusyAction((a) => (a === 'export' ? null : a));
    }
  };

  // Provide enumerated dynamic type scale options (approx mapping to iOS categories)
  const typeScaleOptions: {
    value: string;
    label: string;
    multiplier: number;
  }[] = [
    { value: '0.875', label: 'XS', multiplier: 0.875 },
    { value: '1', label: 'Default', multiplier: 1 },
    { value: '1.125', label: 'L', multiplier: 1.125 },
    { value: '1.25', label: 'XL', multiplier: 1.25 },
    { value: '1.375', label: 'XXL', multiplier: 1.375 },
  ];

  // Backward compatibility: ensure dynamicTypeScale has default
  if (!s.preferences.dynamicTypeScale) {
    updateSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dynamicTypeScale: 1,
      },
    }));
  }

  // Local nav lock preference currently stored outside of settings (KV key). Mirror logic if passed later.
  const [lockNavOrder, setLockNavOrder] = useKV<boolean>(
    'pref-lock-nav-order',
    false
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-vitalsense-primary">
          Account & Profile
        </h1>
        <p className="text-vitalsense-gray">
          Manage your VitalSense profile and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-vitalsense-primary" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>
              Basic information for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={s.profile.displayName}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, displayName: e.target.value },
                  }))
                }
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={s.profile.email}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, email: e.target.value },
                  }))
                }
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={s.profile.phone || ''}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, phone: e.target.value },
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Language</Label>
              <Select
                value={s.preferences.language}
                onValueChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: v },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Time zone</Label>
              <Select
                value={s.profile.timeZone}
                onValueChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, timeZone: v },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timeZones.map((tz: string) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="text-vitalsense-accent h-5 w-5" />
              <span>Privacy & Security</span>
            </CardTitle>
            <CardDescription>Control how your data is used</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Data sharing</div>
                <div className="text-sm text-muted-foreground">
                  Allow anonymized usage to improve VitalSense
                </div>
              </div>
              <Switch
                checked={s.privacy.dataSharing}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    privacy: { ...prev.privacy, dataSharing: v },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Product analytics</div>
                <div className="text-sm text-muted-foreground">
                  Help us understand feature usage (first-party only)
                </div>
              </div>
              <Switch
                checked={s.privacy.analyticsTracking}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    privacy: { ...prev.privacy, analyticsTracking: v },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-factor authentication</div>
                <div className="text-sm text-muted-foreground">
                  Add an extra layer of protection
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTwoFactor}
                disabled={busy}
              >
                {busyAction === '2fa' ? (
                  <div className="flex items-center gap-2">
                    <IOSSpinner />
                    <span>
                      {s.privacy.twoFactorEnabled ? 'Disabling' : 'Enabling'}…
                    </span>
                  </div>
                ) : (
                  <span>
                    {s.privacy.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-vitalsense-secondary" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Choose what you receive</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Health alerts</div>
              <Switch
                checked={s.notifications.healthAlerts}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, healthAlerts: v },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium">Goal reminders</div>
              <Switch
                checked={s.notifications.goalReminders}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, goalReminders: v },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium">Weekly reports</div>
              <Switch
                checked={s.notifications.weeklyReports}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, weeklyReports: v },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-vitalsense-success" />
              <span>Data & Sync</span>
            </CardTitle>
            <CardDescription>Keep your data up to date</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Auto-sync</div>
              <Switch
                checked={s.dataSync.autoSync}
                onCheckedChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    dataSync: { ...prev.dataSync, autoSync: v },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Sync frequency</Label>
              <Select
                value={s.dataSync.frequency}
                onValueChange={(v) =>
                  updateSettings((prev) => ({
                    ...prev,
                    dataSync: {
                      ...prev.dataSync,
                      frequency: v as SyncFrequency,
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium">Export data</div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={busy}
              >
                {busyAction === 'export' ? (
                  <div className="flex items-center gap-2">
                    <IOSSpinner />
                    <span>Preparing…</span>
                  </div>
                ) : (
                  <span>Download</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="text-vitalsense-gray h-5 w-5" />
            <span>App Preferences</span>
          </CardTitle>
          <CardDescription>Personalize VitalSense</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select
              value={s.preferences.theme}
              onValueChange={(v) =>
                updateSettings((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, theme: v as ThemeMode },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Units</Label>
            <Select
              value={s.preferences.units}
              onValueChange={(v) =>
                updateSettings((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    units: v as 'metric' | 'imperial',
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="imperial">Imperial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Default view</Label>
            <Select
              value={s.preferences.defaultView}
              onValueChange={(v) =>
                updateSettings((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    defaultView: v as 'dashboard' | 'health-trends' | 'goals',
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="health-trends">Health Trends</SelectItem>
                <SelectItem value="goals">Goals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dynamicTypeScale">Dynamic type</Label>
            <Select
              value={String(s.preferences.dynamicTypeScale ?? 1)}
              onValueChange={(v) =>
                updateSettings((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    dynamicTypeScale: parseFloat(v) || 1,
                  },
                }))
              }
            >
              <SelectTrigger id="dynamicTypeScale">
                <SelectValue placeholder="Font size" />
              </SelectTrigger>
              <SelectContent>
                {typeScaleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjust interface text size (applies immediately)
            </p>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="lockNavOrderToggle"
              className="flex items-center gap-1"
            >
              <Lock className="h-4 w-4" /> Navigation order lock
            </Label>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="pr-4 text-sm leading-tight">
                <div className="font-medium">Lock sidebar order</div>
                <div className="text-xs text-muted-foreground">
                  Prevent adaptive quick access reordering
                </div>
              </div>
              <Switch
                id="lockNavOrderToggle"
                checked={lockNavOrder}
                onCheckedChange={(v) => setLockNavOrder(v)}
                aria-label="Toggle navigation order lock"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-2" />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onReset} disabled={resetting}>
          {resetting ? (
            <div className="flex items-center gap-2">
              <IOSSpinner />
              <span>Resetting…</span>
            </div>
          ) : (
            <span>Reset</span>
          )}
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <div className="flex items-center gap-2">
              <IOSSpinner />
              <span>Saving…</span>
            </div>
          ) : (
            <span>Save changes</span>
          )}
        </Button>
      </div>
    </div>
  );
}
