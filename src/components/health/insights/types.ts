/**
 * Health insights — shared types.
 */

import type { ProcessedHealthData } from '@/types';

export interface HealthTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

export interface HealthInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'critical' | 'info';
  priority: number;
  category: string;
  actionable: boolean;
  recommendations?: string[];
}

export interface PredictiveAlert {
  id: string;
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  preventiveActions: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface InsightsDashboardProps {
  readonly healthData: ProcessedHealthData;
  onNavigate?: (destination: string) => void;
}
