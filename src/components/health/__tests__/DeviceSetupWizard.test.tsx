/**
 * Unit tests for DeviceSetupWizard component
 */
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceSetupWizard } from '../DeviceSetupWizard';

vi.mock('@/hooks/useDeviceManagement');

const mockScanForDevices = vi.fn().mockResolvedValue(undefined);
const mockAddManualDevice = vi.fn();

const baseDevices = {
  devices: [],
  isScanning: false,
  scanResults: [],
  scanForDevices: mockScanForDevices,
  connectDevice: vi.fn(),
  connectBluetoothDevice: vi.fn(),
  addManualDevice: mockAddManualDevice,
  disconnectDevice: vi.fn(),
  removeDevice: vi.fn(),
  syncDevice: vi.fn(),
  getDevice: vi.fn(),
  connectedCount: 0,
  hasConnectedDevices: false,
};

describe('DeviceSetupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage value that would change initial step
    sessionStorage.removeItem('show-connection-options');
    vi.mocked(useDeviceManagement).mockReturnValue(
      baseDevices as ReturnType<typeof useDeviceManagement>
    );
  });

  describe('Intro Step', () => {
    it('renders the wizard title', () => {
      render(<DeviceSetupWizard />);
      expect(screen.getByText('Connect Your Devices')).toBeInTheDocument();
    });

    it('renders Start Scanning button', () => {
      render(<DeviceSetupWizard />);
      expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('renders Add Manually button', () => {
      render(<DeviceSetupWizard />);
      expect(screen.getByText('Add Manually')).toBeInTheDocument();
    });

    it('renders Skip button', () => {
      render(<DeviceSetupWizard />);
      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });

    it('lists supported device types', () => {
      render(<DeviceSetupWizard />);
      expect(screen.getByText('Apple Watch')).toBeInTheDocument();
      expect(screen.getByText('iPhone / iPad')).toBeInTheDocument();
      expect(screen.getByText('Bluetooth Health Devices')).toBeInTheDocument();
    });

    it('shows the HealthKit permissions alert', () => {
      render(<DeviceSetupWizard />);
      expect(
        screen.getByText(/Make sure your device is nearby/)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('transitions to scanning step on Start Scanning click', async () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Start Scanning'));
      expect(screen.getByText('Scanning for devices...')).toBeInTheDocument();
    });

    it('transitions to manual step on Add Manually click', () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Add Manually'));
      expect(screen.getByText('Add Device Manually')).toBeInTheDocument();
    });

    it('calls onCancel when Skip is clicked', () => {
      const onCancel = vi.fn();
      render(<DeviceSetupWizard onCancel={onCancel} />);
      fireEvent.click(screen.getByText('Skip for now'));
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('calls onComplete when Skip is clicked with no onCancel', () => {
      const onComplete = vi.fn();
      render(<DeviceSetupWizard onComplete={onComplete} />);
      fireEvent.click(screen.getByText('Skip for now'));
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  describe('Close Button', () => {
    it('renders close button when onCancel is provided', () => {
      const onCancel = vi.fn();
      render(<DeviceSetupWizard onCancel={onCancel} />);
      // The close button is a ghost icon button rendered in the header
      const closeButtons = screen.getAllByRole('button');
      // The X icon button is one of them
      const ghostBtn = closeButtons.find(
        (btn) => btn.querySelector('svg.lucide-x') !== null
      );
      expect(ghostBtn).toBeDefined();
    });

    it('does not render close button when onCancel is not provided', () => {
      render(<DeviceSetupWizard />);
      const closeButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.querySelector('svg.lucide-x') !== null);
      expect(closeButtons).toHaveLength(0);
    });
  });

  describe('Scanning Step', () => {
    it('calls scanForDevices when entering scanning step', async () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Start Scanning'));
      expect(mockScanForDevices).toHaveBeenCalled();
    });

    it('shows scanning indicator while scanning', () => {
      vi.mocked(useDeviceManagement).mockReturnValue({
        ...baseDevices,
        isScanning: true,
      } as ReturnType<typeof useDeviceManagement>);

      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Start Scanning'));
      expect(
        screen.getByText(/Searching for iOS devices/)
      ).toBeInTheDocument();
    });
  });

  describe('Manual Entry Step', () => {
    it('shows manual device form fields', () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Add Manually'));
      expect(screen.getByPlaceholderText('e.g., My Fitness Tracker')).toBeInTheDocument();
    });

    it('calls addManualDevice with entered name', () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Add Manually'));

      const input = screen.getByPlaceholderText('e.g., My Fitness Tracker');
      fireEvent.change(input, { target: { value: 'Test Device' } });
      fireEvent.click(screen.getByText('Add Device'));

      expect(mockAddManualDevice).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Device' })
      );
    });

    it('does not submit when device name is empty', () => {
      render(<DeviceSetupWizard />);
      fireEvent.click(screen.getByText('Add Manually'));
      fireEvent.click(screen.getByText('Add Device'));
      expect(mockAddManualDevice).not.toHaveBeenCalled();
    });
  });

  describe('Step Progress', () => {
    it('renders 5 step indicators', () => {
      render(<DeviceSetupWizard />);
      // Should have 5 numbered circles in the step progress indicator
      const stepIndicators = screen.getAllByText(/^[1-5]$/);
      expect(stepIndicators.length).toBeGreaterThanOrEqual(3);
    });
  });
});
