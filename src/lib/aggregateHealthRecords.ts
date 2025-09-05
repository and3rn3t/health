import type { AggregatedMetrics, TrendDirection } from '@/hooks/optimizedHealthDataCore';
import type { ProcessedHealthRecord } from '@/types';

// Utility to compute simple averages & rudimentary trends from raw records.
// This intentionally keeps computation lightweight; heavy analytics can move to a Worker later.
export function aggregateHealthRecords(records: ProcessedHealthRecord[]): AggregatedMetrics {
  const totalRecords = records.length;
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      averageHeartRate: 0,
      averageSteps: 0,
      averageWalkingSteadiness: 0,
      riskScores: { fallRisk: 0, cardiovascularRisk: 0, sleepQuality: 0 },
      trends: { heartRate: 'stable', steps: 'stable', walkingSteadiness: 'stable' },
    };
  }

  // Buckets
  let heartRateSum = 0;
  let heartRateCount = 0;
  let stepsSum = 0;
  let stepsCount = 0;
  let steadinessSum = 0;
  let steadinessCount = 0;

  // Basic risk proxies
  let fallRiskScore = 0;
  let cardioRiskScore = 0;
  let sleepQualityScore = 0;

  // Simple time-sorted array for trend determination
  const sorted = [...records].sort((a,b) => a.timestamp.localeCompare(b.timestamp));
  const recentWindow = sorted.slice(-Math.min(30, sorted.length));
  const earlyWindow = sorted.slice(0, Math.min(30, sorted.length));

  for (const r of records) {
    switch (r.type) {
      case 'heart_rate': {
        heartRateSum += r.value; heartRateCount++; break;
      }
      case 'steps': {
        stepsSum += r.value; stepsCount++; break;
      }
      case 'walking_steadiness': {
        steadinessSum += r.value; steadinessCount++; break;
      }
      case 'fall_event': {
        fallRiskScore += 15; break;
      }
      case 'sleep_hours': {
        const deviation = Math.abs(r.value - 7.5);
        sleepQualityScore += Math.max(0, 100 - deviation * 12);
        break;
      }
      default: {
        break;
      }
    }
    if (typeof r.anomalyScore === 'number') cardioRiskScore += r.anomalyScore * 10;
    if (r.fallRisk === 'high' || r.fallRisk === 'critical') fallRiskScore += r.fallRisk === 'critical' ? 25 : 10;
  }

  const averageHeartRate = heartRateCount ? heartRateSum / heartRateCount : 0;
  const averageSteps = stepsCount ? stepsSum / stepsCount : 0;
  const averageWalkingSteadiness = steadinessCount ? steadinessSum / steadinessCount : 0;

  // Normalize risk scores to 0-100 ranges heuristically
  const fallRisk = Math.min(100, fallRiskScore);
  const cardiovascularRisk = Math.min(100, cardioRiskScore);
  sleepQualityScore = sleepQualityScore && stepsCount ? Math.min(100, sleepQualityScore / stepsCount) : 0;

  function calcTrend(selector: (r: ProcessedHealthRecord) => number | undefined): TrendDirection {
    const earlyVals = earlyWindow.map(selector).filter((v): v is number => typeof v === 'number');
    const recentVals = recentWindow.map(selector).filter((v): v is number => typeof v === 'number');
    if (!earlyVals.length || !recentVals.length) return 'stable';
    const earlyAvg = earlyVals.reduce((a,b)=>a+b,0)/earlyVals.length;
    const recentAvg = recentVals.reduce((a,b)=>a+b,0)/recentVals.length;
    const delta = recentAvg - earlyAvg;
    const pct = earlyAvg === 0 ? 0 : (delta / earlyAvg) * 100;
    if (pct > 5) return 'increasing';
    if (pct < -5) return 'decreasing';
    return 'stable';
  }

  const trends = {
    heartRate: calcTrend(r => r.type === 'heart_rate' ? r.value : undefined),
    steps: calcTrend(r => r.type === 'steps' ? r.value : undefined),
    walkingSteadiness: calcTrend(r => r.type === 'walking_steadiness' ? r.value : undefined),
  };

  return {
    totalRecords,
    averageHeartRate,
    averageSteps,
    averageWalkingSteadiness,
    riskScores: {
      fallRisk,
      cardiovascularRisk,
      sleepQuality: sleepQualityScore,
    },
    trends,
  };
}
