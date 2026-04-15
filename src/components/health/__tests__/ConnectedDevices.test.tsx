import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectedDevices } from '../ConnectedDevices';
import { TestProviders } from '@/test/render';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';

vi.mock('@/hooks/useDeviceManagement', () => ({
  useDeviceManagement: vi.fn(),
}));

vi.mock('../DeviceSetupWizard', () => ({
  DeviceSetupWizard: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="setup-wizard">
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockedUseDeviceManagement = vi.mocked(useDeviceManagement);

const mockDevices = [
  {
    id: 'watch-1',
    name: 'Apple Watch',
    type: 'apple_watch' as const,
    status: 'connected' as const,
    batteryLevel: 85,
    lastSync: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'phone-1',
    name: 'iPhone 15',
    type: 'iphone' as const,
    status: 'disconnected' as const,
    batteryLevel: 42,
    lastSeen: new Date(Date.now() - 3600_000).toISOString(),
  },
];

const defaultMockReturn = {
  devices: mockDevices,
  connectDevice: vi.fn(),
  disconnectDevice: vi.fn(),
  removeDevice: vi.fn(),
  syncDevice: vi.fn(),
  scanForDevices: vi.fn(),
  addManualDevice: vi.fn(),
  isScanning: false,
  scanResults: [] as never[],
  hasConnectedDevices: true,
} as unknown as ReturnType<typeof useDeviceManagement>;

describe('ConnectedDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDeviceManagement.mockReturnValue(defaultMockReturn);
    // Ensure no setup flags
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('open-device-setup');
    }
  });

  it('renders heading and device list', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('Connected Devices')).toBeInTheDocument();
  });

  it('shows device names', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('Apple Watch')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
  });

  it('shows connection status badges', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('renders Add Device button', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('Add Device')).toBeInTheDocument();
  });

  it('opens setup wizard when Add Device is clicked', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    fireEvent.click(screen.getByText('Add Device'));
    expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
  });

  it('renders Connect Device button', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('Connect Device')).toBeInTheDocument();
  });
});

describe('ConnectedDevices — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDeviceManagement.mockReturnValue({
      ...defaultMockReturn,
      devices: [],
      hasConnectedDevices: false,
    });
  });

  it('shows empty state when no devices', () => {
    render(
      <TestProviders>
        <ConnectedDevices />
      </TestProviders>,
    );

    expect(screen.getByText('No Devices Connected')).toBeInTheDocument();
  });
});
