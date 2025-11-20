/**
 * Component tests for AppleDeviceSyncDashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AppleDeviceSyncDashboard from '../AppleDeviceSyncDashboard';
import { useAppleDeviceSync } from '@/hooks/useAppleDeviceSync';

// Mock the hook
vi.mock('@/hooks/useAppleDeviceSync', () => ({
  useAppleDeviceSync: vi.fn(() => ({
    devices: [
      {
        id: 'device-1',
        name: 'iPhone 15 Pro',
        type: 'iphone',
        capabilities: {
          healthKit: true,
          lidar: true,
          motionSensors: true,
          heartRate: true,
          fallDetection: true,
          backgroundSync: true,
          watchConnectivity: true,
          arKit: true,
        },
        connectionStatus: 'connected',
        lastSync: new Date(),
        batteryLevel: 85,
      },
    ],
    syncStatus: {
      isActive: true,
      syncProgress: 75,
      metricsSynced: 150,
      errors: [],
      lastSyncTime: new Date(),
    },
    isConnected: true,
    startSync: vi.fn(),
    stopSync: vi.fn(),
    updateConfig: vi.fn(),
    getConnectionStatus: vi.fn(() => ({
      connected: true,
      latency: 50,
      dataQuality: 'excellent',
    })),
  })),
}));

describe('AppleDeviceSyncDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with devices', () => {
    render(<AppleDeviceSyncDashboard userId="test-user" />);
    expect(screen.getByText('Apple Device Sync')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  it('displays sync status', () => {
    render(<AppleDeviceSyncDashboard userId="test-user" />);
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows connected status', () => {
    render(<AppleDeviceSyncDashboard userId="test-user" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('handles start/stop sync buttons', () => {
    const mockStartSync = vi.fn();
    const mockStopSync = vi.fn();

    vi.mocked(useAppleDeviceSync).mockReturnValue({
      devices: [],
      syncStatus: { isActive: false, syncProgress: 0, metricsSynced: 0, errors: [] },
      isConnected: false,
      startSync: mockStartSync,
      stopSync: mockStopSync,
      updateConfig: vi.fn(),
      getConnectionStatus: vi.fn(() => ({ connected: false })),
    });

    render(<AppleDeviceSyncDashboard userId="test-user" />);

    const startButton = screen.getByText('Start Sync');
    fireEvent.click(startButton);
    expect(mockStartSync).toHaveBeenCalled();
  });

  it('switches between tabs', async () => {
    render(<AppleDeviceSyncDashboard userId="test-user" />);

    const errorsTab = screen.getByText('Errors');
    fireEvent.click(errorsTab);

    // Wait for tab content to render
    await waitFor(() => {
      expect(screen.getByText('No Errors')).toBeInTheDocument();
    });
  });

  it('displays device capabilities', () => {
    render(<AppleDeviceSyncDashboard userId="test-user" />);

    expect(screen.getByText('HealthKit')).toBeInTheDocument();
    expect(screen.getByText('LiDAR')).toBeInTheDocument();
  });

  it('shows no devices message when empty', () => {
    vi.mocked(useAppleDeviceSync).mockReturnValue({
      devices: [],
      syncStatus: { isActive: false, syncProgress: 0, metricsSynced: 0, errors: [] },
      isConnected: false,
      startSync: vi.fn(),
      stopSync: vi.fn(),
      updateConfig: vi.fn(),
      getConnectionStatus: vi.fn(),
    });

    render(<AppleDeviceSyncDashboard userId="test-user" />);
    expect(screen.getByText('No Devices Connected')).toBeInTheDocument();
  });
});
