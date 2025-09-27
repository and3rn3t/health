import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bell,
  Download,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  notificationPermission: NotificationPermission;
  hasServiceWorker: boolean;
}

export function PWAStatusComponent() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    notificationPermission: 'default',
    hasServiceWorker: false,
  });

  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA events
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const updateStatus = () => {
    const pwa = window.pwaManager;

    setStatus({
      isInstalled: pwa?.isPWA() || false,
      isInstallable: pwa?.isInstallable() || false,
      isOnline: navigator.onLine,
      isUpdateAvailable: false, // Will be updated by service worker
      notificationPermission:
        'Notification' in window ? Notification.permission : 'denied',
      hasServiceWorker: 'serviceWorker' in navigator,
    });
  };

  const handleInstallPrompt = (e: Event) => {
    e.preventDefault();
    updateStatus();
  };

  const handleAppInstalled = () => {
    updateStatus();
  };

  const handleInstall = async () => {
    const pwa = window.pwaManager;
    if (!pwa) return;

    setIsInstalling(true);
    try {
      const success = await pwa.installPWA();
      if (success) {
        updateStatus();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    const pwa = window.pwaManager;
    if (!pwa) return;

    setIsUpdating(true);
    try {
      await pwa.updateSW();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationRequest = async () => {
    const pwa = window.pwaManager;
    if (!pwa) return;

    try {
      const permission = await pwa.requestNotificationPermission();
      if (permission === 'granted') {
        await pwa.subscribeToPush();
      }
      updateStatus();
    } catch (error) {
      console.error('Notification setup failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Status
        </CardTitle>
        <CardDescription>
          Progressive Web App features and connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.isOnline ? (
              <Wifi className="text-green-600 h-4 w-4" />
            ) : (
              <WifiOff className="text-red-600 h-4 w-4" />
            )}
            <span className="text-sm font-medium">Connection</span>
          </div>
          <Badge variant={status.isOnline ? 'default' : 'destructive'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Installation</span>
          </div>
          <div className="flex items-center gap-2">
            {status.isInstalled ? (
              <Badge variant="default">Installed</Badge>
            ) : status.isInstallable ? (
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="text-xs h-6 px-2"
              >
                {isInstalling && (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                )}
                Install
              </Button>
            ) : (
              <Badge variant="secondary">Not Available</Badge>
            )}
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Offline Support</span>
          </div>
          <Badge variant={status.hasServiceWorker ? 'default' : 'secondary'}>
            {status.hasServiceWorker ? 'Active' : 'Disabled'}
          </Badge>
        </div>

        {/* Update Status */}
        {status.isUpdateAvailable && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">Update Available</span>
            </div>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="text-xs h-6 px-2"
            >
              {isUpdating && (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              )}
              Update
            </Button>
          </div>
        )}

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {status.notificationPermission === 'granted' ? (
              <Badge variant="default">Enabled</Badge>
            ) : status.notificationPermission === 'denied' ? (
              <Badge variant="destructive">Blocked</Badge>
            ) : (
              <Button
                size="sm"
                onClick={handleNotificationRequest}
                className="text-xs h-6 px-2"
              >
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* PWA Features */}
        <div className="border-t pt-2">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Available Features</span>
          </div>
          <div className="text-xs grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${status.hasServiceWorker ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              Offline Mode
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${status.notificationPermission === 'granted' ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              Push Alerts
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${status.isInstalled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              Home Screen
            </div>
            <div className="flex items-center gap-1">
              <div className="bg-green-500 h-2 w-2 rounded-full" />
              Background Sync
            </div>
          </div>
        </div>

        {/* Help Text */}
        {!status.isInstalled && status.isInstallable && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <Settings className="h-3 w-3 mr-1 inline" />
              Install VitalSense for the best experience with offline access and
              native app features.
            </p>
          </div>
        )}

        {!status.isOnline && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <WifiOff className="h-3 w-3 mr-1 inline" />
              You're offline. Health data will sync when connection is restored.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
