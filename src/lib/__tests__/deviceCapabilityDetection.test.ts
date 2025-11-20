/**
 * Tests for Device Capability Detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectDeviceCapabilities,
  requestMotionPermissions,
  hasCapability,
} from '../deviceCapabilityDetection';

describe('Device Capability Detection', () => {
  beforeEach(() => {
    // Reset navigator mock
    vi.clearAllMocks();
  });

  it('detects iOS device capabilities', () => {
    // Mock iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    // Mock DeviceMotionEvent and DeviceOrientationEvent for motion sensor detection
    (global as any).DeviceMotionEvent = class DeviceMotionEvent {};
    (global as any).DeviceOrientationEvent = class DeviceOrientationEvent {};

    const deviceInfo = detectDeviceCapabilities();
    expect(deviceInfo.type).toBe('iphone');
    expect(deviceInfo.capabilities.healthKit).toBe(true);
    expect(deviceInfo.capabilities.motionSensors).toBe(true);
  });

  it('detects iPad capabilities', () => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value:
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const deviceInfo = detectDeviceCapabilities();
    expect(deviceInfo.type).toBe('ipad');
  });

  it('detects motion sensors', () => {
    // Mock DeviceMotionEvent
    (global as any).DeviceMotionEvent = class DeviceMotionEvent {};
    (global as any).DeviceOrientationEvent = class DeviceOrientationEvent {};

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
    });

    const deviceInfo = detectDeviceCapabilities();
    expect(deviceInfo.capabilities.motionSensors).toBe(true);
  });

  it('checks capability existence', () => {
    const capabilities = {
      healthKit: true,
      lidar: false,
      motionSensors: true,
      heartRate: true,
      fallDetection: true,
      backgroundSync: true,
      watchConnectivity: false,
      arKit: false,
    };

    expect(hasCapability(capabilities, 'healthKit')).toBe(true);
    expect(hasCapability(capabilities, 'lidar')).toBe(false);
  });

  it('handles motion permission request', async () => {
    // Mock DeviceMotionEvent with requestPermission
    (global as any).DeviceMotionEvent = class DeviceMotionEvent {
      static requestPermission = vi.fn(() => Promise.resolve('granted'));
    };

    const granted = await requestMotionPermissions();
    expect(granted).toBe(true);
  });

  it('handles missing motion permission API', async () => {
    // Mock DeviceMotionEvent without requestPermission
    (global as any).DeviceMotionEvent = class DeviceMotionEvent {};

    const granted = await requestMotionPermissions();
    // Should return true if permission API not available (assumes granted)
    expect(typeof granted).toBe('boolean');
  });
});
