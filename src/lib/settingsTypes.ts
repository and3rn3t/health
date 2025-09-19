// Types for user settings persisted via KV

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ProfileSettings {
  displayName: string;
  email: string;
  phone?: string;
  locale: string;
  timeZone: string;
}

export interface NotificationSettings {
  healthAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
}

export interface PrivacySecuritySettings {
  dataSharing: boolean; // share anonymized data
  analyticsTracking: boolean; // allow product analytics (first-party)
  twoFactorEnabled?: boolean;
}

export type SyncFrequency = 'realtime' | 'hourly' | 'daily';

export interface DataSyncSettings {
  autoSync: boolean;
  frequency: SyncFrequency;
}

export interface AppPreferences {
  theme: ThemeMode;
  language: string;
  units: 'metric' | 'imperial';
  defaultView: 'dashboard' | 'health-trends' | 'goals';
  /**
   * User-selected dynamic type scale multiplier (root font-size scaling)
   * 1 = default (16px). Values roughly map to iOS content size categories.
   */
  dynamicTypeScale?: number;
}

export interface AllSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  privacy: PrivacySecuritySettings;
  dataSync: DataSyncSettings;
  preferences: AppPreferences;
}

export const DEFAULT_SETTINGS: AllSettings = {
  profile: {
    displayName: '',
    email: '',
    phone: '',
    locale: 'en-US',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  notifications: {
    healthAlerts: true,
    goalReminders: true,
    weeklyReports: false,
  },
  privacy: {
    dataSharing: false,
    analyticsTracking: true,
    twoFactorEnabled: undefined,
  },
  dataSync: {
    autoSync: true,
    frequency: 'realtime',
  },
  preferences: {
    theme: 'system',
    language: 'en',
    units: 'metric',
    defaultView: 'dashboard',
    dynamicTypeScale: 1,
  },
};
