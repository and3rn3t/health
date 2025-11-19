/**
 * Emergency Contacts Types and Utilities
 * Comprehensive emergency contact management system
 */

export type ContactMethod = 'sms' | 'call' | 'email' | 'notification' | 'all';
export type ContactPriority = 'primary' | 'secondary' | 'tertiary';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: ContactPriority;
  preferredMethods: ContactMethod[];
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastNotified?: Date;
  notificationCount: number;
}

export interface EmergencyNotification {
  id: string;
  contactId: string;
  contactName: string;
  method: ContactMethod;
  status: NotificationStatus;
  message: string;
  timestamp: Date;
  responseTime?: number; // milliseconds
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface EmergencyEvent {
  id: string;
  type: 'fall_detected' | 'fall_risk_high' | 'manual_trigger' | 'medical_emergency';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contactsNotified: string[]; // Contact IDs
  notifications: EmergencyNotification[];
  cancelled: boolean;
  cancelledAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface EmergencyContactSettings {
  autoNotify: boolean;
  notifyOnFallDetection: boolean;
  notifyOnHighRisk: boolean;
  notifyOnManualTrigger: boolean;
  countdownSeconds: number; // Time to cancel before notification
  includeLocation: boolean;
  includeHealthData: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export const DEFAULT_EMERGENCY_SETTINGS: EmergencyContactSettings = {
  autoNotify: true,
  notifyOnFallDetection: true,
  notifyOnHighRisk: false,
  notifyOnManualTrigger: true,
  countdownSeconds: 30,
  includeLocation: true,
  includeHealthData: false,
  maxRetries: 3,
  retryDelay: 5000,
};

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it's a valid length (10-15 digits)
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // Return as-is if format is unknown
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get priority order for contacts
 */
export function getContactPriorityOrder(priority: ContactPriority): number {
  switch (priority) {
    case 'primary':
      return 1;
    case 'secondary':
      return 2;
    case 'tertiary':
      return 3;
    default:
      return 4;
  }
}

/**
 * Sort contacts by priority
 */
export function sortContactsByPriority(
  contacts: EmergencyContact[]
): EmergencyContact[] {
  return [...contacts].sort((a, b) => {
    const priorityDiff = getContactPriorityOrder(a.priority) - getContactPriorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    // If same priority, sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get active contacts only
 */
export function getActiveContacts(contacts: EmergencyContact[]): EmergencyContact[] {
  return contacts.filter((c) => c.isActive);
}

/**
 * Build emergency message
 */
export function buildEmergencyMessage(
  event: EmergencyEvent,
  contact: EmergencyContact,
  includeLocation = true,
  includeHealthData = false
): string {
  let message = `🚨 EMERGENCY ALERT from VitalSense\n\n`;

  message += `Type: ${event.type.replace(/_/g, ' ').toUpperCase()}\n`;
  message += `Severity: ${event.severity.toUpperCase()}\n`;
  message += `Time: ${event.timestamp.toLocaleString()}\n\n`;

  if (includeLocation && event.location) {
    message += `Location: ${event.location.address || `${event.location.latitude}, ${event.location.longitude}`}\n\n`;
  }

  message += `This is an automated alert. Please check on the user or contact emergency services if needed.\n\n`;
  message += `You can cancel this alert within ${DEFAULT_EMERGENCY_SETTINGS.countdownSeconds} seconds if it's a false alarm.`;

  return message;
}

/**
 * Create default contact from basic info
 */
export function createEmergencyContact(
  name: string,
  phone: string,
  email: string | undefined,
  relationship: string,
  priority: ContactPriority = 'secondary'
): EmergencyContact {
  const now = new Date();
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    phone,
    email,
    relationship,
    priority,
    preferredMethods: ['all'],
    isActive: true,
    createdAt: now,
    updatedAt: now,
    notificationCount: 0,
  };
}
