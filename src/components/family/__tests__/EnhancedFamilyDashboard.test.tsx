/**
 * Tests for EnhancedFamilyDashboard component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EnhancedFamilyDashboard from '../EnhancedFamilyDashboard';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';

// Mock useKV hook
vi.mock('@/hooks/useCloudflareKV', () => ({
  useKV: vi.fn((key: string, defaultValue: any) => {
    const mockStorage: Record<string, any> = {
      'family-members': [],
      'progress-shares': [],
      'family-activities': [],
      'health-data-shares': [],
    };
    return [mockStorage[key] || defaultValue, vi.fn()];
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockHealthData = (): ProcessedHealthData => ({
  lastUpdated: new Date().toISOString(),
  dataQuality: {
    completeness: 95,
    consistency: 92,
    recency: 98,
    overall: 'good',
  },
  metrics: {
    steps: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 7500,
      trend: 'stable',
      variability: 10,
      reliability: 90,
      lastValue: 7500,
      percentileRank: 50,
    },
    heartRate: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 70,
      trend: 'stable',
      variability: 5,
      reliability: 90,
      lastValue: 70,
      percentileRank: 50,
    },
    walkingSteadiness: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 65,
      trend: 'stable',
      variability: 8,
      reliability: 90,
      lastValue: 65,
      percentileRank: 50,
    },
    sleepHours: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 7.5,
      trend: 'stable',
      variability: 0.5,
      reliability: 90,
      lastValue: 7.5,
      percentileRank: 50,
    },
  },
  insights: [],
  fallRiskFactors: [],
  healthScore: 80,
});

describe('EnhancedFamilyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with no health data', () => {
    render(<EnhancedFamilyDashboard healthData={null} />);
    expect(screen.getByText('No Health Data')).toBeInTheDocument();
  });

  it('renders dashboard with health data', () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    expect(screen.getByText('Family Dashboard')).toBeInTheDocument();
  });

  it('displays summary cards', () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    expect(screen.getByText('Family Members')).toBeInTheDocument();
    expect(screen.getByText('Active Today')).toBeInTheDocument();
    expect(screen.getByText('Total Support')).toBeInTheDocument();
    expect(screen.getByText('New Activities')).toBeInTheDocument();
  });

  it('displays tabs', () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Sharing')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    const sharingTab = screen.getByText('Sharing');
    fireEvent.click(sharingTab);

    expect(screen.getByText('Health Data Sharing')).toBeInTheDocument();
  });

  it('displays health status in emergency tab', () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    const emergencyTab = screen.getByText('Emergency');
    fireEvent.click(emergencyTab);

    expect(screen.getByText('Emergency & Safety')).toBeInTheDocument();
    expect(screen.getByText('Current Health Status')).toBeInTheDocument();
  });
});
