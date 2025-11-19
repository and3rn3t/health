/**
 * Enhanced Fall Risk Integration Hooks
 * React hooks for integrating with the enhanced fall risk system
 */

import { FallDetectionEvent } from '@/lib/enhanced-fall-detection-engine';
import { useCallback } from 'react';
import { useEmergencyContacts } from './useEmergencyContacts';
import { EmergencyNotificationService, createFallDetectionEvent } from '@/lib/emergencyNotificationService';

interface StoredIntervention {
  id: string;
  startDate: string;
  status: 'active' | 'completed' | 'paused';
  completedDate?: string;
}

/**
 * Hook for handling emergency alerts from the fall risk system
 */
export function useEmergencyAlerts() {
  const { contacts, settings, addEvent } = useEmergencyContacts();

  const handleEmergencyAlert = useCallback(
    async (alert: FallDetectionEvent) => {
      console.log('🚨 Emergency Alert:', alert);

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('VitalSense Emergency Alert', {
          body: `Fall detected with ${alert.severity} severity. Emergency contacts have been notified.`,
          icon: '/favicon.ico',
          tag: 'fall-alert',
        });
      }

      // Create emergency event
      // Note: FallDetectionEvent.location is a string, not coordinates
      // In production, you'd get actual coordinates from geolocation API
      const event = createFallDetectionEvent(
        alert.severity === 'critical' ? 'critical' :
        alert.severity === 'severe' ? 'high' :
        alert.severity === 'moderate' ? 'moderate' : 'low',
        undefined // Location would be fetched from geolocation API in production
      );

      // Send notifications if enabled
      if (settings.autoNotify && settings.notifyOnFallDetection) {
        const notificationService = new EmergencyNotificationService(settings);
        const notifications = await notificationService.sendEmergencyNotifications(
          event,
          contacts
        );

        event.notifications = notifications;
        event.contactsNotified = notifications.map((n) => n.contactId);
      }

      // Save event to history
      addEvent(event);

      return alert;
    },
    [contacts, settings, addEvent]
  );

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    handleEmergencyAlert,
    requestNotificationPermission,
  };
}

/**
 * Hook for handling intervention management
 */
export function useInterventionManager() {
  const handleInterventionStart = useCallback((interventionId: string) => {
    console.log('🎯 Starting intervention:', interventionId);

    // In a production app, this would:
    // 1. Initialize intervention tracking in the database
    // 2. Set up progress monitoring and reminders
    // 3. Schedule check-ins and follow-ups
    // 4. Connect with healthcare providers if needed
    // 5. Track user engagement and compliance

    // Store intervention start in local storage for now
    const interventions = JSON.parse(
      localStorage.getItem('vitalsense-interventions') || '[]'
    );

    interventions.push({
      id: interventionId,
      startDate: new Date().toISOString(),
      status: 'active',
    });

    localStorage.setItem(
      'vitalsense-interventions',
      JSON.stringify(interventions)
    );

    return interventionId;
  }, []);

  const getActiveInterventions = useCallback(() => {
    const interventions: StoredIntervention[] = JSON.parse(
      localStorage.getItem('vitalsense-interventions') || '[]'
    );

    return interventions.filter(
      (i: StoredIntervention) => i.status === 'active'
    );
  }, []);

  const completeIntervention = useCallback((interventionId: string) => {
    const interventions: StoredIntervention[] = JSON.parse(
      localStorage.getItem('vitalsense-interventions') || '[]'
    );

    const updated = interventions.map((i: StoredIntervention) =>
      i.id === interventionId
        ? {
            ...i,
            status: 'completed' as const,
            completedDate: new Date().toISOString(),
          }
        : i
    );

    localStorage.setItem('vitalsense-interventions', JSON.stringify(updated));

    return interventionId;
  }, []);

  return {
    handleInterventionStart,
    getActiveInterventions,
    completeIntervention,
  };
}

/**
 * Combined hook for fall risk system integration
 */
export function useFallRiskSystem() {
  const { handleEmergencyAlert, requestNotificationPermission } =
    useEmergencyAlerts();
  const {
    handleInterventionStart,
    getActiveInterventions,
    completeIntervention,
  } = useInterventionManager();

  return {
    // Emergency handling
    handleEmergencyAlert,
    requestNotificationPermission,

    // Intervention management
    handleInterventionStart,
    getActiveInterventions,
    completeIntervention,
  };
}
