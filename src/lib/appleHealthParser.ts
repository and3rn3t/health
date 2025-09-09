/**
 * Apple Health Export Parser
 * Handles parsing of Apple Health ZIP exports and XML data
 */

import type { ProcessedHealthData } from '@/types';

// Define the structure for fall risk factors
interface FallRiskFactor {
  factor: string;
  risk: 'low' | 'moderate' | 'high';
  impact: number;
  recommendation: string;
}

// Apple Health data type mappings
export const APPLE_HEALTH_TYPES = {
  STEP_COUNT: 'HKQuantityTypeIdentifierStepCount',
  HEART_RATE: 'HKQuantityTypeIdentifierHeartRate',
  WALKING_STEADINESS: 'HKQuantityTypeIdentifierAppleWalkingSteadiness',
  SLEEP_ANALYSIS: 'HKCategoryTypeIdentifierSleepAnalysis',
  BODY_MASS: 'HKQuantityTypeIdentifierBodyMass',
  DISTANCE_WALKING: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  ACTIVE_ENERGY: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  RESTING_HEART_RATE: 'HKQuantityTypeIdentifierRestingHeartRate',
  OXYGEN_SATURATION: 'HKQuantityTypeIdentifierOxygenSaturation',
  BLOOD_PRESSURE_SYSTOLIC: 'HKQuantityTypeIdentifierBloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC: 'HKQuantityTypeIdentifierBloodPressureDiastolic',
} as const;

export interface AppleHealthRecord {
  type: string;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceVersion?: string;
  device?: string;
  creationDate: string;
}

export interface WorkoutRecord {
  workoutActivityType?: string;
  duration?: string;
  durationUnit?: string;
  totalDistance?: string;
  totalDistanceUnit?: string;
  totalEnergyBurned?: string;
  totalEnergyBurnedUnit?: string;
  startDate?: string;
  endDate?: string;
  sourceName?: string;
}

export interface ClinicalRecord {
  type?: string;
  identifier?: string;
  sourceName?: string;
  sourceURL?: string;
  fhirVersion?: string;
  receivedDate?: string;
  resourceFilePath?: string;
}

export interface ParsedAppleHealthData {
  records: AppleHealthRecord[];
  exportDate: string;
  me: {
    dateOfBirth?: string;
    biologicalSex?: string;
    bloodType?: string;
    skinType?: string;
  };
  workouts: WorkoutRecord[];
  clinicalRecords: ClinicalRecord[];
}

/**
 * Parses Apple Health ZIP export file or XML file
 */
