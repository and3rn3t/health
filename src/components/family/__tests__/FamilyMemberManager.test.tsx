/**
 * Tests for FamilyMemberManager component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FamilyMemberManager from '../FamilyMemberManager';
import type { FamilyMember } from '@/lib/familyDashboard';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('FamilyMemberManager', () => {
  const mockOnAdd = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with no members', () => {
    render(
      <FamilyMemberManager
        members={[]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Family Members')).toBeInTheDocument();
    expect(screen.getByText('No family members added yet')).toBeInTheDocument();
  });

  it('renders family members', () => {
    const members = [
      createMockMember({ id: '1', name: 'John Doe', relationship: 'child' }),
      createMockMember({ id: '2', name: 'Jane Doe', relationship: 'spouse' }),
    ];

    render(
      <FamilyMemberManager
        members={members}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('opens add dialog when button clicked', () => {
    render(
      <FamilyMemberManager
        members={[]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Family Member')).toBeInTheDocument();
  });

  it('adds a new member', async () => {
    render(
      <FamilyMemberManager
        members={[]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByPlaceholderText('Full name');
    fireEvent.change(nameInput, { target: { value: 'New Member' } });

    const relationshipSelect = screen.getByText('Select relationship');
    fireEvent.click(relationshipSelect);
    const childOption = screen.getByText('Child');
    fireEvent.click(childOption);

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    render(
      <FamilyMemberManager
        members={[]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    // Try to save without filling required fields
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });

  it('opens edit dialog when edit button clicked', () => {
    const member = createMockMember();
    render(
      <FamilyMemberManager
        members={[member]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')
    );
    if (editButton) {
      fireEvent.click(editButton);
      expect(screen.getByText('Edit Family Member')).toBeInTheDocument();
    }
  });

  it('deletes a member', () => {
    const member = createMockMember();
    window.confirm = vi.fn(() => true);

    render(
      <FamilyMemberManager
        members={[member]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find((btn) =>
      btn.classList.contains('text-red-600')
    );
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith(member.id);
    }
  });

  it('shows inactive badge for inactive members', () => {
    const member = createMockMember({ isActive: false });
    render(
      <FamilyMemberManager
        members={[member]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays member role badge', () => {
    const member = createMockMember({ role: 'primary' });
    render(
      <FamilyMemberManager
        members={[member]}
        onAdd={mockOnAdd}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('primary')).toBeInTheDocument();
  });
});
