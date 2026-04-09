/**
 * Unit tests for LandingPageOptimized component
 */
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useLiveRegion } from '@/hooks/useLiveRegion';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPageOptimized from '../LandingPageOptimized';

// Mock hooks
vi.mock('@/hooks/useDeviceManagement');
vi.mock('@/hooks/useLiveRegion');

// Mock sub-components that have their own tests
vi.mock('@/components/health/DeviceStatusCard', () => ({
  DeviceStatusCard: () => <div data-testid="device-status-card" />,
}));
vi.mock('@/components/ui/ios26-enhanced-components', () => ({
  EnhancedVitalSenseStatusCard: ({
    title,
    value,
  }: {
    title: string;
    value: string;
  }) => (
    <div data-testid="status-card">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));
vi.mock('@/components/ui/interactive-card', () => ({
  InteractiveCard: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" data-testid="interactive-card" onClick={onClick}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/ui/ios26-button-system', () => ({
  IOS26Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

const mockNavigate = vi.fn();
const mockRefresh = vi.fn();

const mockHealthData: ProcessedHealthData = {
  lastUpdated: new Date().toISOString(),
  dataQuality: {
    completeness: 0.9,
    consistency: 0.85,
    recency: 0.95,
    overall: 'good',
  },
  metrics: {
    steps: {
      daily: [{ date: '2025-01-01', value: 8500, unit: 'steps' }],
      weekly: [],
      monthly: [],
      average: 8500,
      trend: 'stable',
      variability: 0.1,
      reliability: 0.9,
      lastValue: 8500,
      percentileRank: 0.65,
    },
    heartRate: {
      daily: [{ date: '2025-01-01', value: 72, unit: 'bpm' }],
      weekly: [],
      monthly: [],
      average: 72,
      trend: 'stable',
      variability: 0.05,
      reliability: 0.95,
      lastValue: 72,
      percentileRank: 0.5,
    },
    walkingSteadiness: {
      daily: [{ date: '2025-01-01', value: 85, unit: '%' }],
      weekly: [],
      monthly: [],
      average: 85,
      trend: 'stable',
      variability: 0.03,
      reliability: 0.92,
      lastValue: 85,
      percentileRank: 0.7,
    },
    sleepHours: {
      daily: [{ date: '2025-01-01', value: 7.5, unit: 'hours' }],
      weekly: [],
      monthly: [],
      average: 7.5,
      trend: 'stable',
      variability: 0.08,
      reliability: 0.88,
      lastValue: 7.5,
      percentileRank: 0.6,
    },
  },
  insights: ['Your step count is consistent'],
  fallRiskFactors: [],
  healthScore: 82,
};

describe('LandingPageOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeviceManagement).mockReturnValue({
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
    } as ReturnType<typeof useDeviceManagement>);
    vi.mocked(useLiveRegion).mockReturnValue(vi.fn());
  });

  describe('Rendering', () => {
    it('renders time-of-day greeting', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={1.2}
        />
      );
      // One of the greetings should be present
      const greeting = screen.getByText(/Good (morning|afternoon|evening)/);
      expect(greeting).toBeInTheDocument();
    });

    it('renders quick action cards', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={1.2}
        />
      );
      expect(screen.getByText('Fall Risk Analysis')).toBeInTheDocument();
      expect(screen.getByText('Health Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    it('shows health score from health data', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={0}
        />
      );
      expect(screen.getByText('82')).toBeInTheDocument();
    });

    it('renders empty state when healthData is null', () => {
      render(
        <LandingPageOptimized
          healthData={null}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={0}
        />
      );
      // Should still render the page (greeting, quick actions)
      expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onNavigateToFeature when quick action is clicked', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={1.2}
        />
      );
      const cards = screen.getAllByTestId('interactive-card');
      fireEvent.click(cards[0]!);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Update Button', () => {
    it('renders update button when health data is present', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={0}
          onRefreshData={mockRefresh}
        />
      );
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  describe('Fall Risk Display', () => {
    it('shows fall risk value for low scores', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={0.5}
        />
      );
      // The mocked EnhancedVitalSenseStatusCard renders the value as-is
      expect(screen.getByText('Fall Risk')).toBeInTheDocument();
    });

    it('shows numeric score for elevated fall risk', () => {
      render(
        <LandingPageOptimized
          healthData={mockHealthData}
          onNavigateToFeature={mockNavigate}
          fallRiskScore={2.8}
        />
      );
      expect(screen.getByText('2.8')).toBeInTheDocument();
    });
  });
});
