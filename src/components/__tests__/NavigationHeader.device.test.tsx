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
vi.mock('@/hooks/useThemeMode', () => ({
  useThemeMode: () => ({
    themeMode: 'light',
    toggleThemeMode: vi.fn(),
    effectiveTheme: 'light',
  }),
}));
vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: '/' } }),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

  const renderWithProvider = () => {
    return render(
      <AppleSidebarProvider>
        <NavigationHeader />
      </AppleSidebarProvider>
    );
  };

  it('renders DeviceStatusIndicator in header', () => {
    renderWithProvider();

    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
  });

  it('renders DeviceStatusIndicator next to LiveConnectionStatus', () => {
    renderWithProvider();

    const deviceIndicator = screen.getByTestId('device-status-indicator');
    const liveConnection = screen.getByTestId('live-connection-status');

    expect(deviceIndicator).toBeInTheDocument();
    expect(liveConnection).toBeInTheDocument();
  });

  it('maintains header layout with device indicator', () => {
    renderWithProvider();

    // All header elements should be present
    expect(screen.getByTestId('device-status-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('live-connection-status')).toBeInTheDocument();
  });
});
