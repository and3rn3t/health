# AI Insights Feature - Developer Guide

## Architecture Overview

The AI Insights feature consists of:

```
src/components/analytics/
├── AIInsightsCard.tsx              # Compact dashboard card
├── EnhancedAIInsights.tsx          # Full-featured insights component
└── __tests__/
    ├── AIInsightsCard.test.tsx
    ├── EnhancedAIInsights.test.tsx
    └── AIInsights.integration.test.tsx
```

## Core Components

### AIInsightsCard

**Purpose**: Compact card component for dashboard display

**Props**:
```typescript
interface AIInsightsCardProps {
  healthData: ProcessedHealthData | null;
  compact?: boolean;
}
```

**Features**:
- Auto-generates insights on mount
- Displays top 2-3 insights (sorted by priority)
- Opens full insights in dialog
- Refresh capability
- Loading states

**Usage**:
```tsx
<AIInsightsCard healthData={healthData} compact={false} />
```

### EnhancedAIInsights

**Purpose**: Full-featured insights component with advanced features

**Props**:
```typescript
interface EnhancedAIInsightsProps {
  healthData: ProcessedHealthData | null;
}
```

**Features**:
- Tabbed interface (All, High Priority, Actionable, Achievements)
- Custom health questions
- Detailed insight cards
- Summary statistics
- Comprehensive filtering

**Usage**:
```tsx
<EnhancedAIInsights healthData={healthData} />
```

## Insight Generation

### Insight Types

```typescript
type InsightType = 
  | 'recommendation' 
  | 'warning' 
  | 'achievement' 
  | 'prediction' 
  | 'insight';
```

### Insight Structure

```typescript
interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  confidence: number;        // 0-100
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category?: string;
  impact?: number;           // 1-10
  timeframe?: string;
  relatedMetrics?: string[];
}
```

### Generation Logic

Insights are generated based on:

1. **Metric Thresholds**:
   - Steps < 5000 → Activity recommendation
   - Sleep < 7 hours → Sleep warning
   - Steadiness < 60% → Balance warning

2. **Trend Analysis**:
   - Declining trends → Warnings
   - Improving trends → Achievements/Predictions
   - Stable trends → Status insights

3. **Health Score**:
   - Score > 80 → Achievement
   - Score < 60 → Warning

4. **Fall Risk Factors**:
   - Presence of factors → Fall risk prediction
   - Multiple factors → High priority warning

5. **Correlations**:
   - Metric relationships → Insights
   - Pattern detection → Predictions

## Integration Points

### Analytics Dashboard

```tsx
// In EnhancedAnalyticsDashboard.tsx
import AIInsightsCard from './AIInsightsCard';
import EnhancedAIInsights from './EnhancedAIInsights';

// Card in summary section
<AIInsightsCard healthData={healthData} />

// Tab content
<TabsContent value="ai-insights">
  <EnhancedAIInsights healthData={healthData} />
</TabsContent>
```

### Health Data Integration

```typescript
// Uses ProcessedHealthData
const insights = generateInsights(healthData);

// Analyzes metrics
const steps = healthData.metrics.steps.average;
const steadiness = healthData.metrics.walkingSteadiness.average;
const sleep = healthData.metrics.sleepHours.average;
const healthScore = healthData.healthScore;
```

### Analytics Functions

```typescript
// Uses analytics utilities
import { calculateTrend, extractTimeSeries } from '@/lib/analytics';

// Trend analysis
const trend = calculateTrend(timeSeriesData);

// Time series extraction
const data = extractTimeSeries(metric, '30d');
```

## Custom Query System

### Implementation

```typescript
const handleCustomQuery = async () => {
  // Generate personalized response
  const answer = generateAnswer(customQuery, healthData);
  setCustomResponse(answer);
};
```

### Response Generation

- Analyzes health data metrics
- Provides personalized recommendations
- Includes actionable steps
- Adds disclaimers (not medical advice)

## Testing

### Unit Tests

**AIInsightsCard.test.tsx**:
- Renders with/without health data
- Generates insights on mount
- Displays top insights
- Opens dialog
- Handles errors

**EnhancedAIInsights.test.tsx**:
- Renders all tabs
- Filters insights
- Handles custom queries
- Displays summary statistics
- Generates specific insights

### Integration Tests

**AIInsights.integration.test.tsx**:
- Card-dialog interaction
- Consistent insight generation
- Data change handling
- Empty state handling

### Test Utilities

```typescript
// Mock health data generator
const createMockHealthData = (overrides?: Partial<ProcessedHealthData>) => ({
  // Default structure
  ...overrides,
});

// Mock analytics functions
vi.mock('@/lib/analytics', () => ({
  calculateTrend: vi.fn(),
  extractTimeSeries: vi.fn(),
}));
```

## Extending Insights

### Adding New Insight Types

1. **Update Type Definition**:
```typescript
type InsightType = 
  | 'recommendation' 
  | 'warning' 
  | 'achievement' 
  | 'prediction' 
  | 'insight'
  | 'new-type';  // Add new type
```

2. **Add Generation Logic**:
```typescript
if (condition) {
  generatedInsights.push({
    id: 'insight-new',
    type: 'new-type',
    title: 'New Insight',
    content: 'Description',
    // ... other fields
  });
}
```

3. **Add Icon/Color**:
```typescript
const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'new-type':
      return <NewIcon className="h-5 w-5 text-color" />;
    // ... other cases
  }
};
```

### Adding New Analysis

1. **Create Analysis Function**:
```typescript
function analyzeNewMetric(metric: MetricData): AIInsight | null {
  if (condition) {
    return {
      id: 'insight-new-metric',
      type: 'recommendation',
      // ... insight data
    };
  }
  return null;
}
```

2. **Integrate into Generation**:
```typescript
const insight = analyzeNewMetric(healthData.metrics.newMetric);
if (insight) {
  generatedInsights.push(insight);
}
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Lazy Loading**: Load insights on demand
3. **Debouncing**: Debounce custom query submissions
4. **Caching**: Cache generated insights

### Data Limits

- **Max Insights**: 20 per generation
- **Top Insights**: 3 in compact view
- **Query Length**: Max 500 characters

## Production Considerations

### AI/ML Integration

Currently uses rule-based analysis. For production:

1. **ML Model Integration**:
```typescript
// Example with ML model
const mlInsights = await mlModel.predict(healthData);
generatedInsights.push(...mlInsights);
```

2. **External AI Services**:
```typescript
// Example with OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});
```

3. **Hybrid Approach**:
- Rule-based for common patterns
- ML for complex analysis
- External AI for custom queries

### Error Handling

```typescript
try {
  const insights = await generateInsights(healthData);
  setInsights(insights);
} catch (error) {
  console.error('Error generating insights:', error);
  toast.error('Failed to generate insights');
  // Fallback to basic insights
  setInsights(getBasicInsights(healthData));
}
```

## Future Enhancements

1. **ML-Based Predictions**: Use machine learning for more accurate predictions
2. **Personalization**: Learn from user preferences and history
3. **Real-time Updates**: Update insights as data changes
4. **Multi-language Support**: Support multiple languages
5. **Voice Queries**: Support voice input for custom queries
6. **Insight History**: Track insight effectiveness over time
7. **A/B Testing**: Test different insight presentations

## Maintenance

### When Adding Features

1. Update insight types if needed
2. Add generation logic
3. Update UI components
4. Add tests
5. Update documentation

### When Fixing Bugs

1. Add regression test
2. Update documentation if behavior changes
3. Verify all insight types still work
4. Test with various health data scenarios

---

*Last Updated: January 2024*
