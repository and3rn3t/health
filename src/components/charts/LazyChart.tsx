/**
 * Lazy-loaded chart components to reduce initial bundle size
 * Recharts is ~150KB+ and should only be loaded when charts are actually rendered
 */

import { Suspense, lazy } from 'react';

// Lazy load Recharts - only loaded when charts are actually rendered
const LazyLineChart = lazy(() =>
  import('recharts').then((module) => ({ default: module.LineChart }))
);

const LazyAreaChart = lazy(() =>
  import('recharts').then((module) => ({ default: module.AreaChart }))
);

const LazyBarChart = lazy(() =>
  import('recharts').then((module) => ({ default: module.BarChart }))
);

const LazyComposedChart = lazy(() =>
  import('recharts').then((module) => ({ default: module.ComposedChart }))
);

// Small chart components can be imported directly (they're tree-shakeable)
export {
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

// Re-export types
export type { TooltipProps, LegendProps } from 'recharts';

// Lazy chart components with Suspense wrapper
interface LazyChartProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ChartSuspense = ({ children, fallback }: LazyChartProps) => (
  <Suspense fallback={fallback || <div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>}>
    {children}
  </Suspense>
);

// Type-safe wrapper components
interface ChartWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  [key: string]: any; // Allow all Recharts props
}

export const LazyLineChartWrapper = ({ children, fallback, ...props }: ChartWrapperProps) => (
  <ChartSuspense fallback={fallback}>
    <LazyLineChart {...props}>{children}</LazyLineChart>
  </ChartSuspense>
);

export const LazyAreaChartWrapper = ({ children, fallback, ...props }: ChartWrapperProps) => (
  <ChartSuspense fallback={fallback}>
    <LazyAreaChart {...props}>{children}</LazyAreaChart>
  </ChartSuspense>
);

export const LazyBarChartWrapper = ({ children, fallback, ...props }: ChartWrapperProps) => (
  <ChartSuspense fallback={fallback}>
    <LazyBarChart {...props}>{children}</LazyBarChart>
  </ChartSuspense>
);

export const LazyComposedChartWrapper = ({ children, fallback, ...props }: ChartWrapperProps) => (
  <ChartSuspense fallback={fallback}>
    <LazyComposedChart {...props}>{children}</LazyComposedChart>
  </ChartSuspense>
);
