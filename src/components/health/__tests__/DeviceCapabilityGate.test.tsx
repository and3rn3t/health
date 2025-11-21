/**
 * Unit tests for DeviceCapabilityGate component
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceCapabilityGate } from '../DeviceCapabilityGate';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');

const mockDispatchEvent = vi.fn();

describe('DeviceCapabilityGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.dispatchEvent
    if (globalThis.window) {
      globalThis.window.dispatchEvent = mockDispatchEvent;
    }
    (useDeviceManagement as any).mockReturnValue({
      devices: [],
    });
  });

  describe('Capability Checking', () => {
    it('shows children when capability available', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            capabilities: {
              healthKit: true,
            },
          },
        ],
      });

      render(
        <DeviceCapabilityGate requiredCapability="healthKit">
          <div>Protected Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows fallback when capability missing and fallback provided', () => {
      render(
        <DeviceCapabilityGate
          requiredCapability="lidar"
          fallback={<div>Fallback Content</div>}
        >
          <div>Protected Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows connect prompt when capability missing and no fallback', () => {
      render(
        <DeviceCapabilityGate requiredCapability="lidar">
          <div>Protected Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.getByText('LiDAR capability required')).toBeInTheDocument();
      expect(screen.getByText('Connect Device')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('hides content when capability missing and showConnectPrompt=false', () => {
      render(
        <DeviceCapabilityGate
          requiredCapability="lidar"
          showConnectPrompt={false}
        >
          <div>Protected Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Connect Device')).not.toBeInTheDocument();
    });

    it('checks all capability types correctly', () => {
      const capabilities = [
        'healthKit',
        'lidar',
        'motionSensors',
        'heartRate',
        'fallDetection',
        'backgroundSync',
      ];

      capabilities.forEach((capability) => {
        (useDeviceManagement as any).mockReturnValue({
          devices: [
            {
              id: 'device-1',
              capabilities: {
                [capability]: true,
              },
            },
          ],
        });

        const { unmount } = render(
          <DeviceCapabilityGate requiredCapability={capability as any}>
            <div>Content</div>
          </DeviceCapabilityGate>
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Device Detection', () => {
    it('checks multiple devices correctly', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            capabilities: { healthKit: false },
          },
          {
            id: 'device-2',
            capabilities: { healthKit: true },
          },
        ],
      });

      render(
        <DeviceCapabilityGate requiredCapability="healthKit">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('returns true if any device has capability', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            capabilities: { lidar: false },
          },
          {
            id: 'device-2',
            capabilities: { lidar: true },
          },
        ],
      });

      render(
        <DeviceCapabilityGate requiredCapability="lidar">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles devices without capabilities object', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            capabilities: undefined,
          },
        ],
      });

      render(
        <DeviceCapabilityGate requiredCapability="healthKit">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      expect(
        screen.getByText('HealthKit capability required')
      ).toBeInTheDocument();
    });

    it('handles empty device list', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [],
      });

      render(
        <DeviceCapabilityGate requiredCapability="healthKit">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      expect(
        screen.getByText('HealthKit capability required')
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('sets session storage flag on connect click', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(
        <DeviceCapabilityGate requiredCapability="lidar">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      const connectButton = screen.getByText('Connect Device');
      fireEvent.click(connectButton);

      expect(setItemSpy).toHaveBeenCalledWith('open-device-setup', 'true');
    });

    it('navigates to device-sync route', () => {
      render(
        <DeviceCapabilityGate requiredCapability="lidar">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      const connectButton = screen.getByText('Connect Device');
      fireEvent.click(connectButton);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigate',
          detail: { feature: 'device-sync' },
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined capabilities', () => {
      (useDeviceManagement as any).mockReturnValue({
        devices: [
          {
            id: 'device-1',
            capabilities: {
              healthKit: undefined,
            },
          },
        ],
      });

      render(
        <DeviceCapabilityGate requiredCapability="healthKit">
          <div>Content</div>
        </DeviceCapabilityGate>
      );

      expect(
        screen.getByText('HealthKit capability required')
      ).toBeInTheDocument();
    });
  });
});
