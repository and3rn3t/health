/**
 * Enhanced Fall Risk System Integration
 * Main integration point for all fall risk components
 */

import { Button } from '@/components/ui/button';
import { useFallRiskSystem } from '@/hooks/useFallRiskSystem';
import type { FallDetectionEvent } from '@/lib/enhanced-fall-detection-engine';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { generateSampleHealthData } from '@/lib/sampleHealthData';
import React from 'react';
import EnhancedFallRiskDashboard from './EnhancedFallRiskDashboard';

// Re-export engines for use in other components
export { AdvancedFallRiskEngine } from '@/lib/advanced-fall-risk-engine';
export { EnhancedFallDetectionEngine } from '@/lib/enhanced-fall-detection-engine';
export { EnhancedInterventionEngine } from '@/lib/enhanced-intervention-engine';

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
  // Initialize all values before using them to prevent temporal dead zone errors
  const mockSensorData = React.useMemo(() => {
    // Calculate all values first
    const accelZValue = 9.8 + Math.random() * 0.5;
    const gyroZValue = Math.random() * 0.5;
    const accelX = 0.1 + Math.random() * 0.2;
    const accelY = 0.2 + Math.random() * 0.3;
    const accelMagnitude = 1.2 + Math.random() * 0.8;
    const gyroX = Math.random() * 0.5;
    const gyroY = Math.random() * 0.5;
    const gyroMagnitude = Math.random() * 1.0;
    const heartRateValue = 70 + Math.random() * 30;
    const heartRateVariabilityValue = 30 + Math.random() * 20;
    const confidenceValue = 0.85 + Math.random() * 0.15;

    // Now construct the object with all pre-calculated values
    return {
      timestamp: Date.now(),
      accelerometer: {
        x: accelX,
        y: accelY,
        z: accelZValue,
        magnitude: accelMagnitude,
      },
      gyroscope: {
        x: gyroX,
        y: gyroY,
        z: gyroZValue,
        magnitude: gyroMagnitude,
      },
      heartRate: heartRateValue,
      heartRateVariability: heartRateVariabilityValue,
      confidence: confidenceValue,
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
