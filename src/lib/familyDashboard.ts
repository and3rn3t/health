/**
 * Family Dashboard Types and Utilities
 * Types and helper functions for family dashboard feature
 */

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  avatar?: string;
  lastSeen: Date;
  isActive: boolean;
  permissions: FamilyPermission[];
  notificationPreferences: NotificationPreferences;
  role: 'primary' | 'secondary' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export type FamilyPermission =
  | 'view-health'
  | 'view-location'
  | 'receive-alerts'
  | 'view-emergency'
  | 'manage-settings'
  | 'view-analytics';

export interface NotificationPreferences {
  emergencyAlerts: boolean;
  weeklyReports: boolean;
  milestones: boolean;
  healthChanges: boolean;
  fallRiskAlerts: boolean;
  dailySummary: boolean;
}

export interface ProgressShare {
  id: string;
  type: 'milestone' | 'improvement' | 'concern' | 'achievement' | 'update';
  title: string;
  description: string;
  value?: number;
  previousValue?: number;
  unit?: string;
  date: Date;
  sharedWith: string[]; // Family member IDs
  reactions: Reaction[];
  comments?: Comment[];
  isPublic: boolean;
}

export interface Reaction {
  memberId: string;
  memberName: string;
  reaction: string; // Emoji
  timestamp: Date;
}

export interface Comment {
  id: string;
  memberId: string;
  memberName: string;
  content: string;
  timestamp: Date;
}

export interface FamilyActivity {
  id: string;
  type: 'health_update' | 'alert' | 'milestone' | 'member_added' | 'permission_changed';
  title: string;
  description: string;
  memberId?: string;
  memberName?: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}

export interface HealthDataShare {
  id: string;
  memberId: string;
  sharedMetrics: string[];
  lastShared: Date;
  frequency: 'realtime' | 'daily' | 'weekly' | 'on-demand';
  includeLocation: boolean;
  includeEmergencyData: boolean;
}

/**
 * Get family member by ID
 */
export function getFamilyMember(
  members: FamilyMember[],
  id: string
): FamilyMember | undefined {
  return members.find((m) => m.id === id);
}

/**
 * Get active family members
 */
export function getActiveMembers(members: FamilyMember[]): FamilyMember[] {
  return members.filter((m) => m.isActive);
}

/**
 * Get members with permission
 */
export function getMembersWithPermission(
  members: FamilyMember[],
  permission: FamilyPermission
): FamilyMember[] {
  return members.filter((m) => m.isActive && m.permissions.includes(permission));
}

/**
 * Check if member has permission
 */
export function hasPermission(
  member: FamilyMember,
  permission: FamilyPermission
): boolean {
  return member.isActive && member.permissions.includes(permission);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Get activity icon
 */
export function getActivityIcon(type: FamilyActivity['type']): string {
  switch (type) {
    case 'health_update':
      return '📊';
    case 'alert':
      return '⚠️';
    case 'milestone':
      return '🎯';
    case 'member_added':
      return '👤';
    case 'permission_changed':
      return '🔐';
    default:
      return '📝';
  }
}

/**
 * Get activity color
 */
export function getActivityColor(
  type: FamilyActivity['type'],
  severity?: FamilyActivity['severity']
): string {
  if (severity === 'critical') return 'text-red-600';
  if (severity === 'high') return 'text-orange-600';
  if (severity === 'medium') return 'text-yellow-600';
  if (type === 'milestone') return 'text-green-600';
  if (type === 'alert') return 'text-red-600';
  return 'text-blue-600';
}

/**
 * Create default notification preferences
 */
export function createDefaultNotificationPreferences(): NotificationPreferences {
  return {
    emergencyAlerts: true,
    weeklyReports: false,
    milestones: true,
    healthChanges: false,
    fallRiskAlerts: true,
    dailySummary: false,
  };
}

/**
 * Create default permissions for role
 */
export function getDefaultPermissionsForRole(
  role: FamilyMember['role']
): FamilyPermission[] {
  switch (role) {
    case 'primary':
      return [
        'view-health',
        'view-location',
        'receive-alerts',
        'view-emergency',
        'view-analytics',
      ];
    case 'secondary':
      return ['view-health', 'receive-alerts', 'view-emergency'];
    case 'viewer':
      return ['view-health'];
    default:
      return [];
  }
}

/**
 * Validate family member data
 */
export function validateFamilyMember(member: Partial<FamilyMember>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!member.name || member.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!member.relationship || member.relationship.trim().length === 0) {
    errors.push('Relationship is required');
  }

  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    errors.push('Invalid email format');
  }

  if (member.phone && !/^\+?[\d\s\-()]+$/.test(member.phone)) {
    errors.push('Invalid phone format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
