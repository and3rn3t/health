// Shared type definitions for the health monitoring app

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface HealthMetric {
  value: number;
  date: string;
  unit?: string;
}

export interface ProcessedHealthData {
  metrics: {
    steps?: HealthMetric[];
    heartRate?: HealthMetric[];
    bloodPressure?: HealthMetric[];
    weight?: HealthMetric[];
    sleep?: HealthMetric[];
  };
  healthScore: number;
  fallRiskFactors: string[];
  lastUpdated?: string;
}
