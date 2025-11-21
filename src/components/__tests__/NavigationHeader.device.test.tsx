/**
 * Integration tests for NavigationHeader with DeviceStatusIndicator
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NavigationHeader from '../NavigationHeader';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));
vi.mock('@/components/health/DeviceStatusIndicator', () => ({
  DeviceStatusIndicator: () => <div data-testid="device-status-indicator">Device Status</div>,
}));
vi.mock('@/components/live/LiveConnectionStatus', () => ({
  LiveConnectionStatus: () => <div data-testid="live-connection-status">Live Connection</div>,
}));

describe('NavigationHeader Device Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDeviceManagement as any).mockReturnValue({
      hasConnectedDevices: true,
      connectedCount: 2,
    });
  });

  it('renders DeviceStatusIndicator in header', () => {
    render(
      <NavigationHeader
        currentPageInfo={{ label: 'Dashboard', category: 'Health' }}
      />
    );

    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
  });

  it('renders DeviceStatusIndicator next to LiveConnectionStatus', () => {
    render(
      <NavigationHeader
        currentPageInfo={{ label: 'Dashboard', category: 'Health' }}
      />
    );

    const deviceIndicator = screen.getByTestId('device-status-indicator');
    const liveConnection = screen.getByTestId('live-connection-status');

    expect(deviceIndicator).toBeInTheDocument();
    expect(liveConnection).toBeInTheDocument();
  });

  it('maintains header layout with device indicator', () => {
    render(
      <NavigationHeader
        currentPageInfo={{ label: 'Dashboard', category: 'Health' }}
        healthScore={85}
      />
    );

    // All header elements should be present
    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('live-connection-status')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});
