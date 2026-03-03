/**
 * Emergency Notification Service
 * Handles sending notifications to emergency contacts
 */

import type {
  EmergencyContact,
  EmergencyEvent,
  EmergencyNotification,
  ContactMethod,
  EmergencyContactSettings,
} from './emergencyContacts';
import { buildEmergencyMessage, sortContactsByPriority, getActiveContacts } from './emergencyContacts';

export class EmergencyNotificationService {
  private settings: EmergencyContactSettings;

  constructor(settings: EmergencyContactSettings) {
    this.settings = settings;
  }

  /**
   * Send notifications for an emergency event
   */
  async sendEmergencyNotifications(
    event: EmergencyEvent,
    contacts: EmergencyContact[]
  ): Promise<EmergencyNotification[]> {
    if (!this.settings.autoNotify) {
      return [];
    }

    // Filter active contacts and sort by priority
    const activeContacts = getActiveContacts(contacts);
    const sortedContacts = sortContactsByPriority(activeContacts);

    const notifications: EmergencyNotification[] = [];

    for (const contact of sortedContacts) {
      // Determine which methods to use
      const methods = this.getNotificationMethods(contact);

      for (const method of methods) {
        try {
          const notification = await this.sendNotification(
            contact,
            event,
            method
          );
          notifications.push(notification);
        } catch (error) {
          // Create failed notification
          notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            contactId: contact.id,
            contactName: contact.name,
            method,
            status: 'failed',
            message: buildEmergencyMessage(
              event,
              contact,
              this.settings.includeLocation,
              this.settings.includeHealthData
            ),
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return notifications;
  }

  /**
   * Get notification methods for a contact
   */
  private getNotificationMethods(contact: EmergencyContact): ContactMethod[] {
    if (contact.preferredMethods.includes('all')) {
      return ['sms', 'call', 'email', 'notification'];
    }
    return contact.preferredMethods;
  }

  /**
   * Send a single notification
   */
  private async sendNotification(
    contact: EmergencyContact,
    event: EmergencyEvent,
    method: ContactMethod
  ): Promise<EmergencyNotification> {
    const message = buildEmergencyMessage(
      event,
      contact,
      this.settings.includeLocation,
      this.settings.includeHealthData
    );

    const notification: EmergencyNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      contactId: contact.id,
      contactName: contact.name,
      method,
      status: 'pending',
      message,
      timestamp: new Date(),
    };

    // Simulate sending notification
    // In production, this would integrate with actual SMS/email/call services
    switch (method) {
      case 'sms':
        await this.sendSMS(contact, message);
        notification.status = 'sent';
        break;
      case 'call':
        await this.initiateCall(contact);
        notification.status = 'sent';
        break;
      case 'email':
        await this.sendEmail(contact, message);
        notification.status = 'sent';
        break;
      case 'notification':
        await this.sendBrowserNotification(contact, message);
        notification.status = 'sent';
        break;
    }

    return notification;
  }

  /**
   * Send SMS notification (simulated)
   */
  private async sendSMS(contact: EmergencyContact, message: string): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS to ${contact.phone}: ${message.substring(0, 50)}...`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Initiate phone call (simulated)
   */
  private async initiateCall(contact: EmergencyContact): Promise<void> {
    // In production, integrate with voice service (Twilio, etc.)
    console.log(`📞 Calling ${contact.phone}...`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Send email notification (simulated)
   */
  private async sendEmail(contact: EmergencyContact, message: string): Promise<void> {
    if (!contact.email) {
      throw new Error('Contact email not provided');
    }

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Email to ${contact.email}: ${message.substring(0, 50)}...`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Send browser notification
   */
  private async sendBrowserNotification(
    contact: EmergencyContact,
    message: string
  ): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Emergency Alert for ${contact.name}`, {
        body: message,
        icon: '/favicon.ico',
        tag: 'emergency-alert',
        requireInteraction: true,
      });
    } else {
      throw new Error('Browser notifications not permitted');
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: EmergencyContactSettings): void {
    this.settings = settings;
  }
}

/**
 * Create emergency event from fall detection
 */
export function createFallDetectionEvent(
  severity: 'low' | 'moderate' | 'high' | 'critical',
  location?: { latitude: number; longitude: number; address?: string }
): EmergencyEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'fall_detected',
    severity,
    timestamp: new Date(),
    location,
    contactsNotified: [],
    notifications: [],
    cancelled: false,
    resolved: false,
  };
}

/**
 * Create emergency event from high fall risk
 */
export function createHighRiskEvent(
  riskScore: number,
  location?: { latitude: number; longitude: number; address?: string }
): EmergencyEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'fall_risk_high',
    severity: riskScore > 60 ? 'high' : 'moderate',
    timestamp: new Date(),
    location,
    contactsNotified: [],
    notifications: [],
    cancelled: false,
    resolved: false,
  };
}
