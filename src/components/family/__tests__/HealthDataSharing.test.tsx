/**
 * Tests for HealthDataSharing component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HealthDataSharing from '../HealthDataSharing';
import type { FamilyMember, HealthDataShare } from '@/lib/familyDashboard';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const createMockMember = (overrides: Partial<FamilyMember> = {}): FamilyMember => ({
  id: '1',
  name: 'Test Member',
  relationship: 'child',
  isActive: true,
  permissions: ['view-health'],
  notificationPreferences: {
    emergencyAlerts: true,
    weeklyReports: false,
    milestones: true,
    healthChanges: false,
    fallRiskAlerts: true,
    dailySummary: false,
  },
  role: 'secondary',
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('HealthDataSharing', () => {
  const mockOnUpdateShare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with no members', () => {
    render(
      <HealthDataSharing
        members={[]}
        shares={[]}
        onUpdateShare={mockOnUpdateShare}
      />
    );

    expect(screen.getByText('Health Data Sharing')).toBeInTheDocument();
    expect(screen.getByText('No active family members to share with')).toBeInTheDocument();
  });

  it('renders members with sharing options', () => {
    const members = [createMockMember()];
    render(
      <HealthDataSharing
        members={members}
        shares={[]}
        onUpdateShare={mockOnUpdateShare}
      />
    );

    expect(screen.getByText('Test Member')).toBeInTheDocument();
    expect(screen.getByText('Shared Metrics')).toBeInTheDocument();
  });

  it('shows no permissions message for members without view-health', () => {
    const member = createMockMember({ permissions: [] });
    render(
      <HealthDataSharing
        members={[member]}
        shares={[]}
        onUpdateShare={mockOnUpdateShare}
      />
    );

    expect(screen.getByText('No health data access')).toBeInTheDocument();
  });

  it('toggles metric sharing', () => {
    const members = [createMockMember()];
    const shares: HealthDataShare[] = [
      {
        id: '1',
        memberId: '1',
        sharedMetrics: ['steps'],
        lastShared: new Date(),
        frequency: 'daily',
        includeLocation: false,
        includeEmergencyData: false,
      },
    ];

    render(
      <HealthDataSharing
        members={members}
        shares={shares}
        onUpdateShare={mockOnUpdateShare}
      />
    );

    // Find and toggle a metric
    const checkboxes = screen.getAllByRole('checkbox');
    const stepsCheckbox = checkboxes.find((cb) => {
      const label = cb.closest('label');
      return label?.textContent?.includes('Steps');
    });

    if (stepsCheckbox) {
      fireEvent.click(stepsCheckbox);
      expect(mockOnUpdateShare).toHaveBeenCalled();
    }
  });

  it('updates sharing frequency', () => {
    const members = [createMockMember()];
    const shares: HealthDataShare[] = [
      {
        id: '1',
        memberId: '1',
        sharedMetrics: [],
        lastShared: new Date(),
        frequency: 'daily',
        includeLocation: false,
        includeEmergencyData: false,
      },
    ];

    render(
      <HealthDataSharing
        members={members}
        shares={shares}
        onUpdateShare={mockOnUpdateShare}
      />
    );

    const frequencySelect = screen.getByText('Daily Summary');
    fireEvent.click(frequencySelect);
    const realtimeOption = screen.getByText('Real-time');
    fireEvent.click(realtimeOption);

    expect(mockOnUpdateShare).toHaveBeenCalled();
  });
});
