#!/usr/bin/env node

/**
 * Quick Fix Option A: Minimal ML Server
 * Simple HTTP server with mock ML responses for testing
 */

import cors from 'cors';
import express from 'express';

const app = express();
const PORT = 3002; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Mock ML functions
function generateMockMLAnalysis(healthData) {
  return {
    metrics: [
      {
        metric_type: healthData.metric_type || 'heart_rate',
        current_value: healthData.value || 72,
        trend: 'stable',
        z_score: (Math.random() - 0.5) * 4,
        percentile: Math.round(Math.random() * 100),
      },
    ],
    predictions: [
      {
        metric_type: healthData.metric_type || 'heart_rate',
        predicted_value: (healthData.value || 72) + (Math.random() - 0.5) * 10,
        confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
        risk_level: Math.random() > 0.8 ? 'elevated' : 'normal',
        time_horizon: '24h',
      },
    ],
    anomalies:
      Math.random() > 0.75
        ? [
            {
              metric_type: healthData.metric_type || 'heart_rate',
              current_value: healthData.value || 72,
              expected_range: '62-82',
              severity: 'medium',
              z_score: 2.1,
            },
          ]
        : [],
    insights: [
      {
        metric_type: healthData.metric_type || 'heart_rate',
        insight: 'Heart rate showing steady improvement over past week',
        confidence: Math.round(Math.random() * 100) / 100,
      },
    ],
    confidence: Math.round((Math.random() * 0.2 + 0.8) * 100) / 100,
  };
}

function generateMockPredictions(metrics, timeHorizonDays) {
  const baselineValues = {
    heart_rate: 72,
    walking_steadiness: 85,
    gait_speed: 1.2,
    step_count: 8500,
    sleep_duration: 7.5,
  };

  return metrics.map((metricType) => {
    const baseValue = baselineValues[metricType] || 100;
    const trendFactor = (Math.random() - 0.5) * 0.2;

    return {
      metric_type: metricType,
      predicted_value: Math.round(baseValue * (1 + trendFactor) * 100) / 100,
      confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
      risk_level: Math.random() > 0.7 ? 'elevated' : 'normal',
      trend_direction: trendFactor > 0 ? 'increasing' : 'decreasing',
      factors: [
        `Recent ${metricType} patterns`,
        'Historical trends',
        'Activity correlation',
      ],
      time_horizon_days: timeHorizonDays,
    };
  });
}

function generateMockInsights() {
  return {
    insights: [
      {
        category: 'activity_patterns',
        title: 'Walking Consistency Improving',
        description:
          'Your daily walking patterns show 15% improvement over the past week',
        confidence: 0.89,
        impact: 'positive',
      },
      {
        category: 'health_trends',
        title: 'Heart Rate Variability',
        description:
          'Your resting heart rate has been stable, indicating good cardiovascular health',
        confidence: 0.92,
        impact: 'neutral',
      },
      {
        category: 'fall_risk',
        title: 'Balance Assessment',
        description: 'Your walking steadiness metrics suggest low fall risk',
        confidence: 0.85,
        impact: 'positive',
      },
    ],
    recommendations: [
      {
        category: 'exercise',
        recommendation:
          'Consider adding 10 minutes of balance exercises to your daily routine',
        priority: 'medium',
        expected_benefit: 'Improved stability and reduced fall risk',
      },
      {
        category: 'monitoring',
        recommendation:
          'Continue current activity level - your metrics are trending positively',
        priority: 'low',
        expected_benefit: 'Maintained health improvements',
      },
      {
        category: 'nutrition',
        recommendation: 'Stay hydrated to support cardiovascular health',
        priority: 'medium',
        expected_benefit: 'Optimal heart rate and energy levels',
      },
    ],
  };
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'QuickFix ML Server',
    timestamp: new Date().toISOString(),
  });
});

app.post('/ml/analyze', (req, res) => {
  console.log('🧠 Quick Fix ML Analysis requested');
  const healthData = req.body.data || req.body;
  const analysis = generateMockMLAnalysis(healthData);

  res.json({
    type: 'ml_analysis_complete',
    data: {
      analysisId: `analysis_${Date.now()}`,
      timestamp: new Date().toISOString(),
      healthData: healthData,
      analysis: analysis,
      confidence: analysis.confidence,
      recommendations: analysis.insights.map((i) => i.insight),
    },
  });
});

app.post('/ml/predictions', (req, res) => {
  console.log('🔮 Quick Fix ML Predictions requested');
  const { metrics = ['heart_rate'], time_horizon_days = 7 } = req.body;
  const predictions = generateMockPredictions(metrics, time_horizon_days);

  res.json({
    type: 'health_predictions_response',
    data: {
      time_horizon_days,
      predictions,
      generated_at: new Date().toISOString(),
    },
  });
});

app.post('/ml/insights', (req, res) => {
  console.log('💡 Quick Fix ML Insights requested');
  const insights = generateMockInsights();

  res.json({
    type: 'personalized_insights_response',
    data: {
      insights: insights.insights,
      recommendations: insights.recommendations,
      generated_at: new Date().toISOString(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Quick Fix ML Server running!');
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   ML Analyze: POST http://localhost:${PORT}/ml/analyze`);
  console.log(
    `   ML Predictions: POST http://localhost:${PORT}/ml/predictions`
  );
  console.log(`   ML Insights: POST http://localhost:${PORT}/ml/insights`);
  console.log('\n💡 Quick Fix Option A: Mock ML server ready for testing!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Quick Fix ML Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Quick Fix ML Server terminated');
  process.exit(0);
});
