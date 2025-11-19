/**
 * Risk Comparison Benchmark Component
 * Compares user's fall risk with population benchmarks
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import React from 'react';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';

interface PopulationBenchmark {
  ageGroup: string;
  averageRisk: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
}

interface RiskComparisonBenchmarkProps {
  prediction: AdvancedFallRiskPrediction;
  userAge?: number;
  benchmarks?: PopulationBenchmark[];
}

// Default population benchmarks by age group
const DEFAULT_BENCHMARKS: PopulationBenchmark[] = [
  {
    ageGroup: '65-70',
    averageRisk: 25,
    percentile25: 15,
    percentile50: 25,
    percentile75: 35,
    percentile90: 50,
  },
  {
    ageGroup: '71-75',
    averageRisk: 35,
    percentile25: 20,
    percentile50: 35,
    percentile75: 50,
    percentile90: 65,
  },
  {
    ageGroup: '76-80',
    averageRisk: 45,
    percentile25: 30,
    percentile50: 45,
    percentile75: 60,
    percentile90: 75,
  },
  {
    ageGroup: '81-85',
    averageRisk: 55,
    percentile25: 40,
    percentile50: 55,
    percentile75: 70,
    percentile90: 85,
  },
  {
    ageGroup: '86+',
    averageRisk: 65,
    percentile25: 50,
    percentile50: 65,
    percentile75: 80,
    percentile90: 90,
  },
];

export default function RiskComparisonBenchmark({
  prediction,
  userAge = 72,
  benchmarks = DEFAULT_BENCHMARKS,
}: RiskComparisonBenchmarkProps) {
  // Determine user's age group
  const userAgeGroup = React.useMemo(() => {
    if (userAge < 65) return benchmarks[0];
    if (userAge <= 70) return benchmarks[0];
    if (userAge <= 75) return benchmarks[1];
    if (userAge <= 80) return benchmarks[2];
    if (userAge <= 85) return benchmarks[3];
    return benchmarks[4];
  }, [userAge, benchmarks]);

  // Calculate percentile
  const percentile = React.useMemo(() => {
    const score = prediction.riskScore;
    if (score <= userAgeGroup.percentile25) return 25;
    if (score <= userAgeGroup.percentile50) return 50;
    if (score <= userAgeGroup.percentile75) return 75;
    if (score <= userAgeGroup.percentile90) return 90;
    return 95;
  }, [prediction.riskScore, userAgeGroup]);

  // Calculate comparison to average
  const comparisonToAverage = React.useMemo(() => {
    const difference = prediction.riskScore - userAgeGroup.averageRisk;
    const percentDifference = userAgeGroup.averageRisk > 0
      ? (difference / userAgeGroup.averageRisk) * 100
      : 0;
    return {
      difference,
      percentDifference: Math.abs(percentDifference),
      isBetter: difference < 0,
    };
  }, [prediction.riskScore, userAgeGroup]);

  // Get percentile description
  const getPercentileDescription = (p: number): string => {
    if (p <= 25) return 'Lower risk than most';
    if (p <= 50) return 'Average risk';
    if (p <= 75) return 'Moderate risk';
    if (p <= 90) return 'Higher risk';
    return 'Significantly higher risk';
  };

  // Render comparison bar
  const renderComparisonBar = () => {
    const maxScore = Math.max(
      prediction.riskScore,
      userAgeGroup.percentile90,
      100
    );
    const userPosition = (prediction.riskScore / maxScore) * 100;
    const averagePosition = (userAgeGroup.averageRisk / maxScore) * 100;
    const p25Position = (userAgeGroup.percentile25 / maxScore) * 100;
    const p75Position = (userAgeGroup.percentile75 / maxScore) * 100;

    return (
      <div className="relative h-12 w-full rounded-lg bg-gray-100">
        {/* Percentile zones */}
        <div
          className="absolute left-0 top-0 h-full rounded-l-lg bg-green-200"
          style={{ width: `${p25Position}%` }}
        />
        <div
          className="absolute h-full bg-yellow-200"
          style={{
            left: `${p25Position}%`,
            width: `${p75Position - p25Position}%`,
          }}
        />
        <div
          className="absolute right-0 top-0 h-full rounded-r-lg bg-red-200"
          style={{ width: `${100 - p75Position}%` }}
        />

        {/* Markers */}
        <div
          className="absolute top-0 h-full w-0.5 bg-blue-600"
          style={{ left: `${userPosition}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
            You
          </div>
        </div>
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-600"
          style={{ left: `${averagePosition}%` }}
        >
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600">
            Avg
          </div>
        </div>

        {/* Labels */}
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{Math.round(maxScore)}</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Population Comparison
        </CardTitle>
        <CardDescription>
          Your risk compared to others in your age group ({userAgeGroup.ageGroup})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Comparison */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Your Risk Score</div>
              <div className="text-2xl font-bold">{prediction.riskScore.toFixed(1)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Age Group Average</div>
              <div className="text-2xl font-bold text-gray-600">
                {userAgeGroup.averageRisk.toFixed(1)}
              </div>
            </div>
          </div>

          {renderComparisonBar()}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {comparisonToAverage.isBetter ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">vs. Average</span>
              </div>
              <div
                className={`text-lg font-semibold ${
                  comparisonToAverage.isBetter ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparisonToAverage.isBetter ? '-' : '+'}
                {comparisonToAverage.percentDifference.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {comparisonToAverage.isBetter
                  ? 'Lower than average'
                  : 'Higher than average'}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Percentile</span>
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {percentile}th
              </div>
              <div className="text-xs text-gray-500">
                {getPercentileDescription(percentile)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Percentiles */}
        <div className="space-y-3">
          <h4 className="font-semibold">Percentile Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: '25th Percentile', value: userAgeGroup.percentile25, color: 'green' },
              { label: '50th Percentile (Median)', value: userAgeGroup.percentile50, color: 'yellow' },
              { label: '75th Percentile', value: userAgeGroup.percentile75, color: 'orange' },
              { label: '90th Percentile', value: userAgeGroup.percentile90, color: 'red' },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{p.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.value.toFixed(1)}</span>
                  {prediction.riskScore <= p.value && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Below
                    </Badge>
                  )}
                  {prediction.riskScore > p.value && (
                    <Badge variant="outline" className="text-xs">
                      Above
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">What This Means</h4>
          <p className="text-sm text-blue-800">
            Your fall risk score of {prediction.riskScore.toFixed(1)} places you in the{' '}
            {percentile}th percentile for your age group. This means your risk is{' '}
            {percentile <= 50 ? 'lower' : 'higher'} than {percentile}% of people in your age group.
            {comparisonToAverage.isBetter
              ? ' This is better than average - keep up the good work!'
              : ' Consider focusing on the recommended interventions to reduce your risk.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
