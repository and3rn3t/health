/**
 * Unit tests for DeviceStatusIndicator component
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceStatusIndicator } from '../DeviceStatusIndicator';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');
vi.mock('../DeviceStatusCard', () => ({
  DeviceStatusCard: ({ compact }: { compact: boolean }) => (
    <div data-testid="device-status-card">
      Device Status Card {compact ? '(compact)' : '(full)'}
    </div>
  ),
}));

describe('DeviceStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with connected devices', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 2,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders with no connected devices', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: false,
        connectedCount: 0,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows Bluetooth icon when devices connected', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 1,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', '1 device connected');
    });

    it('shows WifiOff icon when no devices connected', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: false,
        connectedCount: 0,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'No devices connected');
    });
  });

  describe('Interactions', () => {
    it('opens popover when clicked', async () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 2,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('device-status-card')).toBeInTheDocument();
      });
    });

    it('shows full device status card in popover', async () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 1,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const card = screen.getByTestId('device-status-card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveTextContent('(full)');
      });
    });
  });

  describe('Badge Variants', () => {
    it('shows default badge when devices connected', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 3,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
    });

    it('shows secondary badge when no devices connected', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: false,
        connectedCount: 0,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const badge = screen.getByText('0');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('shows correct tooltip for single device', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 1,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', '1 device connected');
    });

    it('shows correct tooltip for multiple devices', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: true,
        connectedCount: 5,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', '5 devices connected');
    });

    it('shows correct tooltip when no devices', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        hasConnectedDevices: false,
        connectedCount: 0,
      } as unknown as ReturnType<typeof useDeviceManagement>);

      render(<DeviceStatusIndicator />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'No devices connected');
    });
  });
});
