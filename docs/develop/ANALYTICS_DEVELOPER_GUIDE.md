# Analytics Feature - Developer Guide

## Architecture Overview

The Analytics feature consists of:

```
src/
├── lib/
│   └── analytics.ts                    # Core analytics utilities
├── components/
│   └── analytics/
│       ├── EnhancedAnalyticsDashboard.tsx  # Main dashboard
│       ├── TimeSeriesChart.tsx             # Trend visualizations
│       ├── CorrelationMatrix.tsx            # Correlation analysis
│       ├── AnomalyDetectionPanel.tsx        # Anomaly detection
│       ├── PatternDetectionPanel.tsx        # Pattern recognition
│       ├── PredictiveAnalytics.tsx          # Forecasts
│       ├── MetricComparisonCard.tsx         # Period comparison
│       └── AnalyticsExporter.tsx           # Export functionality
```

## Core Library

### analytics.ts

**Purpose**: Provides analytics calculations and data processing utilities

**Key Functions**:

#### `calculateTrend(data, days)`
Calculates trend analysis for time series data.

**Returns**: `TrendAnalysis`
```typescript
{
  direction: 'improving' | 'stable' | 'declining' | 'volatile';
  slope: number;              // Rate of change per day
  rSquared: number;          // Goodness of fit (0-1)
  confidence: number;         // Confidence in trend (0-1)
  changePercent: number;     // Percentage change
  volatility: number;        // Standard deviation / mean
  prediction?: {
    nextValue: number;
    nextDate: Date;
    confidence: number;
  };
}
```

**Algorithm**: Linear regression with R² calculation

#### `calculateCorrelation(data1, data2)`
Calculates correlation between two time series.

**Returns**: `CorrelationAnalysis`
```typescript
{
  metric1: string;
  metric2: string;
  correlation: number;       // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  significance: number;       // Statistical significance (0-1)
  sampleSize: number;
  interpretation: string;
}
```

**Algorithm**: Pearson correlation coefficient

#### `detectPatterns(data)`
Identifies patterns in time series data.

**Returns**: `PatternDetection[]`
```typescript
{
  pattern: 'daily' | 'weekly' | 'seasonal' | 'irregular';
  strength: number;          // 0-1
  description: string;
  peakTimes?: string[];
  lowTimes?: string[];
}
```

**Algorithm**: Variance analysis and day-of-week grouping

#### `detectAnomalies(data, threshold)`
Detects anomalies using statistical methods.

**Returns**: `AnomalyDetection`
```typescript
{
  anomalies: Anomaly[];
  anomalyScore: number;      // 0-1
  normalRange: { min: number; max: number };
}
```

**Algorithm**: Z-score based outlier detection (default threshold: 2.5σ)

#### `extractTimeSeries(metric, timeRange)`
Extracts time series data from metric data.

**Returns**: `TimeSeriesDataPoint[]`

**Time Ranges**: `'7d' | '30d' | '90d' | '1y' | 'all' | 'custom'`

## Components

### EnhancedAnalyticsDashboard

**Purpose**: Main analytics dashboard component

**Props**:
```typescript
interface EnhancedAnalyticsDashboardProps {
  healthData: ProcessedHealthData | null;
  historicalData?: ProcessedHealthData[];
}
```

**Features**:
- Tabbed interface (Overview, Trends, Correlations, Anomalies, Patterns, Predictions)
- Time range selection
- Summary cards
- Integration of all analytics components

### TimeSeriesChart

**Purpose**: Interactive time series visualization

**Props**:
```typescript
interface TimeSeriesChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  unit?: string;
  color?: string;
  showTrend?: boolean;
  showPrediction?: boolean;
  height?: number;
}
```

**Features**:
- SVG-based line/area chart
- Trend overlay
- Prediction line
- Interactive tooltips
- Grid lines and axis labels

### CorrelationMatrix

**Purpose**: Visualizes correlations between metrics

**Props**:
```typescript
interface CorrelationMatrixProps {
  healthData: ProcessedHealthData;
  metrics?: string[];
}
```

**Features**:
- Correlation strength visualization
- Statistical significance
- Interpretation text
- Key insights summary

### AnomalyDetectionPanel

**Purpose**: Displays detected anomalies

**Props**:
```typescript
interface AnomalyDetectionPanelProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
  threshold?: number;
}
```

