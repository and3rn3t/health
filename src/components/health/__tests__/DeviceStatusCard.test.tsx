/**
 * Unit tests for DeviceStatusCard component
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceStatusCard } from '../DeviceStatusCard';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');
vi.mock('../DeviceSetupWizard', () => ({
  DeviceSetupWizard: ({ onComplete, onCancel }: any) => (
    <div data-testid="device-setup-wizard">
      <button onClick={onComplete}>Complete</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockSyncDevice = vi.fn();
const mockDispatchEvent = vi.fn();

const mockDevices = [
  {
    id: 'device-1',
    name: 'iPhone 15 Pro',
    type: 'iphone',
    status: 'connected' as const,
    battery: 85,
    capabilities: {
      healthKit: true,
      realTimeSync: true,
      backgroundSync: true,
    },
  },
  {
    id: 'device-2',
    name: 'Apple Watch Series 9',
    type: 'apple_watch',
    status: 'connected' as const,
    battery: 75,
    capabilities: {
      healthKit: true,
      realTimeSync: true,
      backgroundSync: true,
    },
  },
];

describe('DeviceStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.dispatchEvent
    if (globalThis.window) {
      globalThis.window.dispatchEvent = mockDispatchEvent;
    }
    (useDeviceManagement as any).mockReturnValue({
      devices: [],
      hasConnectedDevices: false,
      connectedCount: 0,
      syncDevice: mockSyncDevice,
    });
  });

  describe('Rendering', () => {
    it('renders in compact mode', () => {
      render(<DeviceStatusCard compact={true} />);
      expect(screen.getByText('Devices')).toBeInTheDocument();
    });

    it('renders in full mode', () => {
      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('Connected Devices')).toBeInTheDocument();
    });

    it('shows device count correctly', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: mockDevices,
        hasConnectedDevices: true,
        connectedCount: 2,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('2 devices connected')).toBeInTheDocument();
    });

    it('displays connected devices with status indicators', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: mockDevices,
        hasConnectedDevices: true,
        connectedCount: 2,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Apple Watch Series 9')).toBeInTheDocument();
    });

    it('shows empty state when no devices connected', () => {
      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('No Devices Connected')).toBeInTheDocument();
      expect(screen.getByText('No devices connected')).toBeInTheDocument();
    });

    it('displays battery levels when available', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: mockDevices,
        hasConnectedDevices: true,
        connectedCount: 2,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens setup wizard when "Add Device" clicked', () => {
      render(<DeviceStatusCard compact={false} showQuickActions={true} />);

      const addButton = screen.getByText('Add Device');
      fireEvent.click(addButton);

      expect(screen.getByTestId('device-setup-wizard')).toBeInTheDocument();
    });

    it('navigates to device sync page on quick connect', () => {
      render(<DeviceStatusCard compact={false} showQuickActions={true} />);

      const connectButton = screen.getByText('Connect Device');
      fireEvent.click(connectButton);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigate',
          detail: { feature: 'device-sync' },
        })
      );
    });

    it('calls onDeviceClick callback when device clicked', () => {
      const onDeviceClick = vi.fn();
      (useDeviceManagement as any).mockReturnValue({
        devices: mockDevices,
        hasConnectedDevices: true,
        connectedCount: 2,
        syncDevice: mockSyncDevice,
      });

      render(
        <DeviceStatusCard compact={false} onDeviceClick={onDeviceClick} />
      );

      const device = screen.getByText('iPhone 15 Pro');
      fireEvent.click(device.closest('div')!);

      expect(onDeviceClick).toHaveBeenCalledWith('device-1');
    });

    it('syncs device when sync button clicked', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: mockDevices,
        hasConnectedDevices: true,
        connectedCount: 2,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);

      const syncButtons = screen.getAllByRole('button');
      const syncButton = syncButtons.find((btn) => btn.querySelector('svg'));

      if (syncButton) {
        fireEvent.click(syncButton);
        expect(mockSyncDevice).toHaveBeenCalled();
      }
    });

    it('shows "View all X devices" when more than 3 devices', () => {
      const manyDevices = Array.from({ length: 5 }, (_, i) => ({
        id: `device-${i}`,
        name: `Device ${i}`,
        type: 'health_app',
        status: 'connected' as const,
      }));

      (useDeviceManagement as any).mockReturnValue({
        devices: manyDevices,
        hasConnectedDevices: true,
        connectedCount: 5,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={true} />);
      expect(screen.getByText(/View all 5 devices/)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('respects compact prop', () => {
      const { rerender } = render(<DeviceStatusCard compact={true} />);
      expect(screen.getByText('Devices')).toBeInTheDocument();

      rerender(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('Connected Devices')).toBeInTheDocument();
    });

    it('respects showQuickActions prop', () => {
      render(<DeviceStatusCard compact={false} showQuickActions={false} />);
      expect(screen.queryByText('Add Device')).not.toBeInTheDocument();
    });

    it('handles missing props gracefully', () => {
      render(<DeviceStatusCard />);
      expect(screen.getByText('Connected Devices')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles devices without battery info', () => {
      const devicesWithoutBattery = [
        {
          id: 'device-1',
          name: 'Device 1',
          type: 'health_app',
          status: 'connected' as const,
        },
      ];

      (useDeviceManagement as any).mockReturnValue({
        devices: devicesWithoutBattery,
        hasConnectedDevices: true,
        connectedCount: 1,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);
      expect(screen.getByText('Device 1')).toBeInTheDocument();
    });

    it('handles devices with undefined status', () => {
      const devicesWithUndefinedStatus = [
        {
          id: 'device-1',
          name: 'Device 1',
          type: 'health_app',
          status: undefined,
        },
      ];

      (useDeviceManagement as any).mockReturnValue({
        devices: devicesWithUndefinedStatus,
        hasConnectedDevices: true,
        connectedCount: 1,
        syncDevice: mockSyncDevice,
      });

      render(<DeviceStatusCard compact={false} />);
      // Should not crash
      expect(screen.getByText('Device 1')).toBeInTheDocument();
    });
  });
});
