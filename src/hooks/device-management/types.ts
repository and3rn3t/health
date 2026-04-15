/**
 * Device management types — shared across hooks and components.
 */

export type DeviceType =
  | 'iphone'
  | 'apple_watch'
  | 'ipad'
  | 'watch'
  | 'phone'
  | 'scale'
  | 'blood-pressure'
  | 'glucose'
  | 'smart_home'
  | 'health_app';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  battery?: number;
  model?: string;
  osVersion?: string;
  capabilities?: {
    healthKit?: boolean;
    realTimeSync?: boolean;
    backgroundSync?: boolean;
  };
  connectedAt?: string;
  lastSeen?: string;
  signalStrength?: number;
}

export interface DeviceScanResult {
  id: string;
  name: string;
  type: DeviceType;
  model?: string;
  isPaired: boolean;
  signalStrength?: number;
}
