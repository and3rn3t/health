---
name: add-health-chart
description: "Create a new Recharts health data visualization with real-time WebSocket updates, dark mode support, and accessibility. Use when building trend charts, time series, score visualizations, or any health metric chart."
argument-hint: "Chart type and metric (e.g., 'heart rate line chart', 'gait score area chart', 'fall risk trend')"
---

# Add Health Chart

## When to Use
- Visualize health metrics over time (line, area, bar charts)
- Show real-time data from WebSocket feed
- Create trend analysis or scoring visualizations
- Build comparative metric displays

## Procedure

### 1. Create Chart Component
Create `src/components/health/<ChartName>.tsx`:

```tsx
import { type FC, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { getVitalSenseClasses } from '@/lib/vitalsense-colors';

interface ChartNameProps {
  data: DataPoint[];
  title: string;
  isLoading?: boolean;
}

interface DataPoint {
  timestamp: string;
  value: number;
}

const chartConfig: ChartConfig = {
  value: {
    label: 'Metric Name',
    color: '#2563eb', // VitalSense primary blue
  },
};

export const ChartName: FC<ChartNameProps> = ({ data, title, isLoading }) => {
  const formattedData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString(),
      })),
    [data]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              role="img"
              aria-label={`${title} chart showing ${data.length} data points`}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
```

### 2. Add Real-Time Data (if WebSocket-fed)
Connect to live health data via hooks:

```tsx
import { useLiveHealthData } from '@/hooks/useLiveHealthData';

// Inside component:
const { metrics, isConnected } = useLiveHealthData();
```

### 3. Style with VitalSense Tokens
- Use `ChartContainer` + `ChartConfig` from `src/components/ui/chart.tsx`
- VitalSense palette: primary `#2563eb`, accent `#056487`, semantic health colors
- Dark mode: chart adapts via CSS variables (handled by `ChartContainer`)
- Reference: `src/lib/vitalsense-colors.ts` for `getVitalSenseClasses()`

### 4. Accessibility
- Add `role="img"` and `aria-label` to the chart SVG
- Provide a data table alternative for screen readers (hidden visually, accessible)
- Use sufficient color contrast for chart lines/fills
- Include `aria-live="polite"` region for real-time updates

### 5. Performance
- `useMemo` for data transformations
- Limit data points displayed (e.g., last 100 for real-time)
- Lazy load chart component if not above the fold: `React.lazy()`
- Keep chart bundle contribution reasonable (Recharts is ~40KB gzipped)

### 6. Test
Create `src/components/health/<ChartName>.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartName } from './<ChartName>';

const mockData = [
  { timestamp: '2026-04-07T10:00:00Z', value: 72 },
  { timestamp: '2026-04-07T10:05:00Z', value: 75 },
];

describe('ChartName', () => {
  it('renders chart with data', () => {
    render(<ChartName data={mockData} title="Heart Rate" />);
    expect(screen.getByText('Heart Rate')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ChartName data={[]} title="Heart Rate" isLoading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('has accessible chart label', () => {
    render(<ChartName data={mockData} title="Heart Rate" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label');
  });
});
```

## Chart Types Reference
- **Line**: Time series, trends (heart rate, steps, scores)
- **Area**: Cumulative metrics, ranges (sleep phases, activity zones)
- **Bar**: Discrete comparisons (daily totals, weekly summaries)
- **Composed**: Multiple metrics overlaid (gait + balance scores)

## Checklist
- [ ] Uses `ChartContainer` + `ChartConfig` from `src/components/ui/chart.tsx`
- [ ] VitalSense color tokens (not hardcoded hex in chart lines)
- [ ] Dark mode renders correctly
- [ ] `role="img"` + `aria-label` on chart SVG
- [ ] Loading state with skeleton or message
- [ ] `useMemo` on data transformations
- [ ] Colocated test file with render + accessibility checks
- [ ] Bundle size acceptable (lazy load if needed)
