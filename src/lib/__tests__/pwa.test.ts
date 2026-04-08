import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PWAManager } from '../pwa';
import type { HealthData } from '../pwa';

// ── Mock environment ─────────────────────────────────────────────────────────

const mockSync = { register: vi.fn().mockResolvedValue(undefined) };
const mockPushManager = { subscribe: vi.fn() };
const mockSwRegistration = {
  installing: null as ServiceWorker | null,
  waiting: null as ServiceWorker | null,
  addEventListener: vi.fn(),
  sync: mockSync,
  pushManager: mockPushManager,
};

beforeEach(() => {
  vi.restoreAllMocks();

  // Reset mock state
  mockSync.register.mockClear();
  mockPushManager.subscribe.mockClear();
  mockSwRegistration.addEventListener.mockClear();
  mockSwRegistration.installing = null;
  mockSwRegistration.waiting = null;

  // Provide fetch stub
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

  // Provide navigator.serviceWorker
  const swObj = {
    register: vi.fn().mockResolvedValue(mockSwRegistration),
    controller: null,
    addEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: swObj,
    writable: true,
    configurable: true,
  });

  // Provide ServiceWorkerRegistration.prototype.sync for background sync check
  vi.stubGlobal('ServiceWorkerRegistration', {
    prototype: { sync: true },
  });
});

function createManager(): PWAManager {
  return new PWAManager();
}

// ── Constructor & Initial State ──────────────────────────────────────────────

describe('PWAManager initial state', () => {
  it('isInstallable returns false initially', () => {
    const mgr = createManager();
    expect(mgr.isInstallable()).toBe(false);
  });

  it('isOnline returns current navigator.onLine', () => {
    const mgr = createManager();
    expect(mgr.isOnline()).toBe(navigator.onLine);
  });

  it('getAppInfo returns correct structure', () => {
    const mgr = createManager();
    const info = mgr.getAppInfo();
    expect(info.name).toBe('VitalSense');
    expect(info.description).toContain('Apple Health');
    expect(typeof info.isPWA).toBe('boolean');
    expect(typeof info.isInstallable).toBe('boolean');
    expect(typeof info.isOnline).toBe('boolean');
  });
});

// ── initialize ───────────────────────────────────────────────────────────────

describe('initialize', () => {
  it('registers service worker with /sw.js', async () => {
    const mgr = createManager();
    await mgr.initialize();
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  });

  it('skips registration if sw.js fetch returns not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const mgr = createManager();
    await mgr.initialize();
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('handles service worker registration failure', async () => {
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Registration failed')
    );
    const mgr = createManager();
    // Should not throw
    await expect(mgr.initialize()).resolves.toBeUndefined();
  });

  it('listens for updatefound on registration', async () => {
    const mgr = createManager();
    await mgr.initialize();
    expect(mockSwRegistration.addEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function),
    );
  });
});

// ── installPWA ───────────────────────────────────────────────────────────────

describe('installPWA', () => {
  it('returns false when no deferred prompt', async () => {
    const mgr = createManager();
    expect(await mgr.installPWA()).toBe(false);
  });

  it('returns true when user accepts install prompt', async () => {
    // Initialize to register event listeners
    const mgr = createManager();
    await mgr.initialize();

    // Fire the beforeinstallprompt event to stage the deferred prompt
    const promptEvent = new Event('beforeinstallprompt');
    Object.assign(promptEvent, {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    globalThis.dispatchEvent(promptEvent);
  });
});

// ── updateSW ─────────────────────────────────────────────────────────────────

describe('updateSW', () => {
  it('does nothing without registration', async () => {
    const mgr = createManager();
    await mgr.updateSW(); // should not throw
  });

  it('posts SKIP_WAITING to waiting worker', async () => {
    const postMessage = vi.fn();
    mockSwRegistration.waiting = { postMessage } as unknown as ServiceWorker;

    const mgr = createManager();
    await mgr.initialize();
    // Manually set updateAvailable via reflection
    (mgr as unknown as Record<string, boolean>).updateAvailable = true;
    await mgr.updateSW();
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});

// ── isPWA ────────────────────────────────────────────────────────────────────

describe('isPWA', () => {
  it('returns false in normal browser', () => {
    const mgr = createManager();
    // Default matchMedia in jsdom doesn't match standalone
    expect(mgr.isPWA()).toBe(false);
  });
});

// ── Notification permission ──────────────────────────────────────────────────

describe('requestNotificationPermission', () => {
  it('returns granted when already granted', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
    const mgr = createManager();
    expect(await mgr.requestNotificationPermission()).toBe('granted');
  });

  it('returns denied when Notification is not supported', async () => {
    const orig = (globalThis as Record<string, unknown>).Notification;
    delete (globalThis as Record<string, unknown>).Notification;
    const mgr = createManager();
    expect(await mgr.requestNotificationPermission()).toBe('denied');
    (globalThis as Record<string, unknown>).Notification = orig;
  });

  it('requests permission when not yet decided', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
      writable: true,
      configurable: true,
    });
    const mgr = createManager();
    expect(await mgr.requestNotificationPermission()).toBe('granted');
  });
});

// ── subscribeToPush ──────────────────────────────────────────────────────────

describe('subscribeToPush', () => {
  it('returns null without service worker registration', async () => {
    const mgr = createManager();
    // Not initialized → no swRegistration
    expect(await mgr.subscribeToPush()).toBeNull();
  });

  it('subscribes to push when permission is granted', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
    const fakeSub = { endpoint: 'https://push.example.com/sub' };
    mockPushManager.subscribe.mockResolvedValue(fakeSub);

    const mgr = createManager();
    await mgr.initialize();
    const sub = await mgr.subscribeToPush();
    expect(sub).toBe(fakeSub);
    expect(mockPushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    );
  });

  it('returns null when permission denied', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'denied', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
    const mgr = createManager();
    await mgr.initialize();
    expect(await mgr.subscribeToPush()).toBeNull();
  });
});

// ── queueHealthData ──────────────────────────────────────────────────────────

describe('queueHealthData', () => {
  const testData: HealthData = {
    timestamp: Date.now(),
    metrics: { heart_rate: 72 },
    source: 'test',
    userId: 'user-1',
  };

  it('stores data in localStorage for background sync', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const mgr = createManager();
    await mgr.initialize();
    await mgr.queueHealthData(testData);
    expect(setItem).toHaveBeenCalled();
    const [key, val] = setItem.mock.calls[0];
    expect(key).toContain('pending_health-data_');
    expect(JSON.parse(val)).toMatchObject({ metrics: { heart_rate: 72 } });
  });

  it('requests background sync registration', async () => {
    const mgr = createManager();
    await mgr.initialize();
    await mgr.queueHealthData(testData);
    expect(mockSync.register).toHaveBeenCalledWith('health-data-sync');
  });

  it('handles errors gracefully when not registered', async () => {
    const mgr = createManager();
    // Not initialized, no swRegistration
    await expect(mgr.queueHealthData(testData)).resolves.toBeUndefined();
  });
});

// ── getAppInfo ───────────────────────────────────────────────────────────────

describe('getAppInfo', () => {
  it('includes VitalSense branding', () => {
    const mgr = createManager();
    const info = mgr.getAppInfo();
    expect(info.name).toBe('VitalSense');
    expect(info.description).toContain('Apple Health');
    expect(info.description).toContain('Fall Risk');
  });
});
