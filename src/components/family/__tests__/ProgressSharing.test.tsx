/**
 * Tests for ProgressSharing component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProgressSharing from '../ProgressSharing';
import type { ProgressShare, FamilyMember } from '@/lib/familyDashboard';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockMember = (): FamilyMember => ({
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
});

const createMockShare = (): ProgressShare => ({
  id: '1',
  type: 'achievement',
  title: 'Test Achievement',
  description: 'Test description',
  value: 100,
  unit: 'steps',
  date: new Date(),
  sharedWith: ['1'],
  reactions: [],
  isPublic: false,
});

describe('ProgressSharing', () => {
  const mockOnAdd = vi.fn();
  const mockOnAddReaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with no shares', () => {
    render(
      <ProgressSharing
        shares={[]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    expect(screen.getByText('Progress & Achievements')).toBeInTheDocument();
    expect(screen.getByText('No progress shared yet')).toBeInTheDocument();
  });

  it('renders progress shares', () => {
    const share = createMockShare();
    render(
      <ProgressSharing
        shares={[share]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('opens share dialog', () => {
    render(
      <ProgressSharing
        shares={[]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    const shareButton = screen.getByText('Share Progress');
    fireEvent.click(shareButton);

    expect(screen.getByText('Share Progress')).toBeInTheDocument();
  });

  it('adds a new share', async () => {
    render(
      <ProgressSharing
        shares={[]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    const shareButton = screen.getByText('Share Progress');
    fireEvent.click(shareButton);

    const titleInput = screen.getByPlaceholderText(/Reached/i);
    fireEvent.change(titleInput, { target: { value: 'New Achievement' } });

    const descriptionInput = screen.getByPlaceholderText(/Tell your family/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'Description here' },
    });

    const saveButton = screen.getByText('Share');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  it('adds reaction to share', () => {
    const share = createMockShare();
    render(
      <ProgressSharing
        shares={[share]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    const reactionButtons = screen.getAllByText('❤️');
    if (reactionButtons.length > 0) {
      fireEvent.click(reactionButtons[0]);
      expect(mockOnAddReaction).toHaveBeenCalledWith(share.id, 'current-user', '❤️');
    }
  });

  it('validates required fields', async () => {
    render(
      <ProgressSharing
        shares={[]}
        members={[createMockMember()]}
        onAdd={mockOnAdd}
        onAddReaction={mockOnAddReaction}
      />
    );

    const shareButton = screen.getByText('Share Progress');
    fireEvent.click(shareButton);

    // Try to save without filling required fields
    const saveButton = screen.getByText('Share');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });
});
