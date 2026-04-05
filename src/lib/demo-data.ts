// Demo data generators for VitalSense.
// Excluded from SonarCloud analysis via sonar-project.properties.
// Math.random() usage here is intentional — demo/simulation only, never security-sensitive.

export function generateDemoHealthData() {
  const now = new Date();
  const demoData = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    demoData.push(
      {
        id: `demo-heart-rate-${i}`,
        type: 'heart_rate',
        value: 70 + Math.floor(Math.random() * 10),
        unit: 'bpm',
        timestamp: date.toISOString(),
        processedAt: date.toISOString(),
        source: {
          userId: 'demo-user-vitalsense',
          deviceId: 'demo-device',
          appVersion: '1.0.0-demo',
        },
        healthScore: 85 + Math.floor(Math.random() * 10),
        fallRisk: 'low',
        anomalyScore: 0.1 + Math.random() * 0.2,
        dataQuality: {
          completeness: 0.95,
          accuracy: 0.98,
          timeliness: 0.92,
          consistency: 0.96,
        },
      },
      {
        id: `demo-steps-${i}`,
        type: 'steps',
        value: 8000 + Math.floor(Math.random() * 3000),
        unit: 'count',
        timestamp: date.toISOString(),
        processedAt: date.toISOString(),
        source: {
          userId: 'demo-user-vitalsense',
          deviceId: 'demo-device',
          appVersion: '1.0.0-demo',
        },
        healthScore: 88 + Math.floor(Math.random() * 8),
        fallRisk: 'low',
        anomalyScore: 0.05 + Math.random() * 0.15,
        dataQuality: {
          completeness: 0.98,
          accuracy: 0.95,
          timeliness: 0.9,
          consistency: 0.94,
        },
      },
    );
  }
  const sortedData = [...demoData].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sortedData;
}
