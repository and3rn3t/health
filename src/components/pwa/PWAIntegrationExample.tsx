import { PWAStatusComponent } from '@/components/pwa/PWAStatusComponent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * PWA Integration Example
 * Shows how to integrate PWA features into your VitalSense app
 */
export function PWAIntegrationExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* PWA Status in Settings Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Smartphone className="h-4 w-4" />
            App Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              App Settings
            </DialogTitle>
            <DialogDescription>
              Manage your VitalSense app installation and features
            </DialogDescription>
          </DialogHeader>
          <PWAStatusComponent />
        </DialogContent>
      </Dialog>

      {/* Quick Install Button (shows only when installable) */}
      <PWAInstallButton />
    </div>
  );
}

/**
 * Standalone PWA Install Button
 * Can be placed anywhere in the app
 */
function PWAInstallButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if PWA is installable
  useEffect(() => {
    const checkInstallable = () => {
      const pwa = window.pwaManager;
      setIsInstallable(pwa?.isInstallable() || false);
    };

    // Initial check
    checkInstallable();

    // Listen for install prompt
    const handleInstallPrompt = () => checkInstallable();
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstallable(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', () => setIsInstallable(false));
    };
  }, []);

  const handleInstall = async () => {
    const pwa = window.pwaManager;
    if (!pwa) return;

    setIsInstalling(true);
    try {
      const success = await pwa.installPWA();
      if (success) {
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isInstallable) return null;

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      size="sm"
      className="flex items-center gap-2"
    >
      <Smartphone className="h-4 w-4" />
      {isInstalling ? 'Installing...' : 'Install App'}
    </Button>
  );
}

// Example of PWA status in a dashboard widget
export function PWADashboardWidget() {
  return (
    <div className="from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border bg-gradient-to-r p-4">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <Smartphone className="h-5 w-5" />
        App Status
      </h3>
      <PWAStatusComponent />
    </div>
  );
}

// Example of offline indicator
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 fixed left-0 right-0 top-0 z-50 px-4 py-2 text-center text-sm font-medium text-white">
      📡 You're offline - Health data will sync when connection is restored
    </div>
  );
}
