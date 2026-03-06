export interface AnomalyPoint {
  timestamp: string;
  value: number;
  expected: number;
  zscore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  confidence: number; // 0..100
}

export interface EwmaOptions {
  alpha?: number; // smoothing factor 0..1
  zThresholds?: [number, number, number]; // medium, high, critical
  minPoints?: number;
}

export function detectEwmaAnomalies(
  dates: string[],
  values: number[],
  opts: EwmaOptions = {}
): AnomalyPoint[] {
  const alpha = opts.alpha ?? 0.3;
  const [med, hi, crit] = opts.zThresholds ?? [2, 3, 4];
  const minPoints = opts.minPoints ?? 10;
  const n = Math.min(dates.length, values.length);
  if (n < minPoints) return [];

  const mean = values.reduce((s, v) => s + v, 0) / n;
  let ewma = mean;
  // use simple moving variance start
  let varEst =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1);

  const anomalies: AnomalyPoint[] = [];

  for (let i = 0; i < n; i++) {
    const v = values[i];
    const expected = ewma;
    const std = Math.sqrt(Math.max(1e-6, varEst));
    const z = std > 0 ? (v - expected) / std : 0;

    let severity: AnomalyPoint['severity'] | null = null;
    if (Math.abs(z) >= crit) severity = 'critical';
    else if (Math.abs(z) >= hi) severity = 'high';
    else if (Math.abs(z) >= med) severity = 'medium';

    if (severity) {
      anomalies.push({
        timestamp: dates[i],
        value: v,
        expected,
        zscore: z,
        severity,
        explanation:
          Math.sign(z) >= 0
            ? 'Value exceeds expected range'
            : 'Value drops below expected range',
        confidence: Math.min(
          100,
          Math.round(Math.min(1, Math.abs(z) / crit) * 100)
        ),
      });
    }

    // Update EWMA and variance estimates
    ewma = alpha * v + (1 - alpha) * ewma;
    const resid = v - ewma;
    varEst = (1 - alpha) * varEst + alpha * resid * resid;
  }

  return anomalies;
}
