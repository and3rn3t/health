# Fall Risk Analysis Feature - Developer Guide

## Architecture Overview

The Fall Risk Analysis feature consists of several interconnected components:

```
src/
├── components/health/
│   ├── EnhancedFallRiskDashboard.tsx      # Main dashboard
│   ├── FallRiskHistoryChart.tsx           # Historical trend visualization
│   ├── RiskFactorDetailView.tsx           # Detailed risk factor views
│   ├── FallRiskReportExporter.tsx         # Report export functionality
│   ├── SensorDataVisualization.tsx        # Real-time sensor monitoring
│   ├── RiskComparisonBenchmark.tsx         # Population comparison
│   └── InterventionProgressAnalytics.tsx  # Progress tracking
├── hooks/
│   └── useFallRiskHistory.ts              # History management hook
└── lib/
    ├── advanced-fall-risk-engine.ts       # Core risk calculation engine
    ├── enhanced-fall-detection-engine.ts  # Real-time detection
    └── enhanced-intervention-engine.ts    # Intervention management
```

## Component Details

### FallRiskHistoryChart

**Purpose**: Visualizes historical fall risk trends over time

**Props**:
```typescript
interface FallRiskHistoryChartProps {
  historyData: FallRiskHistoryDataPoint[];
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  showTrends?: boolean;
  showBreakdown?: boolean;
}
```

**Key Features**:
- SVG-based line chart rendering
- Time range filtering
- Trend statistics calculation
- Risk level zone visualization
- Category breakdown display

**Usage Example**:
```tsx
<FallRiskHistoryChart
  historyData={history}
  timeRange="30d"
  showTrends={true}
  showBreakdown={true}
/>
```

### RiskFactorDetailView

**Purpose**: Provides detailed information about individual risk factors

**Props**:
```typescript
interface RiskFactorDetailViewProps {
  riskFactor: RiskFactor;
  onInterventionClick?: (interventionId: string) => void;
  showInterventions?: boolean;
}
```

**Key Features**:
- Expandable/collapsible details
- Intervention recommendations
- Modifiability indicators
- Category and trend display

### FallRiskReportExporter

**Purpose**: Exports fall risk assessments in multiple formats

**Props**:
```typescript
interface FallRiskReportExporterProps {
  currentPrediction: AdvancedFallRiskPrediction;
  historyData?: FallRiskHistoryDataPoint[];
  onExport?: (format: 'pdf' | 'json' | 'csv', data: ExportData) => void;
}
```

**Export Formats**:
- **PDF**: HTML-based report that opens in print dialog
- **JSON**: Machine-readable data structure
- **CSV**: Spreadsheet-compatible format with historical data

### SensorDataVisualization

**Purpose**: Real-time visualization of sensor data for fall detection

**Props**:
```typescript
interface SensorDataVisualizationProps {
  sensorData: EnhancedSensorData;
  showHistory?: boolean;
  historyLength?: number;
}
```

**Features**:
- Real-time gauge displays
- Mini charts for historical trends
- Risk indicator alerts
- Multi-sensor data display

### RiskComparisonBenchmark

**Purpose**: Compares user risk with population benchmarks

**Props**:
```typescript
interface RiskComparisonBenchmarkProps {
  prediction: AdvancedFallRiskPrediction;
  userAge?: number;
  benchmarks?: PopulationBenchmark[];
}
```

**Features**:
- Age group comparison
- Percentile calculation
- Visual comparison bars
- Benchmark interpretation

### InterventionProgressAnalytics

**Purpose**: Tracks and visualizes intervention progress

**Props**:
```typescript
interface InterventionProgressAnalyticsProps {
  interventionPlan: PersonalizedInterventionPlan;
  showDetails?: boolean;
}
```

**Features**:
- Overall progress tracking
- Individual intervention metrics
- Risk reduction visualization
- Active vs completed interventions

## Hooks

### useFallRiskHistory

**Purpose**: Manages historical fall risk data with localStorage persistence

**API**:
```typescript
const {
  history,              // Array of historical data points
  isLoading,           // Loading state
  addPrediction,       // Add new prediction to history
  clearHistory,         // Clear all history
  getLatest,           // Get most recent prediction
  getTrend,            // Calculate trend statistics
} = useFallRiskHistory();
```

