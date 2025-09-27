/* eslint-env serviceworker */
/* global self, caches, fetch, console, Response, URL */

// VitalSense Service Worker
// Provides offline functionality, caching, and background sync capabilities

const STATIC_CACHE_NAME = 'vitalsense-static-v1.0.0';
const API_CACHE_NAME = 'vitalsense-api-v1.0.0';
const HEALTH_DATA_CACHE_NAME = 'vitalsense-health-data-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.css',
  '/favicon.svg',
  '/manifest.json',
  // Core app files - will be updated dynamically during build
  '/assets/index.js',
  '/assets/index.css',
  // Essential icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Removed unused API_ROUTES constant

// Health data patterns for caching
const HEALTH_DATA_PATTERNS = [
  /\/api\/health-data\/.*/,
  /\/api\/metrics\/.*/,
  /\/api\/analytics\/.*/,
];

// Network-first strategies for real-time data
const NETWORK_FIRST_PATTERNS = [
  /\/api\/live-data/,
  /\/api\/emergency/,
  /\/api\/alerts/,
  /\/ws\//,
];

// Cache-first strategies for static content
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/,
  /\.(?:css|js|woff|woff2|ttf|eot)$/,
  /\/assets\//,
  /\/icons\//,
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');

  event.waitUntil(
    (async () => {
      // Cache static assets
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      await staticCache.addAll(STATIC_ASSETS);

      // Initialize API cache
      await caches.open(API_CACHE_NAME);

      // Initialize health data cache
      await caches.open(HEALTH_DATA_CACHE_NAME);

      console.log('[ServiceWorker] Static assets cached');

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(
          (cacheName) =>
            cacheName.startsWith('vitalsense-') && !cacheName.includes('v1.0.0')
        )
        .map((cacheName) => caches.delete(cacheName));

      await Promise.all(deletePromises);

      // Take control of all clients
      await self.clients.claim();

      console.log('[ServiceWorker] Activated and cleaned old caches');
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle different request types with appropriate strategies
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    // Network-first for real-time data
    event.respondWith(networkFirst(request, API_CACHE_NAME));
  } else if (
    CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))
  ) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (url.pathname.startsWith('/api/')) {
    // Stale-while-revalidate for API data
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
  } else if (
    HEALTH_DATA_PATTERNS.some((pattern) => pattern.test(url.pathname))
  ) {
    // Special handling for health data
    event.respondWith(healthDataStrategy(request));
  } else {
    // Default: try cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  }
});

// Network-first strategy (for real-time data)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return (
        caches.match('/offline.html') ||
        new Response('Offline', { status: 503 })
      );
    }

    throw error;
  }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Failed to fetch:', request.url, error);
    throw error;
  }
}

// Stale-while-revalidate strategy (for API data)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log(
        '[ServiceWorker] Network request failed:',
        request.url,
        error
      );
      return cachedResponse;
    });

  return cachedResponse || fetchPromise;
}

// Health data specific strategy
async function healthDataStrategy(request) {
  const cache = await caches.open(HEALTH_DATA_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache health data with timestamp
      const responseClone = networkResponse.clone();
      const data = await responseClone.json();

      const enhancedData = {
        ...data,
        _cached: Date.now(),
        _offline: false,
      };

      const enhancedResponse = new Response(JSON.stringify(enhancedData), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Status': 'fresh',
        },
      });

      cache.put(request, enhancedResponse.clone());
      return enhancedResponse;
    }

    return networkResponse;
  } catch (error) {
    // Return cached data with offline indicator
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      const offlineData = {
        ...cachedData,
        _offline: true,
        _lastUpdate: cachedData._cached,
      };

      return new Response(JSON.stringify(offlineData), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Status': 'offline',
        },
      });
    }

    throw error;
  }
}

// Background sync for health data
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'health-data-sync') {
    event.waitUntil(syncHealthData());
  } else if (event.tag === 'emergency-alert-sync') {
    event.waitUntil(syncEmergencyAlerts());
  }
});

// Sync health data when connection is restored
async function syncHealthData() {
  try {
    console.log('[ServiceWorker] Syncing health data...');

    // Get pending health data from IndexedDB or local storage
    const pendingData = await getPendingHealthData();

    if (pendingData.length > 0) {
      for (const data of pendingData) {
        try {
          await fetch('/api/health-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          // Remove from pending queue
          await removePendingHealthData(data.id);
        } catch (error) {
          console.error('[ServiceWorker] Failed to sync health data:', error);
        }
      }
    }

    console.log('[ServiceWorker] Health data sync completed');
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

// Sync emergency alerts
async function syncEmergencyAlerts() {
  try {
    console.log('[ServiceWorker] Syncing emergency alerts...');

    const pendingAlerts = await getPendingEmergencyAlerts();

    for (const alert of pendingAlerts) {
      try {
        await fetch('/api/emergency/alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert),
        });

        await removePendingEmergencyAlert(alert.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync emergency alert:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Emergency alert sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);

  let notificationData = {
    title: 'VitalSense',
    body: 'New health update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'health-update',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };

      // Handle different notification types
      if (data.type === 'emergency') {
        notificationData.requireInteraction = true;
        notificationData.tag = 'emergency';
        notificationData.actions = [
          { action: 'acknowledge', title: 'Acknowledge' },
          { action: 'call-emergency', title: 'Call Emergency' },
        ];
      } else if (data.type === 'fall-risk') {
        notificationData.tag = 'fall-risk';
        notificationData.actions = [
          { action: 'view-details', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' },
        ];
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    (async () => {
      // Handle different actions
      if (action === 'call-emergency') {
        // Open emergency calling interface
        await openWindow('/emergency?action=call');
      } else if (action === 'view-details') {
        // Open health details
        await openWindow('/?action=health-details&id=' + (data.id || ''));
      } else if (action === 'acknowledge') {
        // Send acknowledgment
        try {
          await fetch('/api/emergency/acknowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId: data.id }),
          });
        } catch (error) {
          console.error('[ServiceWorker] Failed to acknowledge alert:', error);
        }
      } else {
        // Default: open the app
        await openWindow('/');
      }
    })()
  );
});

// Helper function to open or focus app window
async function openWindow(url) {
  const clients = await self.clients.matchAll({ type: 'window' });

  // Try to focus existing window
  for (const client of clients) {
    if (client.url.includes(self.registration.scope) && 'focus' in client) {
      await client.focus();
      if (client.navigate) {
        return client.navigate(url);
      }
      return client;
    }
  }

  // Open new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Utility functions for data persistence (simplified)
async function getPendingHealthData() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removePendingHealthData(id) {
  // Remove from IndexedDB
  console.log('[ServiceWorker] Removed pending health data:', id);
}

async function getPendingEmergencyAlerts() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removePendingEmergencyAlert(id) {
  // Remove from IndexedDB
  console.log('[ServiceWorker] Removed pending emergency alert:', id);
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[ServiceWorker] VitalSense Service Worker loaded successfully');
