/**
 * VitalSense PWA Manager
 * Handles service worker registration, PWA features, and offline functionality
 */

export class PWAManager {
  private swRegistration: ServiceWorkerRegistrationWithSync | null = null;
  private updateAvailable = false;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Removed empty constructor - using class properties initialization

  async initialize(): Promise<void> {
    await this.init();
  }

  private async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = (await navigator.serviceWorker.register(
          '/sw.js',
          {
            scope: '/',
          }
        )) as ServiceWorkerRegistrationWithSync;

        console.log('[PWA] Service Worker registered successfully');

        // Listen for updates
        this.swRegistration?.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                this.updateAvailable = true;
                this.notifyUpdate();
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleSWMessage(event);
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Register for background sync if available
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      this.setupBackgroundSync();
    }

    // Setup push notifications
    this.setupPushNotifications();
  }

  /**
   * Install the PWA
   */
  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log('[PWA] Install prompt result:', outcome);

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async updateSW(): Promise<void> {
    if (!this.swRegistration || !this.updateAvailable) {
      return;
    }

    const newWorker = this.swRegistration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page after update
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Check if PWA is installable
   */
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Check if app is running as PWA
   */
  isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true) ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('[PWA] Service worker not registered');
      return null;
    }

    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.log('[PWA] Notification permission denied');
        return null;
      }

      // Generate VAPID keys in production
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(vapidPublicKey),
      });

      console.log('[PWA] Push subscription created');

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Queue health data for background sync
   */
  async queueHealthData(data: HealthData): Promise<void> {
    if (!this.swRegistration) {
      console.error('[PWA] Service worker not registered');
      return;
    }

    try {
      // Store data for background sync
      await this.storeForSync('health-data', data);

      // Request background sync
      if (
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype
      ) {
        await this.swRegistration.sync.register('health-data-sync');
      }
    } catch (error) {
      console.error('[PWA] Failed to queue health data:', error);
    }
  }

  /**
   * Queue emergency alert for background sync
   */
  async queueEmergencyAlert(alert: EmergencyAlert): Promise<void> {
    if (!this.swRegistration) {
      console.error('[PWA] Service worker not registered');
      return;
    }

    try {
      await this.storeForSync('emergency-alert', alert);

      if (
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype
      ) {
        await this.swRegistration.sync.register('emergency-alert-sync');
      }
    } catch (error) {
      console.error('[PWA] Failed to queue emergency alert:', error);
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get app info for sharing
   */
  getAppInfo() {
    return {
      name: 'VitalSense',
      description: 'Apple Health Insights & Fall Risk Monitor',
      url: window.location.origin,
      isPWA: this.isPWA(),
      isInstallable: this.isInstallable(),
      isOnline: this.isOnline(),
    };
  }

  // Private methods

  private notifyUpdate(): void {
    // Create update notification
    const updateBanner = this.createUpdateBanner();
    document.body.appendChild(updateBanner);
  }

  private createUpdateBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="flex items-center justify-between p-4 bg-blue-600 text-white">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
          </svg>
          <span>New version available!</span>
        </div>
        <div class="space-x-2">
          <button onclick="window.pwaManager.updateSW()" class="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium">
            Update
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-3 py-1 border border-white rounded text-sm">
            Later
          </button>
        </div>
      </div>
    `;
    return banner;
  }

  private showInstallButton(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    } else {
      this.createInstallButton();
    }
  }

  private hideInstallButton(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  private createInstallButton(): void {
    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.className =
      'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    button.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
        <span>Install App</span>
      </div>
    `;
    button.onclick = () => this.installPWA();
    document.body.appendChild(button);
  }

  private handleOnline(): void {
    console.log('[PWA] Connection restored');

    // Update UI to show online status
    this.updateConnectivityUI(true);

    // Trigger background sync
    if (
      this.swRegistration &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      this.swRegistration.sync.register('health-data-sync');
      this.swRegistration.sync.register('emergency-alert-sync');
    }
  }

  private handleOffline(): void {
    console.log('[PWA] Connection lost');

    // Update UI to show offline status
    this.updateConnectivityUI(false);
  }

  private updateConnectivityUI(isOnline: boolean): void {
    const statusElement = document.getElementById('connectivity-status');
    if (statusElement) {
      statusElement.textContent = isOnline ? 'Online' : 'Offline';
      statusElement.className = isOnline ? 'text-green-600' : 'text-red-600';
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    console.log('[PWA] Background sync available');
    // Background sync setup is handled in service worker
  }

  private async setupPushNotifications(): Promise<void> {
    console.log('[PWA] Setting up push notifications');
    // Push notifications can be set up later when user opts in
  }

  private handleSWMessage(event: MessageEvent): void {
    const { data } = event;

    if (data.type === 'HEALTH_DATA_SYNCED') {
      console.log('[PWA] Health data synced successfully');
    } else if (data.type === 'EMERGENCY_ALERT_SYNCED') {
      console.log('[PWA] Emergency alert synced successfully');
    }
  }

  private async storeForSync(
    type: string,
    data: HealthData | EmergencyAlert
  ): Promise<void> {
    // In a real implementation, this would use IndexedDB
    const key = `pending_${type}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error);
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Health data interface
export interface HealthData {
  timestamp: number;
  metrics: {
    [key: string]: number | string;
  };
  source?: string;
  userId?: string;
}

// Emergency alert interface
export interface EmergencyAlert {
  timestamp: number;
  type: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// BeforeInstallPromptEvent interface for PWA installation
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend ServiceWorkerRegistration for background sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

// Initialize PWA manager when DOM is ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    window.pwaManager = new PWAManager();
    await window.pwaManager.initialize();
  });
}