**Features**:
- Anomaly score indicator
- Individual anomaly details
- Severity classification
- Normal range display

### PatternDetectionPanel

**Purpose**: Shows detected patterns

**Props**:
```typescript
interface PatternDetectionPanelProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
}
```

**Features**:
- Pattern type identification
- Strength indicators
- Peak/low time detection
- Pattern insights

### PredictiveAnalytics

**Purpose**: Forecasts future trends

**Props**:
```typescript
interface PredictiveAnalyticsProps {
  healthData: ProcessedHealthData;
  forecastDays?: number;
}
```

**Features**:
- 30-day forecasts
- Trend-based predictions
- Confidence scores
- Change indicators

### MetricComparisonCard

**Purpose**: Compares periods

**Props**:
```typescript
interface MetricComparisonCardProps {
  healthData: ProcessedHealthData;
  metric: 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours';
  period: '7d' | '30d' | '90d';
}
```

**Features**:
- Current vs. previous comparison
- Change percentages
- Trend indicators
- Percentile rankings

### AnalyticsExporter

**Purpose**: Exports analytics data

**Props**:
```typescript
interface AnalyticsExporterProps {
  healthData: ProcessedHealthData | null;
  analyticsSummary: AnalyticsSummary;
}
```

**Formats**:
- PDF (simulated - would use jsPDF/PDFKit)
- CSV (implemented)
- JSON (implemented)

## Data Flow

1. **Data Input**: `ProcessedHealthData` from health data processor
2. **Time Series Extraction**: Convert metric data to time series
3. **Analysis**: Apply analytics functions (trend, correlation, etc.)
4. **Visualization**: Render charts and panels
5. **Export**: Generate reports in various formats

## Integration Points

### Health Data Processor

Analytics uses data from:
- `ProcessedHealthData.metrics` - Metric data
- `ProcessedHealthData.healthScore` - Overall health score
- `ProcessedHealthData.dataQuality` - Data quality metrics

### Fall Risk System

Analytics can integrate with:
- Fall risk predictions
- Risk factor analysis
- Intervention tracking

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Lazy Loading**: Load charts on demand
3. **Data Filtering**: Filter data before processing
4. **Caching**: Cache analysis results

### Data Limits

- **Time Series**: Max 1000 points per chart (performance)
- **Correlations**: Max 10 metrics (readability)
- **Anomalies**: Top 10 displayed (UI)
- **Patterns**: Max 5 patterns (relevance)

## Testing

### Unit Tests

Test analytics functions:
```typescript
describe('calculateTrend', () => {
  it('calculates trend for increasing data', () => {
    const data = generateIncreasingData();
    const trend = calculateTrend(data);
    expect(trend.direction).toBe('improving');
  });
});
```

### Component Tests

Test visualization components:
```typescript
describe('TimeSeriesChart', () => {
  it('renders chart with data', () => {
    const data = generateTimeSeries();
    render(<TimeSeriesChart data={data} title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Extending Analytics

### Adding New Metrics

1. Update `MetricType` in `analytics.ts`
2. Add metric to `extractTimeSeries` logic
3. Update component props
4. Add visualization if needed

### Adding New Analysis

1. Create function in `analytics.ts`
2. Define return type
3. Create component for visualization
4. Integrate into dashboard

### Custom Visualizations

1. Create component in `components/analytics/`
2. Use SVG or chart library
3. Follow existing component patterns
4. Add to dashboard tabs

## Production Considerations

### Chart Libraries

Consider using:
- **Recharts**: React charting library
- **D3.js**: Powerful visualization library
- **Chart.js**: Simple chart library

### PDF Generation

For PDF export:
- **jsPDF**: Client-side PDF generation
- **PDFKit**: Server-side PDF generation
- **Puppeteer**: HTML to PDF conversion

### Performance Monitoring

Monitor:
- Chart render times
- Analysis calculation times
- Memory usage with large datasets
- Export generation times

## Future Enhancements

1. **Machine Learning**: ML-based predictions
2. **Real-time Updates**: Live analytics updates
3. **Custom Dashboards**: User-configurable layouts
4. **Advanced Visualizations**: 3D charts, heatmaps
5. **Collaborative Analytics**: Share insights
6. **API Integration**: External data sources

---

*Last Updated: January 2024*