**Storage**:
- Uses localStorage key: `vitalsense-fall-risk-history`
- Maximum 100 data points (oldest removed when limit reached)
- Automatically loads on mount
- Persists on add/clear operations

**Usage Example**:
```tsx
const { history, addPrediction, getTrend } = useFallRiskHistory();

// Add new prediction
addPrediction(prediction);

// Get trend
const trend = getTrend();
// Returns: { trend: 'improving' | 'declining' | 'stable', change, changePercent }
```

## Data Structures

### FallRiskHistoryDataPoint

```typescript
interface FallRiskHistoryDataPoint {
  date: Date;
  riskScore: number;
  riskLevel: AdvancedFallRiskPrediction['riskLevel'];
  gaitRisk: number;
  balanceRisk: number;
  environmentalRisk: number;
  physiologicalRisk: number;
  behavioralRisk: number;
  prediction: AdvancedFallRiskPrediction;
}
```

### AdvancedFallRiskPrediction

See `src/lib/advanced-fall-risk-engine.ts` for full definition. Key properties:
- `riskScore`: 0-100 overall risk
- `riskLevel`: Classification level
- `confidence`: Prediction confidence (0-1)
- Temporal predictions (short/medium/long-term)
- Multi-dimensional risk assessments
- Risk factors and interventions

## Integration Points

### Dashboard Integration

The `EnhancedFallRiskDashboard` integrates all components:

```tsx
// History tracking
const { history, addPrediction } = useFallRiskHistory();

// Save prediction after assessment
useEffect(() => {
  if (prediction) {
    addPrediction(prediction);
  }
}, [prediction]);

// Component usage
<FallRiskHistoryChart historyData={history} />
<RiskComparisonBenchmark prediction={prediction} userAge={userProfile.age} />
<FallRiskReportExporter currentPrediction={prediction} historyData={history} />
```

### Data Flow

1. **Assessment**: `AdvancedFallRiskEngine.predictFallRisk()` generates prediction
2. **Storage**: `useFallRiskHistory.addPrediction()` saves to history
3. **Display**: Components consume prediction and history data
4. **Export**: `FallRiskReportExporter` formats data for export

## Testing

### Unit Tests

Tests are located in `src/components/health/__tests__/` and `src/hooks/__tests__/`:

- `FallRiskHistoryChart.test.tsx`
- `RiskFactorDetailView.test.tsx`
- `FallRiskReportExporter.test.tsx`
- `useFallRiskHistory.test.ts`

### Test Patterns

```typescript
// Component rendering
render(<Component {...props} />);

// User interactions
fireEvent.click(screen.getByText('Button'));

// Hook testing
const { result } = renderHook(() => useHook());

// Async operations
await waitFor(() => {
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

### Mock Data

Use the test utilities to create mock data:

```typescript
const createMockPrediction = (riskScore: number): AdvancedFallRiskPrediction => {
  // ... mock implementation
};

const createMockHistoryData = (count: number): FallRiskHistoryDataPoint[] => {
  // ... mock implementation
};
```

## Styling

Components use:
- Tailwind CSS for styling
- shadcn/ui components for UI primitives
- Lucide React for icons
- Consistent color scheme from `vitalsense-colors`

## Performance Considerations

1. **History Limit**: Limited to 100 items to prevent localStorage bloat
2. **Lazy Loading**: Components use React.lazy for code splitting
3. **Memoization**: Use `useMemo` for expensive calculations
4. **Chart Rendering**: SVG charts are lightweight and scalable

## Browser Compatibility

- **localStorage**: Required for history persistence
- **SVG**: Required for chart rendering
- **File API**: Required for export functionality
- **Print API**: Required for PDF export

## Future Enhancements

Potential improvements:

1. **Cloud Sync**: Sync history across devices
2. **Advanced Analytics**: More sophisticated trend analysis
3. **Predictive Modeling**: ML-based risk forecasting
4. **Integration**: Connect with wearable devices
5. **Notifications**: Alert system for risk changes

## Troubleshooting

### History Not Persisting

- Check localStorage availability
- Verify storage quota not exceeded
- Check for errors in console

### Chart Not Rendering

- Verify SVG support
- Check data format matches expected structure
- Ensure sufficient data points

### Export Failing

- Check browser pop-up blocker
- Verify File API support
- Check console for errors

## Contributing

When adding new features:

1. Follow existing component patterns
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Maintain TypeScript types

---

*Last Updated: January 2024*
