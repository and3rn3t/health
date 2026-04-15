/**
 * Health Alerts — shared types and constants.
 */

import type { ProcessedHealthData } from '@/types';

export interface HealthAlert {
  id: string;
  name: string;
  metric: string;
  condition:
    | 'above'
    | 'below'
    | 'equal'
    | 'range_outside'
    | 'trend_up'
    | 'trend_down';
  threshold: number;
  thresholdMax?: number;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'immediate' | 'daily' | 'weekly';
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
  description?: string;
}

export interface AlertHistoryEntry {
  id: string;
  alertId: string;
  alertName: string;
  metric: string;
  value: number;
  unit?: string;
  priority: HealthAlert['priority'];
  timestamp: number;
}

export interface GlobalSettings {
  enabled: boolean;
  quietHours: { start: string; end: string };
  maxAlertsPerDay: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface AlertsConfigProps {
  healthData: ProcessedHealthData;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  enabled: true,
  quietHours: { start: '22:00', end: '07:00' },
  maxAlertsPerDay: 10,
  emailNotifications: false,
  pushNotifications: true,
};

export const HEALTH_METRICS = [
  {
    value: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    normalRange: [60, 100],
  },
  {
    value: 'steps',
    label: 'Daily Steps',
    unit: 'steps',
    normalRange: [8000, 12000],
  },
  {
    value: 'sleep_hours',
    label: 'Sleep Hours',
    unit: 'hours',
    normalRange: [7, 9],
  },
  {
    value: 'blood_pressure_systolic',
    label: 'Blood Pressure (Systolic)',
    unit: 'mmHg',
    normalRange: [90, 120],
  },
  {
    value: 'blood_pressure_diastolic',
    label: 'Blood Pressure (Diastolic)',
    unit: 'mmHg',
    normalRange: [60, 80],
  },
  {
    value: 'walking_speed',
    label: 'Walking Speed',
    unit: 'mph',
    normalRange: [2.5, 4],
  },
  {
    value: 'balance_score',
    label: 'Balance Score',
    unit: '%',
    normalRange: [80, 100],
  },
  {
    value: 'fall_risk_score',
    label: 'Fall Risk Score',
    unit: '%',
    normalRange: [0, 30],
  },
  {
    value: 'activity_level',
    label: 'Activity Level',
    unit: 'minutes',
    normalRange: [150, 300],
  },
  { value: 'weight', label: 'Weight', unit: 'lbs', normalRange: [0, 0] },
] as const;

export const CONDITION_LABELS: Record<HealthAlert['condition'], string> = {
  above: 'Above threshold',
  below: 'Below threshold',
  equal: 'Equals threshold',
  range_outside: 'Outside normal range',
  trend_up: 'Trending upward',
  trend_down: 'Trending downward',
};

export const PRIORITY_COLORS: Record<HealthAlert['priority'], string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};