export async function parseAppleHealthFile(
  file: File
): Promise<ParsedAppleHealthData> {
  try {
    if (file.name.endsWith('.xml')) {
      // Handle XML file directly
      const xmlContent = await file.text();
      return parseAppleHealthXML(xmlContent);
    } else if (file.name.endsWith('.zip')) {
      // For ZIP files, we'll need the user to extract the XML manually for now
      throw new Error(
        'ZIP file support requires manual extraction. Please extract the export.xml file from the ZIP and upload it directly.'
      );
    } else {
      throw new Error(
        'Please upload either a .xml file (extracted from Apple Health export) or a .zip file from Apple Health.'
      );
    }
  } catch (error) {
    console.error('Error parsing Apple Health file:', error);
    throw new Error(
      `Failed to parse Apple Health export: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parses Apple Health XML content
 */
export function parseAppleHealthXML(xmlContent: string): ParsedAppleHealthData {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML format');
    }

    const healthData = xmlDoc.querySelector('HealthData');
    if (!healthData) {
      throw new Error('No HealthData element found in XML');
    }

    // Extract export date
    const exportDate =
      healthData.getAttribute('dateOfExport') || new Date().toISOString();

    // Extract personal information
    const meElement = xmlDoc.querySelector('Me');
    const me = {
      dateOfBirth:
        meElement?.getAttribute('HKCharacteristicTypeIdentifierDateOfBirth') ||
        undefined,
      biologicalSex:
        meElement?.getAttribute(
          'HKCharacteristicTypeIdentifierBiologicalSex'
        ) || undefined,
      bloodType:
        meElement?.getAttribute('HKCharacteristicTypeIdentifierBloodType') ||
        undefined,
      skinType:
        meElement?.getAttribute(
          'HKCharacteristicTypeIdentifierFitzpatrickSkinType'
        ) || undefined,
    };

    // Parse all record elements
    const recordElements = xmlDoc.querySelectorAll('Record');
    const records: AppleHealthRecord[] = [];

    for (const recordElement of recordElements) {
      const type = recordElement.getAttribute('type');
      const valueStr = recordElement.getAttribute('value');
      const unit = recordElement.getAttribute('unit');
      const startDate = recordElement.getAttribute('startDate');
      const endDate = recordElement.getAttribute('endDate');
      const sourceName = recordElement.getAttribute('sourceName');
      const sourceVersion = recordElement.getAttribute('sourceVersion');
      const device = recordElement.getAttribute('device');
      const creationDate = recordElement.getAttribute('creationDate');

      if (type && valueStr && startDate && endDate) {
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          records.push({
            type,
            value,
            unit: unit || '',
            startDate,
            endDate,
            sourceName: sourceName || 'Unknown',
            sourceVersion: sourceVersion || undefined,
            device: device || undefined,
            creationDate: creationDate || startDate,
          });
        }
      }
    }

    // Parse workouts
    const workoutElements = xmlDoc.querySelectorAll('Workout');
    const workouts: WorkoutRecord[] = Array.from(workoutElements).map(
      (workout) => ({
        workoutActivityType:
          workout.getAttribute('workoutActivityType') || undefined,
        duration: workout.getAttribute('duration') || undefined,
        durationUnit: workout.getAttribute('durationUnit') || undefined,
        totalDistance: workout.getAttribute('totalDistance') || undefined,
        totalDistanceUnit:
          workout.getAttribute('totalDistanceUnit') || undefined,
        totalEnergyBurned:
          workout.getAttribute('totalEnergyBurned') || undefined,
        totalEnergyBurnedUnit:
          workout.getAttribute('totalEnergyBurnedUnit') || undefined,
        startDate: workout.getAttribute('startDate') || undefined,
        endDate: workout.getAttribute('endDate') || undefined,
        sourceName: workout.getAttribute('sourceName') || undefined,
      })
    );

    // Parse clinical records (if any)
    const clinicalElements = xmlDoc.querySelectorAll('ClinicalRecord');
    const clinicalRecords: ClinicalRecord[] = Array.from(clinicalElements).map(
      (clinical) => ({
        type: clinical.getAttribute('type') || undefined,
        identifier: clinical.getAttribute('identifier') || undefined,
        sourceName: clinical.getAttribute('sourceName') || undefined,
        sourceURL: clinical.getAttribute('sourceURL') || undefined,
        fhirVersion: clinical.getAttribute('fhirVersion') || undefined,
        receivedDate: clinical.getAttribute('receivedDate') || undefined,
        resourceFilePath:
          clinical.getAttribute('resourceFilePath') || undefined,
      })
    );

    return {
      records,
      exportDate,
      me,
      workouts,
      clinicalRecords,
    };
  } catch (error) {
    console.error('Error parsing Apple Health XML:', error);
    throw new Error(
      `Failed to parse XML content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Converts parsed Apple Health data to our ProcessedHealthData format
 */
export function convertAppleHealthToProcessedData(
  appleData: ParsedAppleHealthData
): ProcessedHealthData {
  // Group records by type
  const recordsByType = new Map<string, AppleHealthRecord[]>();

  for (const record of appleData.records) {
    if (!recordsByType.has(record.type)) {
      recordsByType.set(record.type, []);
    }
    recordsByType.get(record.type)!.push(record);
  }

  // Sort records by date and take recent data (last 90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const filterAndSortRecords = (records: AppleHealthRecord[]) => {
    return records
      .filter((r) => new Date(r.startDate) >= cutoffDate)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  };

  // Extract and process each metric type
  const stepRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.STEP_COUNT) || []
  );
  const heartRateRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.HEART_RATE) || []
  );
  const walkingSteadinessRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.WALKING_STEADINESS) || []
  );
  const sleepRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.SLEEP_ANALYSIS) || []
  );
  const bodyMassRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.BODY_MASS) || []
  );
  const distanceRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.DISTANCE_WALKING) || []
  );
  const activeEnergyRecords = filterAndSortRecords(
    recordsByType.get(APPLE_HEALTH_TYPES.ACTIVE_ENERGY) || []
  );

  // Convert to daily aggregates
  const convertToDaily = (
    records: AppleHealthRecord[],
    aggregateMethod: 'sum' | 'average' = 'sum'
  ) => {
    const dailyMap = new Map<string, number[]>();

    for (const record of records) {
      const date = record.startDate.split('T')[0]; // Get date part only
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(record.value);
    }

    const dailyData = [];
    for (const [date, values] of dailyMap.entries()) {
      let dailyValue: number;
      if (aggregateMethod === 'sum') {
        dailyValue = values.reduce((sum, val) => sum + val, 0);
      } else {
        dailyValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      }

      dailyData.push({
        date,
        value: Math.round(dailyValue * 100) / 100,
      });
    }

    return dailyData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Process sleep data specially (convert hours)
  const processSleepData = (records: AppleHealthRecord[]) => {
    const sleepSessionMap = new Map<string, { start: Date; end: Date }[]>();

    for (const record of records) {
      const date = record.startDate.split('T')[0];
      if (!sleepSessionMap.has(date)) {
        sleepSessionMap.set(date, []);
      }
      sleepSessionMap.get(date)!.push({
        start: new Date(record.startDate),
        end: new Date(record.endDate),
      });
    }

    const dailySleep = [];
    for (const [date, sessions] of sleepSessionMap.entries()) {
      // Calculate total sleep time for the day
      const totalSleepMs = sessions.reduce((total, session) => {
        return total + (session.end.getTime() - session.start.getTime());
      }, 0);

      const sleepHours = totalSleepMs / (1000 * 60 * 60); // Convert to hours

      if (sleepHours > 0) {
        dailySleep.push({
          date,
          value: Math.round(sleepHours * 100) / 100,
        });
      }
    }

    return dailySleep.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Convert all metrics
  const steps = convertToDaily(stepRecords, 'sum');
  const heartRate = convertToDaily(heartRateRecords, 'average');
  const walkingSteadiness = convertToDaily(walkingSteadinessRecords, 'average');
  const sleepHours = processSleepData(sleepRecords);
  const bodyWeight = convertToDaily(bodyMassRecords, 'average');
  const distanceWalking = convertToDaily(distanceRecords, 'sum');
  const activeEnergy = convertToDaily(activeEnergyRecords, 'sum');

  // Calculate metrics using existing processing logic
  const processMetric = (
    daily: { date: string; value: number }[],
    _metricName: string
  ) => {
    if (daily.length === 0) {
      // Return default data if no records available
      return {
        daily: [],
        weekly: [],
        monthly: [],
        average: 0,
        trend: 'stable' as const,
        variability: 0,
        reliability: 50,
        lastValue: 0,
        percentileRank: 50,
      };
    }

    const values = daily.map((d) => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const lastValue = values[values.length - 1] || 0;

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (values.length >= 7) {
      const recentAvg = values.slice(-7).reduce((sum, val) => sum + val, 0) / 7;
      const olderAvg =
        values.slice(-14, -7).reduce((sum, val) => sum + val, 0) / 7;
      if (recentAvg > olderAvg * 1.05) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.95) trend = 'decreasing';
    }

    // Calculate variability (coefficient of variation)
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
      values.length;
    const variability = average > 0 ? (Math.sqrt(variance) / average) * 100 : 0;

    // Calculate weekly and monthly aggregates
    const weekly = [];
    for (let i = 0; i < daily.length; i += 7) {
      const weekData = daily.slice(i, i + 7);
      if (weekData.length > 0) {
        const weekAvg =
          weekData.reduce((sum, day) => sum + day.value, 0) / weekData.length;
        weekly.push({
          date: weekData[weekData.length - 1].date,
          value: Math.round(weekAvg * 100) / 100,
        });
      }
    }

    const monthly = [];
    for (let i = 0; i < weekly.length; i += 4) {
      const monthData = weekly.slice(i, i + 4);
      if (monthData.length > 0) {
        const monthAvg =
          monthData.reduce((sum, week) => sum + week.value, 0) /
          monthData.length;
        monthly.push({
          date: monthData[monthData.length - 1].date,
          value: Math.round(monthAvg * 100) / 100,
        });
      }
    }

    // Calculate reliability and percentile rank
    const reliability = Math.max(0, 100 - variability);
    const sortedValues = [...values].sort((a, b) => a - b);
    const percentileRank =
      (sortedValues.filter((v) => v <= lastValue).length /
        sortedValues.length) *
      100;

    return {
      daily,
      weekly,
      monthly,
      average: Math.round(average * 100) / 100,
      trend,
      variability: Math.round(variability * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      lastValue,
      percentileRank: Math.round(percentileRank),
    };
  };

  // Process all metrics
  const processedMetrics = {
    steps: processMetric(steps, 'steps'),
    heartRate: processMetric(heartRate, 'heartRate'),
    walkingSteadiness: processMetric(walkingSteadiness, 'walkingSteadiness'),
    sleepHours: processMetric(sleepHours, 'sleepHours'),
    bodyWeight: processMetric(bodyWeight, 'bodyWeight'),
    distanceWalking: processMetric(distanceWalking, 'distanceWalking'),
    activeEnergy: processMetric(activeEnergy, 'activeEnergy'),
  };

  // Generate insights and risk factors
  const generateInsights = (metrics: typeof processedMetrics) => {
    const insights: string[] = [];

    if (
      metrics.walkingSteadiness.average > 0 &&
      metrics.walkingSteadiness.average < 60
    ) {
      insights.push(
        `Walking steadiness is below average (${Math.round(metrics.walkingSteadiness.average)}%). Consider balance exercises and consulting your healthcare provider.`
      );
    }

    if (metrics.steps.average < 5000) {
      insights.push(
        `Daily step count is below recommended levels (${Math.round(metrics.steps.average)} steps/day). Aim for gradual increases in physical activity.`
      );
    }

    if (metrics.sleepHours.average > 0 && metrics.sleepHours.average < 7) {
      insights.push(
        `Sleep duration is below recommended 7-9 hours (${metrics.sleepHours.average.toFixed(1)} hours average). Poor sleep can affect balance and increase fall risk.`
      );
    }

    if (metrics.steps.trend === 'increasing') {
      insights.push(
        `Great progress! Your activity levels have increased recently.`
      );
    }

    return insights;
  };

  const generateFallRiskFactors = (metrics: typeof processedMetrics) => {
    const factors: FallRiskFactor[] = [];

    if (
      metrics.walkingSteadiness.average > 0 &&
      metrics.walkingSteadiness.average < 50
    ) {
      factors.push({
        factor: 'Walking Steadiness',
        risk: 'high',
        impact: 40,
        recommendation:
          'Consult with a physical therapist for balance training exercises',
      });
    } else if (
      metrics.walkingSteadiness.average > 0 &&
      metrics.walkingSteadiness.average < 70
    ) {
      factors.push({
        factor: 'Walking Steadiness',
        risk: 'moderate',
        impact: 25,
        recommendation:
          'Practice daily balance exercises and consider tai chi classes',
      });
    }

    if (metrics.steps.average < 3000) {
      factors.push({
        factor: 'Low Activity Level',
        risk: 'high',
        impact: 30,
        recommendation:
          'Gradually increase daily movement with safe, supervised activities',
      });
    }

    return factors;
  };

  const calculateDataQuality = (metrics: typeof processedMetrics) => {
    const expectedDays = 30;
    const actualDays = Math.max(
      metrics.steps.daily.length,
      metrics.heartRate.daily.length,
      metrics.walkingSteadiness.daily.length
    );
    const completeness = Math.min(100, (actualDays / expectedDays) * 100);

    const avgReliability =
      [
        metrics.steps.reliability,
        metrics.heartRate.reliability,
        metrics.walkingSteadiness.reliability,
      ].reduce((a, b) => a + b, 0) / 3;

    const recency = 95; // Assume recent since it's from a fresh export

    const overall = (completeness + avgReliability + recency) / 3;
    let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
    if (overall >= 85) overallRating = 'excellent';
    else if (overall >= 70) overallRating = 'good';
    else if (overall >= 50) overallRating = 'fair';
    else overallRating = 'poor';

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(avgReliability),
      recency: Math.round(recency),
      overall: overallRating,
    };
  };

  const calculateHealthScore = (
    metrics: typeof processedMetrics,
    fallRiskFactors: FallRiskFactor[]
  ) => {
    let score = 100;

    const totalRiskImpact = fallRiskFactors.reduce(
      (sum, factor) => sum + factor.impact,
      0
    );
    score -= totalRiskImpact;

    if (metrics.steps.trend === 'increasing') score += 5;
    if (metrics.walkingSteadiness.trend === 'increasing') score += 10;
    if (metrics.sleepHours.average >= 7) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const insights = generateInsights(processedMetrics);
  const fallRiskFactors = generateFallRiskFactors(processedMetrics);
  const dataQuality = calculateDataQuality(processedMetrics);
  const healthScore = calculateHealthScore(processedMetrics, fallRiskFactors);

  return {
    lastUpdated: appleData.exportDate,
    dataQuality,
    metrics: processedMetrics,
    insights,
    fallRiskFactors,
    healthScore,
  };
}

/**
 * Gets statistics about the parsed Apple Health data
 */
export function getAppleHealthStats(appleData: ParsedAppleHealthData) {
  const recordsByType = new Map<string, number>();

  for (const record of appleData.records) {
    recordsByType.set(record.type, (recordsByType.get(record.type) || 0) + 1);
  }

  const sortedTypes = Array.from(recordsByType.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 data types

  const dateRange =
    appleData.records.length > 0
      ? {
          earliest: new Date(
            Math.min(
              ...appleData.records.map((r) => new Date(r.startDate).getTime())
            )
          ),
          latest: new Date(
            Math.max(
              ...appleData.records.map((r) => new Date(r.startDate).getTime())
            )
          ),
        }
      : null;

  return {
    totalRecords: appleData.records.length,
    totalWorkouts: appleData.workouts.length,
    totalClinicalRecords: appleData.clinicalRecords.length,
    topDataTypes: sortedTypes,
    dateRange,
    exportDate: new Date(appleData.exportDate),
    personalInfo: appleData.me,
  };
}
