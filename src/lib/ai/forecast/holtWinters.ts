export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
  lower?: number;
  upper?: number;
}

export interface HoltWintersOptions {
  seasonLength?: number; // e.g., 7 for daily seasonality over a week
  alpha?: number; // level
  beta?: number; // trend
  gamma?: number; // season
  horizon?: number; // steps ahead
  conf?: number; // ± stdev multiplier
}

export function holtWinters(
  dates: string[],
  values: number[],
  opts: HoltWintersOptions = {}
): ForecastPoint[] {
  const n = Math.min(dates.length, values.length);
  const horizon = opts.horizon ?? 7;
  const conf = opts.conf ?? 1.0;
  if (n < 4) return linearForecast(dates, values, horizon); // fallback

  const L = opts.seasonLength ?? 7;
  const alpha = opts.alpha ?? 0.3;
  const beta = opts.beta ?? 0.1;
  const gamma = opts.gamma ?? 0.1;

  // Initialize level, trend, and seasonal indices
  const seasonals = new Array(L).fill(0);
  const seasonAvg = values.slice(0, L).reduce((s, v) => s + v, 0) / L;
  for (let i = 0; i < L; i++) {
    seasonals[i] = values[i] - seasonAvg;
  }

  let level = seasonAvg;
  let trend = (values[L] - values[0]) / L;

  const residuals: number[] = [];
  for (let t = 0; t < n; t++) {
    const sIdx = t % L;
    const seasonal = seasonals[sIdx];
    const forecast = level + trend + seasonal;
    const e = values[t] - forecast;
    residuals.push(e);

    // Update components
    const newLevel =
      alpha * (values[t] - seasonal) + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    const newSeasonal = gamma * (values[t] - newLevel) + (1 - gamma) * seasonal;

    level = newLevel;
    trend = newTrend;
    seasonals[sIdx] = newSeasonal;
  }

  // Residual stdev for bands
  const meanE = residuals.reduce((s, v) => s + v, 0) / residuals.length;
  const stdevE = Math.sqrt(
    residuals.reduce((s, v) => s + (v - meanE) * (v - meanE), 0) /
      Math.max(1, residuals.length - 1)
  );

  // Forecast horizon
  const lastDate = new Date(dates[n - 1]);
  const out: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + h);
    const sIdx = (n + h - 1) % L;
    const seasonal = seasonals[sIdx];
    const point = level + h * trend + seasonal;
    out.push({
      date: nextDate.toISOString().split('T')[0],
      forecast: point,
      lower: point - conf * stdevE,
      upper: point + conf * stdevE,
    });
  }

  return out;
}

export function linearForecast(
  dates: string[],
  values: number[],
  horizon: number
): ForecastPoint[] {
  const n = Math.min(dates.length, values.length);
  if (n === 0) return [];
  if (n === 1) {
    const lastDate = new Date(dates[0]);
    return Array.from({ length: horizon }).map((_, i) => {
      const d = new Date(lastDate);
      d.setDate(lastDate.getDate() + i + 1);
      return { date: d.toISOString().split('T')[0], forecast: values[0] };
    });
  }

  // Least squares fit y = a + b t
  const t = Array.from({ length: n }, (_, i) => i + 1);
  const sumT = t.reduce((s, v) => s + v, 0);
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumTY = t.reduce((s, v, i) => s + v * values[i], 0);
  const sumTT = t.reduce((s, v) => s + v * v, 0);
  const denom = n * sumTT - sumT * sumT || 1;
  const b = (n * sumTY - sumT * sumY) / denom;
  const a = (sumY - b * sumT) / n;

  const lastDate = new Date(dates[n - 1]);
  return Array.from({ length: horizon }).map((_, i) => {
    const d = new Date(lastDate);
    d.setDate(lastDate.getDate() + i + 1);
    const tt = n + i + 1;
    return { date: d.toISOString().split('T')[0], forecast: a + b * tt };
  });
}
