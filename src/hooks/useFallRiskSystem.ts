/**
 * Enhanced Fall Risk Integration Hooks
 * React hooks for integrating with the enhanced fall risk system
 */

import { FallDetectionEvent } from '@/lib/enhanced-fall-detection-engine';
import { useCallback } from 'react';

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
  const handleEmergencyAlert = useCallback((alert: FallDetectionEvent) => {
    console.log('🚨 Emergency Alert:', alert);

    // In a production app, this would:
    // 1. Show immediate notification to user
    // 2. Send alerts to emergency contacts
    // 3. Potentially call emergency services based on severity
    // 4. Log the event for analysis
    // 5. Provide immediate guidance to the user

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('VitalSense Emergency Alert', {
        body: `Fall detected with ${alert.severity} severity. Emergency contacts have been notified.`,
        icon: '/favicon.ico',
        tag: 'fall-alert',
      });
    }

    // You could also dispatch to a global state management system here
    // or trigger other app-wide responses

    return alert;
  }, []);

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
