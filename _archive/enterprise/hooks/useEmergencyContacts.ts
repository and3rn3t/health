/**
 * Hook for managing emergency contacts
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  EmergencyContact,
  EmergencyEvent,
  EmergencyNotification,
  EmergencyContactSettings,
} from '@/lib/emergencyContacts';
import {
  createEmergencyContact,
  sortContactsByPriority,
  getActiveContacts,
  DEFAULT_EMERGENCY_SETTINGS,
} from '@/lib/emergencyContacts';

const STORAGE_KEY = 'vitalsense-emergency-contacts';
const SETTINGS_KEY = 'vitalsense-emergency-settings';
const EVENTS_KEY = 'vitalsense-emergency-events';
const MAX_EVENTS = 50;

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<EmergencyContactSettings>(DEFAULT_EMERGENCY_SETTINGS);
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Load contacts
      const storedContacts = localStorage.getItem(STORAGE_KEY);
      if (storedContacts) {
        const parsed = JSON.parse(storedContacts);
        const contactsWithDates = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          lastNotified: c.lastNotified ? new Date(c.lastNotified) : undefined,
        }));
        setContacts(contactsWithDates);
      }

      // Load settings
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setSettings({ ...DEFAULT_EMERGENCY_SETTINGS, ...JSON.parse(storedSettings) });
      }

      // Load events
      const storedEvents = localStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        const eventsWithDates = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
          cancelledAt: e.cancelledAt ? new Date(e.cancelledAt) : undefined,
          resolvedAt: e.resolvedAt ? new Date(e.resolvedAt) : undefined,
          notifications: e.notifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })),
        }));
        setEvents(eventsWithDates);
      }
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save contacts
  const saveContacts = useCallback((newContacts: EmergencyContact[]) => {
    setContacts(newContacts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
    }
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: EmergencyContactSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save emergency settings:', error);
    }
  }, []);

  // Add contact
  const addContact = useCallback(
    (contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt' | 'notificationCount'>) => {
      const newContact: EmergencyContact = {
        ...contact,
        id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationCount: 0,
      };
      saveContacts([...contacts, newContact]);
      return newContact;
    },
    [contacts, saveContacts]
  );

  // Update contact
  const updateContact = useCallback(
    (id: string, updates: Partial<EmergencyContact>) => {
      const updated = contacts.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date() }
          : c
      );
      saveContacts(updated);
    },
    [contacts, saveContacts]
  );

  // Delete contact
  const deleteContact = useCallback(
    (id: string) => {
      saveContacts(contacts.filter((c) => c.id !== id));
    },
    [contacts, saveContacts]
  );

  // Set contact priority
  const setContactPriority = useCallback(
    (id: string, priority: EmergencyContact['priority']) => {
      updateContact(id, { priority });
    },
    [updateContact]
  );

  // Toggle contact active status
  const toggleContactActive = useCallback(
    (id: string) => {
      const contact = contacts.find((c) => c.id === id);
      if (contact) {
        updateContact(id, { isActive: !contact.isActive });
      }
    },
    [contacts, updateContact]
  );

  // Get sorted active contacts
  const getSortedActiveContacts = useCallback(() => {
    return sortContactsByPriority(getActiveContacts(contacts));
  }, [contacts]);

  // Add emergency event
  const addEvent = useCallback((event: EmergencyEvent) => {
    setEvents((prev) => {
      const updated = [event, ...prev].slice(0, MAX_EVENTS);
      try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save emergency events:', error);
      }
      return updated;
    });
  }, []);

  // Update event
  const updateEvent = useCallback((id: string, updates: Partial<EmergencyEvent>) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update emergency event:', error);
      }
      return updated;
    });
  }, []);

  // Cancel event
  const cancelEvent = useCallback(
    (id: string) => {
      updateEvent(id, { cancelled: true, cancelledAt: new Date() });
    },
    [updateEvent]
  );

  // Resolve event
  const resolveEvent = useCallback(
    (id: string) => {
      updateEvent(id, { resolved: true, resolvedAt: new Date() });
    },
    [updateEvent]
  );

  // Get primary contact
  const getPrimaryContact = useCallback(() => {
    return contacts.find((c) => c.priority === 'primary' && c.isActive);
  }, [contacts]);

  // Get contact by ID
  const getContactById = useCallback(
    (id: string) => {
      return contacts.find((c) => c.id === id);
    },
    [contacts]
  );

  return {
    // State
    contacts,
    settings,
    events,
    isLoading,

    // Contact management
    addContact,
    updateContact,
    deleteContact,
    setContactPriority,
    toggleContactActive,
    getSortedActiveContacts,
    getPrimaryContact,
    getContactById,

    // Settings
    updateSettings: saveSettings,

    // Events
    addEvent,
    updateEvent,
    cancelEvent,
    resolveEvent,
  };
}
