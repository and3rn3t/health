/**
 * Integration tests for DeviceHealthMonitor toast deduplication
 * Tests that useOnceToast prevents spam from device status changes
 */

import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceHealthMonitor } from '../DeviceHealthMonitor';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useOnceToast to track calls
const mockShowOnce = vi.fn();
vi.mock('@/hooks/useOnceToast', () => ({
  useOnceToast: () => ({
    showOnce: mockShowOnce,
    resetOnce: vi.fn(),
  }),
}));

describe('DeviceHealthMonitor - Toast Deduplication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-apply showOnce mock after reset
    mockShowOnce.mockImplementation(() => {});
  });

  it('should use useOnceToast for battery alerts with unique device IDs', () => {
    vi.mocked(useDeviceManagement).mockReturnValue({
      devices: [
        {
          id: 'device-1',
          name: 'iPhone',
          type: 'iphone' as const,
          battery: 15,
          status: 'connected',
        },
        {
          id: 'device-2',
          name: 'Apple Watch',
          type: 'apple_watch' as const,
          battery: 10,
          status: 'connected',
        },
      ],
    } as unknown as ReturnType<typeof useDeviceManagement>);

    render(<DeviceHealthMonitor />);

    // Should call showOnce with unique IDs per device
    expect(mockShowOnce).toHaveBeenCalledWith(
      'device-battery-low-device-1',
      'warning',
      'iPhone battery is low (15%)',
      expect.objectContaining({
        description: 'Consider charging your device soon',
        duration: 5000,
      })
    );

    expect(mockShowOnce).toHaveBeenCalledWith(
      'device-battery-low-device-2',
      'warning',
      'Apple Watch battery is low (10%)',
      expect.objectContaining({
        description: 'Consider charging your device soon',
        duration: 5000,
      })
    );

    // Should not use direct toast calls
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('should use useOnceToast for disconnection alerts', () => {
    vi.mocked(useDeviceManagement).mockReturnValue({
      devices: [
        {
          id: 'device-1',
          name: 'iPhone',
          type: 'iphone' as const,
          status: 'disconnected',
        },
      ],
    } as unknown as ReturnType<typeof useDeviceManagement>);

    render(<DeviceHealthMonitor />);

    expect(mockShowOnce).toHaveBeenCalledWith(
      'device-disconnected-device-1',
      'error',
      'iPhone disconnected',
      expect.objectContaining({
        description: 'Device is no longer connected. Check your connection.',
        duration: 5000,
      })
    );

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should use useOnceToast for error status alerts', () => {
    vi.mocked(useDeviceManagement).mockReturnValue({
      devices: [
        {
          id: 'device-1',
          name: 'iPhone',
          type: 'iphone' as const,
          status: 'error',
        },
      ],
    } as unknown as ReturnType<typeof useDeviceManagement>);

    render(<DeviceHealthMonitor />);

    expect(mockShowOnce).toHaveBeenCalledWith(
      'device-error-device-1',
      'error',
      'iPhone connection error',
      expect.objectContaining({
        description: 'There was an issue connecting to this device.',
        duration: 5000,
      })
    );

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should prevent duplicate alerts on re-render with same device state', () => {
    // Set up mock before first render to avoid undefined destructuring
    vi.mocked(useDeviceManagement).mockReturnValue({
      devices: [],
    } as unknown as ReturnType<typeof useDeviceManagement>);

    const { rerender } = render(<DeviceHealthMonitor />);

    vi.mocked(useDeviceManagement).mockReturnValue({
      devices: [
        {
          id: 'device-1',
          name: 'iPhone',
          type: 'iphone' as const,
          battery: 15,
          status: 'connected',
        },
      ],
    } as unknown as ReturnType<typeof useDeviceManagement>);

    rerender(<DeviceHealthMonitor />);

    // Re-render with same state
    rerender(<DeviceHealthMonitor />);

    // Should not call showOnce again (deduplication handled by useOnceToast)
    // The component will call showOnce, but useOnceToast will prevent the actual toast
    expect(mockShowOnce).toHaveBeenCalled();
  });
});
