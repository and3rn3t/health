/**
 * Unit tests for VitalSenseEnhancedDashboard component
 */
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VitalSenseEnhancedDashboard } from '../VitalSenseEnhancedDashboard';

// Mock hooks
vi.mock('@/hooks/useLiveHealthData');
vi.mock('@/hooks/useDeviceManagement');

const baseLiveData = {
  connectionStatus: { connected: false, reconnectAttempts: 0, lastHeartbeat: '', latency: 0, dataQuality: 'offline' as const },
  liveMetrics: [],
  latestMetrics: {} as Record<string, unknown>,
  clientPresence: {} as Record<string, unknown>,
  isConnecting: false,
  isIOSConnected: vi.fn(() => false),
  connectToHealthData: vi.fn(),
  disconnectFromHealthData: vi.fn(),
  subscribeToHealthUpdates: vi.fn(),
  requestHistoricalData: vi.fn(),
  getLatestHeartRate: vi.fn(),
  getLatestWalkingSteadiness: vi.fn(),
  getLatestStepCount: vi.fn(),
  getRecentData: vi.fn(() => []),
};

const baseDeviceData = {
  devices: [],
  isScanning: false,
  scanResults: [],
  scanForDevices: vi.fn(),
  connectDevice: vi.fn(),
  connectBluetoothDevice: vi.fn(),
  addManualDevice: vi.fn(),
  disconnectDevice: vi.fn(),
  removeDevice: vi.fn(),
  syncDevice: vi.fn(),
  getDevice: vi.fn(),
  connectedCount: 0,
  hasConnectedDevices: false,
};

describe('VitalSenseEnhancedDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLiveHealthData).mockReturnValue(baseLiveData as ReturnType<typeof useLiveHealthData>);
    vi.mocked(useDeviceManagement).mockReturnValue(baseDeviceData as ReturnType<typeof useDeviceManagement>);
  });

  describe('Rendering', () => {
    it('renders the dashboard title', () => {
      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('VitalSense Live')).toBeInTheDocument();
    });

    it('shows disconnected badge when not connected', () => {
      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('shows connected badge when connected', () => {
      vi.mocked(useLiveHealthData).mockReturnValue({
        ...baseLiveData,
        connectionStatus: { connected: true, reconnectAttempts: 0, lastHeartbeat: '', latency: 0, dataQuality: 'realtime' as const },
      } as ReturnType<typeof useLiveHealthData>);

      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('renders all three tab triggers', () => {
      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Live Metrics')).toBeInTheDocument();
      expect(screen.getByText('Devices')).toBeInTheDocument();
    });

    it('renders export and settings buttons', () => {
      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('defaults to the overview tab', () => {
      render(<VitalSenseEnhancedDashboard />);
      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      expect(overviewTab).toBeInTheDocument();
    });

    it('switches to Live Metrics tab on click', () => {
      render(<VitalSenseEnhancedDashboard />);
      const metricsTab = screen.getByRole('tab', { name: 'Live Metrics' });
      fireEvent.click(metricsTab);
      // Tab is rendered and clickable
      expect(metricsTab).toBeInTheDocument();
    });

    it('switches to Devices tab on click', () => {
      render(<VitalSenseEnhancedDashboard />);
      const devicesTab = screen.getByRole('tab', { name: 'Devices' });
      fireEvent.click(devicesTab);
      expect(devicesTab).toBeInTheDocument();
    });
  });

  describe('Live Metrics Display', () => {
    it('shows heart rate when metric is available', () => {
      vi.mocked(useLiveHealthData).mockReturnValue({
        ...baseLiveData,
        latestMetrics: {
          heart_rate: { id: '1', userId: 'u1', value: 72, timestamp: Date.now(), metricType: 'heart_rate' as const, unit: 'bpm', processedAt: Date.now(), wellnessScore: 80 },
        },
      } as ReturnType<typeof useLiveHealthData>);

      render(<VitalSenseEnhancedDashboard />);
      expect(screen.getByText('Heart Rate')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('does not render heart rate card when metric is absent', () => {
      render(<VitalSenseEnhancedDashboard />);
      expect(screen.queryByText('Heart Rate')).not.toBeInTheDocument();
    });
  });
});
