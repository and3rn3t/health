/**
 * Unit tests for DeviceHealthMonitor component
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useOnceToast } from '@/hooks/useOnceToast';
import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceHealthMonitor } from '../DeviceHealthMonitor';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');
vi.mock('@/hooks/useOnceToast');
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DeviceHealthMonitor', () => {
  beforeEach(() => {
    // Clear all mocks to reset call history (but keep implementations)
    vi.clearAllMocks();

    // Mock useOnceToast to return a showOnce function that calls the actual toast
    // Create a fresh mock implementation for each test to avoid state leakage
    (useOnceToast as any).mockReturnValue({
      showOnce: vi.fn((id, type, message, options) => {
        // Call the actual toast function based on type
        if (type === 'warning') {
          toast.warning(message, options);
        } else if (type === 'error') {
          toast.error(message, options);
        }
      }),
      resetOnce: vi.fn(),
    });
  });

  describe('Low Battery Alerts', () => {
    it('shows warning for low battery device', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 15,
            status: 'connected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).toHaveBeenCalledWith(
        'iPhone battery is low (15%)',
        expect.objectContaining({
          description: 'Consider charging your device soon',
          duration: 5000,
        })
      );
    });

    it('does not show alert for battery above 20%', () => {
      // Clear mocks to ensure no previous test calls interfere
      vi.clearAllMocks();

      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 50,
            status: 'connected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('clears alert when battery goes above 20%', () => {
      // Mock useDeviceManagement before first render
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 15,
            status: 'connected',
          },
        ],
      });

      const { rerender } = render(<DeviceHealthMonitor />);

      // First render with low battery should trigger warning
      expect(toast.warning).toHaveBeenCalledWith(
        'iPhone battery is low (15%)',
        expect.objectContaining({
          description: 'Consider charging your device soon',
          duration: 5000,
        })
      );
      expect(toast.warning).toHaveBeenCalledTimes(1);

      // Second render with good battery - should not trigger another warning
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 50,
            status: 'connected',
          },
        ],
      });

      rerender(<DeviceHealthMonitor />);
      // Should not show another warning (useOnceToast deduplication prevents it)
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('handles multiple devices with low battery', () => {
      // Clear mocks before this test to ensure no previous test calls
      vi.clearAllMocks();

      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 15,
            status: 'connected',
          },
          {
            id: 'device-2',
            name: 'Apple Watch',
            battery: 10,
            status: 'connected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).toHaveBeenCalledTimes(2);
    });

    it('handles devices without battery info', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'Device',
            battery: undefined,
            status: 'connected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).not.toHaveBeenCalled();
    });
  });

  describe('Disconnection Alerts', () => {
    it('shows error for disconnected device', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            status: 'disconnected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.error).toHaveBeenCalledWith(
        'iPhone disconnected',
        expect.objectContaining({
          description: 'Device is no longer connected. Check your connection.',
          duration: 5000,
        })
      );
    });

    it('does not show alert for connected device', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            status: 'connected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('clears alert when device reconnects', () => {
      const { rerender } = render(<DeviceHealthMonitor />);

      // First render with disconnected device
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            status: 'disconnected',
          },
        ],
      });

      rerender(<DeviceHealthMonitor />);
      expect(toast.error).toHaveBeenCalledTimes(1);

      // Second render with connected device
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            status: 'connected',
          },
        ],
      });

      rerender(<DeviceHealthMonitor />);
      // Should not show another error
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Status Alerts', () => {
    it('shows error for device with error status', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            status: 'error',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.error).toHaveBeenCalledWith(
        'iPhone connection error',
        expect.objectContaining({
          description: 'There was an issue connecting to this device.',
          duration: 5000,
        })
      );
    });
  });

  describe('Multiple Alerts', () => {
    it('handles device with both low battery and disconnection', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            name: 'iPhone',
            battery: 15,
            status: 'disconnected',
          },
        ],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('No Devices', () => {
    it('handles empty device list', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [],
      });

      render(<DeviceHealthMonitor />);

      expect(toast.warning).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Component Rendering', () => {
    it('renders without UI (silent component)', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [],
      });

      const { container } = render(<DeviceHealthMonitor />);

      expect(container.firstChild).toBeNull();
    });
  });
});
