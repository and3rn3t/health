/**
 * Device Capability Detection
 * Detects device-dependent features and capabilities
 */

export interface DeviceCapabilities {
  healthKit: boolean;
  lidar: boolean;
  motionSensors: boolean;
  heartRate: boolean;
  fallDetection: boolean;
  backgroundSync: boolean;
  watchConnectivity: boolean;
  arKit: boolean;
}

export interface DeviceInfo {
  type: 'iphone' | 'apple_watch' | 'ipad' | 'unknown';
  model?: string;
  osVersion?: string;
  capabilities: DeviceCapabilities;
}

/**
 * Detect device capabilities from user agent and feature detection
 */
export function detectDeviceCapabilities(): DeviceInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isIPhone = /iPhone/.test(userAgent);
  const isIPad = /iPad/.test(userAgent);
  const isAppleWatch = /Watch/.test(userAgent);

  // Detect device type
  let deviceType: DeviceInfo['type'] = 'unknown';
  if (isAppleWatch) {
    deviceType = 'apple_watch';
  } else if (isIPhone) {
    deviceType = 'iphone';
  } else if (isIPad) {
    deviceType = 'ipad';
  }

  // Extract model information
  const modelMatch = userAgent.match(/iPhone|iPad|iPod|Watch/);
  const model = modelMatch ? modelMatch[0] : undefined;

  // Extract iOS version
  const osVersionMatch = userAgent.match(/OS (\d+)_(\d+)/);
  const osVersion = osVersionMatch
    ? `${osVersionMatch[1]}.${osVersionMatch[2]}`
    : undefined;

  // Detect capabilities
  const capabilities: DeviceCapabilities = {
    healthKit: isIOS, // HealthKit available on iOS
    lidar: detectLiDARCapability(),
    motionSensors: detectMotionSensors(),
    heartRate: isIOS, // Heart rate monitoring on iOS devices
    fallDetection: isIOS && (isIPhone || isAppleWatch), // Fall detection on iPhone/Watch
    backgroundSync: isIOS, // Background sync on iOS
    watchConnectivity: isIOS, // Watch connectivity on iOS
    arKit: detectARKitCapability(),
  };

  return {
    type: deviceType,
    model,
    osVersion,
    capabilities,
  };
}

/**
 * Detect LiDAR capability
 */
function detectLiDARCapability(): boolean {
  if (typeof window === 'undefined') return false;

  // LiDAR is available on:
  // - iPhone 12 Pro and later
  // - iPhone 13 Pro and later
  // - iPhone 14 Pro and later
  // - iPhone 15 Pro and later
  // - iPad Pro 11" (2nd gen) and later
  // - iPad Pro 12.9" (4th gen) and later

  const userAgent = navigator.userAgent;
  const isIPhonePro = /iPhone/.test(userAgent);
  const isIPadPro = /iPad/.test(userAgent);

  // Check for ARKit availability (LiDAR requires ARKit)
  if (typeof (window as any).ARKit !== 'undefined') {
    return true;
  }

  // Check user agent for Pro models (simplified detection)
  // In production, you'd want more sophisticated detection
  if (isIPhonePro || isIPadPro) {
    // Assume Pro models have LiDAR (this is simplified)
    return true;
  }

  return false;
}

/**
 * Detect motion sensors capability
 */
function detectMotionSensors(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for DeviceMotionEvent (accelerometer, gyroscope)
  if (typeof (window as any).DeviceMotionEvent !== 'undefined') {
    return true;
  }

  // Check for DeviceOrientationEvent
  if (typeof (window as any).DeviceOrientationEvent !== 'undefined') {
    return true;
  }

  return false;
}

/**
 * Detect ARKit capability
 */
function detectARKitCapability(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for WebXR (AR support)
  if (typeof (navigator as any).xr !== 'undefined') {
    return true;
  }

  // Check for ARKit in user agent
  const userAgent = navigator.userAgent;
  if (/iPhone|iPad/.test(userAgent)) {
    // iOS devices support ARKit
    return true;
  }

  return false;
}

/**
 * Request device motion permissions
 */
export async function requestMotionPermissions(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Request permission for DeviceMotionEvent
    if (typeof (window as any).DeviceMotionEvent !== 'undefined') {
      // iOS 13+ requires permission request
      if (
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      }
    }

    return true; // Permission not required or already granted
  } catch (error) {
    console.error('Failed to request motion permissions:', error);
    return false;
  }
}

/**
 * Check if device supports specific feature
 */
export function hasCapability(
  capabilities: DeviceCapabilities,
  feature: keyof DeviceCapabilities
): boolean {
  return capabilities[feature] === true;
}
