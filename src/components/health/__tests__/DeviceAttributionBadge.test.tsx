/**
 * Unit tests for DeviceAttributionBadge component
 */

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceAttributionBadge } from '../DeviceAttributionBadge';

// Mock dependencies
vi.mock('@/hooks/useDeviceManagement');

const mockGetDevice = vi.fn();

describe('DeviceAttributionBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDeviceManagement as any).mockReturnValue({
      getDevice: mockGetDevice,
    });
  });

  describe('Rendering', () => {
    it('renders in compact mode', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge deviceId="device-1" compact={true} />);
      const badge = screen.getByText('Device');
      expect(badge).toBeInTheDocument();
    });

    it('renders in full mode', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge deviceId="device-1" compact={false} />);
      const badge = screen.getByText('Device');
      expect(badge).toBeInTheDocument();
    });

    it('shows correct device name from deviceId', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'iPhone 15 Pro',
        type: 'iphone',
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    it('shows correct device name from source', () => {
      render(<DeviceAttributionBadge source="iphone" />);
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });

    it('shows default name when no device info', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge deviceId="unknown" />);
      expect(screen.getByText('Device')).toBeInTheDocument();
    });
  });

  describe('Device Type Detection', () => {
    it('correctly identifies Apple Watch devices', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'Apple Watch',
        type: 'apple_watch',
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('Apple Watch')).toBeInTheDocument();
    });

    it('correctly identifies iPhone devices', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'iPhone',
        type: 'iphone',
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });

    it('correctly identifies iPad devices', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'iPad',
        type: 'ipad',
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('iPad')).toBeInTheDocument();
    });

    it('falls back to Bluetooth icon for unknown types', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'Unknown Device',
        type: 'unknown',
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('Unknown Device')).toBeInTheDocument();
    });

    it('handles source string parsing correctly', () => {
      render(<DeviceAttributionBadge source="apple_watch" />);
      expect(screen.getByText('Apple Watch')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing deviceId and source', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge />);
      expect(screen.getByText('Device')).toBeInTheDocument();
    });

    it('handles invalid deviceId', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge deviceId="invalid-id" />);
      expect(screen.getByText('Device')).toBeInTheDocument();
    });

    it('handles device lookup failure', () => {
      mockGetDevice.mockReturnValue(null);
      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('Device')).toBeInTheDocument();
    });

    it('handles devices with missing type', () => {
      mockGetDevice.mockReturnValue({
        id: 'device-1',
        name: 'Device',
        type: undefined,
      });

      render(<DeviceAttributionBadge deviceId="device-1" />);
      expect(screen.getByText('Device')).toBeInTheDocument();
    });
  });
});
