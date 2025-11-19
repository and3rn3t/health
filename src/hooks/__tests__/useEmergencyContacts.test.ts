/**
 * Tests for useEmergencyContacts hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEmergencyContacts } from '../useEmergencyContacts';
import type { EmergencyContact, ContactPriority } from '@/lib/emergencyContacts';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const createMockContact = (
  name: string,
  priority: ContactPriority = 'secondary'
): EmergencyContact => ({
  id: `contact-${Date.now()}`,
  name,
  phone: '5551234567',
  email: 'test@example.com',
  relationship: 'friend',
  priority,
  preferredMethods: ['all'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  notificationCount: 0,
});

describe('useEmergencyContacts', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty contacts', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    expect(result.current.contacts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads contacts from localStorage', () => {
    const contact = createMockContact('Test Contact');
    localStorageMock.setItem(
      'vitalsense-emergency-contacts',
      JSON.stringify([contact])
    );

    const { result } = renderHook(() => useEmergencyContacts());

    expect(result.current.contacts.length).toBe(1);
    expect(result.current.contacts[0].name).toBe('Test Contact');
  });

  it('adds a contact', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'New Contact',
        phone: '5551234567',
        email: 'new@example.com',
        relationship: 'friend',
        priority: 'primary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    expect(result.current.contacts.length).toBe(1);
    expect(result.current.contacts[0].name).toBe('New Contact');
  });

  it('updates a contact', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Test Contact',
        phone: '5551234567',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    const contactId = result.current.contacts[0].id;

    act(() => {
      result.current.updateContact(contactId, { name: 'Updated Name' });
    });

    expect(result.current.contacts[0].name).toBe('Updated Name');
  });

  it('deletes a contact', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Test Contact',
        phone: '5551234567',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    const contactId = result.current.contacts[0].id;

    act(() => {
      result.current.deleteContact(contactId);
    });

    expect(result.current.contacts.length).toBe(0);
  });

  it('sets contact priority', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Test Contact',
        phone: '5551234567',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    const contactId = result.current.contacts[0].id;

    act(() => {
      result.current.setContactPriority(contactId, 'primary');
    });

    expect(result.current.contacts[0].priority).toBe('primary');
  });

  it('toggles contact active status', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Test Contact',
        phone: '5551234567',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    const contactId = result.current.contacts[0].id;

    act(() => {
      result.current.toggleContactActive(contactId);
    });

    expect(result.current.contacts[0].isActive).toBe(false);
  });

  it('gets sorted active contacts', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Secondary Contact',
        phone: '5551234567',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: true,
      });
      result.current.addContact({
        name: 'Primary Contact',
        phone: '5551234568',
        relationship: 'spouse',
        priority: 'primary',
        preferredMethods: ['all'],
        isActive: true,
      });
      result.current.addContact({
        name: 'Inactive Contact',
        phone: '5551234569',
        relationship: 'friend',
        priority: 'secondary',
        preferredMethods: ['all'],
        isActive: false,
      });
    });

    const sorted = result.current.getSortedActiveContacts();

    expect(sorted.length).toBe(2);
    expect(sorted[0].priority).toBe('primary');
    expect(sorted[1].priority).toBe('secondary');
  });

  it('gets primary contact', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    act(() => {
      result.current.addContact({
        name: 'Primary Contact',
        phone: '5551234567',
        relationship: 'spouse',
        priority: 'primary',
        preferredMethods: ['all'],
        isActive: true,
      });
    });

    const primary = result.current.getPrimaryContact();
    expect(primary).toBeTruthy();
    expect(primary?.priority).toBe('primary');
  });

  it('adds emergency event', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    const event = {
      id: 'event-1',
      type: 'fall_detected' as const,
      severity: 'high' as const,
      timestamp: new Date(),
      contactsNotified: [],
      notifications: [],
      cancelled: false,
      resolved: false,
    };

    act(() => {
      result.current.addEvent(event);
    });

    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0].id).toBe('event-1');
  });

  it('cancels an event', () => {
    const { result } = renderHook(() => useEmergencyContacts());

    const event = {
      id: 'event-1',
      type: 'fall_detected' as const,
      severity: 'high' as const,
      timestamp: new Date(),
      contactsNotified: [],
      notifications: [],
      cancelled: false,
      resolved: false,
    };

    act(() => {
      result.current.addEvent(event);
      result.current.cancelEvent('event-1');
    });

    expect(result.current.events[0].cancelled).toBe(true);
    expect(result.current.events[0].cancelledAt).toBeTruthy();
  });
});
