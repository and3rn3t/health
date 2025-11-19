/**
 * Enhanced Fall Risk System Integration
 * Main integration point for all fall risk components
 */

import { Button } from '@/components/ui/button';
import { useFallRiskSystem } from '@/hooks/useFallRiskSystem';
import { AdvancedFallRiskEngine } from '@/lib/advanced-fall-risk-engine';
import {
  EnhancedFallDetectionEngine,
  FallDetectionEvent,
} from '@/lib/enhanced-fall-detection-engine';
import { EnhancedInterventionEngine } from '@/lib/enhanced-intervention-engine';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { generateSampleHealthData } from '@/lib/sampleHealthData';
import React from 'react';
import EnhancedFallRiskDashboard from './EnhancedFallRiskDashboard';

interface FallRiskSystemProps {
  healthData?: ProcessedHealthData | null;
  onEmergencyAlert?: (alert: FallDetectionEvent) => void;
  onInterventionStart?: (interventionId: string) => void;
}

/**
 * Enhanced Fall Risk Management System
 * Complete integration of AI-powered fall risk assessment, detection, and prevention
 */
export default function EnhancedFallRiskSystem({
  healthData,
  onEmergencyAlert,
  onInterventionStart,
}: FallRiskSystemProps) {
  // Use the fall risk system hooks for integrated functionality
  const {
    handleEmergencyAlert: systemEmergencyHandler,
    handleInterventionStart: systemInterventionHandler,
    requestNotificationPermission,
  } = useFallRiskSystem();

  // Request notification permission on component mount
  React.useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Example sensor data (would come from real sensors in production)
  const mockSensorData = React.useMemo(() => {
    const accelZ = 9.8 + Math.random() * 0.5;
    const gyroZ = Math.random() * 0.5;
    return {
      timestamp: Date.now(),
      accelerometer: {
        x: 0.1 + Math.random() * 0.2,
        y: 0.2 + Math.random() * 0.3,
        z: accelZ,
        magnitude: 1.2 + Math.random() * 0.8,
      },
      gyroscope: {
        x: Math.random() * 0.5,
        y: Math.random() * 0.5,
        z: gyroZ,
        magnitude: Math.random() * 1.0,
      },
      heartRate: 70 + Math.random() * 30,
      heartRateVariability: 30 + Math.random() * 20,
      confidence: 0.85 + Math.random() * 0.15,
      postureOrientation: 'standing' as const,
      activityType: 'walking' as const,
    };
  }, []);

  const handleEmergencyAlert = React.useCallback(
    (event: FallDetectionEvent) => {
      // Use provided handler if available, otherwise use system default
      if (onEmergencyAlert) {
        onEmergencyAlert(event);
      } else {
        systemEmergencyHandler(event);
      }
    },
    [onEmergencyAlert, systemEmergencyHandler]
  );

  const handleInterventionStart = React.useCallback(
    (interventionId: string) => {
      // Use provided handler if available, otherwise use system default
      if (onInterventionStart) {
        onInterventionStart(interventionId);
      } else {
        systemInterventionHandler(interventionId);
      }
    },
    [onInterventionStart, systemInterventionHandler]
  );

  // Handle missing health data with sample data option
  const [useSampleData, setUseSampleData] = React.useState(false);
  const effectiveHealthData = React.useMemo(() => {
    if (healthData) return healthData;
    if (useSampleData) return generateSampleHealthData();
    return null;
  }, [healthData, useSampleData]);

  // Show loading state if healthData is not available
  if (!effectiveHealthData) {
    return (
      <div className="bg-gray-50 flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-vitalsense-teal mx-auto mb-4 rounded-full"></div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            VitalSense Fall Risk System
          </h2>
          <p className="text-gray-600 mb-6">
            No health data available yet. Import your Apple Health data or try
            the demo with sample data.
          </p>
          <Button
            onClick={() => setUseSampleData(true)}
            className="bg-vitalsense-teal hover:bg-vitalsense-teal/90 rounded-md px-6 py-2 text-white"
          >
            Try Demo with Sample Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            VitalSense Fall Risk Management
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered fall risk assessment and prevention system
          </p>
        </div>

        <EnhancedFallRiskDashboard
          healthData={effectiveHealthData}
          sensorData={mockSensorData}
          onEmergencyAlert={handleEmergencyAlert}
          onInterventionStart={handleInterventionStart}
        />
      </div>
    </div>
  );
}

// Export the main engines for use in other components
export {
  AdvancedFallRiskEngine,
  EnhancedFallDetectionEngine,
  EnhancedInterventionEngine,
};
