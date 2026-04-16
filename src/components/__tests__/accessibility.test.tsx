import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y-helpers';
import FallDetection from '@/components/health/FallDetection';
import { ConnectedDevices } from '@/components/health/ConnectedDevices';
import { DeviceStatusIndicator } from '@/components/health/DeviceStatusIndicator';
import UserSettingsPanel from '@/components/settings/UserSettingsPanel';
import { renderWithProviders } from '@/test/render';

// Mock hooks that open WebSocket connections or create timers
vi.mock('@/hooks/useLiveHealthData', () => ({
  useLiveHealthData: () => ({
    state: { connectionState: 'disconnected', metrics: [], historicalData: [], clientPresence: null, error: null },
    connectionState: 'disconnected',
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connectToHealthData: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDeviceManagement', () => ({
  useDeviceManagement: () => ({
    devices: [],
    isScanning: false,
    scanResults: [],
    startScan: vi.fn(),
    stopScan: vi.fn(),
    connectDevice: vi.fn(),
    disconnectDevice: vi.fn(),
    removeDevice: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionState: 'disconnected',
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  default: () => ({
    connectionState: 'disconnected',
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

/**
 * Component-level accessibility tests using axe-core.
 *
 * Each component is rendered in isolation and checked for WCAG 2.1 AA
 * violations. This catches missing labels, roles, aria attributes, and
 * heading hierarchy issues at the unit test level — much faster feedback
 * than waiting for E2E axe scans.
 */
describe('Component Accessibility Audits', () => {
  describe('FallDetection', () => {
    it('passes axe accessibility audit', async () => {
      const { container } = render(<FallDetection />);
      await expectNoA11yViolations(container);
    });
  });

  describe('ConnectedDevices', () => {
    it('passes axe accessibility audit', async () => {
      const { container } = renderWithProviders(<ConnectedDevices />);
      await expectNoA11yViolations(container);
    });
  });

  describe('DeviceStatusIndicator', () => {
    it('passes axe accessibility audit', async () => {
      const { container } = renderWithProviders(<DeviceStatusIndicator />);
      await expectNoA11yViolations(container);
    });
  });

  describe('UserSettingsPanel', () => {
    it('passes axe accessibility audit', async () => {
      const { container } = renderWithProviders(<UserSettingsPanel />);
      await expectNoA11yViolations(container);
    });
  });
});
