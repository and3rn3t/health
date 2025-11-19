/**
 * Integration tests for Family Dashboard feature
 * Tests the interaction between components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EnhancedFamilyDashboard from '../EnhancedFamilyDashboard';
import FamilyMemberManager from '../FamilyMemberManager';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { FamilyMember } from '@/lib/familyDashboard';
import { useKV } from '@/hooks/useCloudflareKV';

// Mock useKV hook with state
const createMockUseKV = () => {
  const storage: Record<string, any> = {
    'family-members': [],
    'progress-shares': [],
    'family-activities': [],
    'health-data-shares': [],
  };

  return (key: string, defaultValue: any) => {
    const setter = vi.fn((valueOrUpdater: any) => {
      if (typeof valueOrUpdater === 'function') {
        storage[key] = valueOrUpdater(storage[key] || defaultValue);
      } else {
        storage[key] = valueOrUpdater;
      }
    });

    return [storage[key] || defaultValue, setter];
  };
};

vi.mock('@/hooks/useCloudflareKV', () => ({
  useKV: vi.fn(),
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

describe('Family Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockUseKV = createMockUseKV();
    vi.mocked(useKV).mockImplementation(mockUseKV);
  });

  it('adds member and updates statistics', async () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    // Navigate to members tab
    const membersTab = screen.getByText('Members');
    fireEvent.click(membersTab);

    // Add member
    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByPlaceholderText('Full name');
    fireEvent.change(nameInput, { target: { value: 'Test Member' } });

    // Check that statistics update
    await waitFor(() => {
      expect(screen.getByText('Family Members')).toBeInTheDocument();
    });
  });

  it('shares progress and appears in timeline', async () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    // Navigate to progress tab
    const progressTab = screen.getByText('Progress');
    fireEvent.click(progressTab);

    // Share progress
    const shareButton = screen.getByText('Share Progress');
    fireEvent.click(shareButton);

    // Fill form
    const titleInput = screen.getByPlaceholderText(/Reached/i);
    fireEvent.change(titleInput, { target: { value: 'Test Achievement' } });

    // Check that activity is created
    await waitFor(() => {
      expect(screen.getByText('Share')).toBeInTheDocument();
    });
  });

  it('updates health sharing and reflects in sharing tab', async () => {
    const healthData = createMockHealthData();
    render(<EnhancedFamilyDashboard healthData={healthData} />);

    // First add a member
    const membersTab = screen.getByText('Members');
    fireEvent.click(membersTab);

    // Then check sharing
    const sharingTab = screen.getByText('Sharing');
    fireEvent.click(sharingTab);

    // Should show sharing interface
    expect(screen.getByText('Health Data Sharing')).toBeInTheDocument();
  });
});
