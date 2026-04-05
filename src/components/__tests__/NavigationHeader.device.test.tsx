/**
 * Integration tests for NavigationHeader with DeviceStatusIndicator
 */

import { AppleSidebarProvider } from '@/components/nav/AppleSidebar';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NavigationHeader from '../NavigationHeader';

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
  DeviceStatusIndicator: () => (
    <div data-testid="device-status-indicator">Device Status</div>
  ),
}));
vi.mock('@/components/live/LiveConnectionStatus', () => ({
  LiveConnectionStatus: () => (
    <div data-testid="live-connection-status">Live Connection</div>
  ),
}));

describe('NavigationHeader Device Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeviceManagement).mockReturnValue({
      hasConnectedDevices: true,
      connectedCount: 2,
    } as unknown as ReturnType<typeof useDeviceManagement>);
  });

  const renderWithProvider = (props: Record<string, unknown>) => {
    return render(
      <AppleSidebarProvider>
        <NavigationHeader {...props} />
      </AppleSidebarProvider>
    );
  };

  it('renders DeviceStatusIndicator in header', () => {
    renderWithProvider({
      currentPageInfo: { label: 'Dashboard', category: 'Health' },
    });

    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
  });

  it('renders DeviceStatusIndicator next to LiveConnectionStatus', () => {
    renderWithProvider({
      currentPageInfo: { label: 'Dashboard', category: 'Health' },
    });

    const deviceIndicator = screen.getByTestId('device-status-indicator');
    const liveConnection = screen.getByTestId('live-connection-status');

    expect(deviceIndicator).toBeInTheDocument();
    expect(liveConnection).toBeInTheDocument();
  });

  it('maintains header layout with device indicator', () => {
    renderWithProvider({
      currentPageInfo: { label: 'Dashboard', category: 'Health' },
      healthScore: 85,
    });

    // All header elements should be present
    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('live-connection-status')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});
