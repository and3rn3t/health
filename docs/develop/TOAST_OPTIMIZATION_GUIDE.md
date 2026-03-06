# Toast Optimization Guide

This document outlines the toast optimization strategy, best practices, and optimal placements for toasts throughout the application.

## Overview

Toasts provide user feedback for actions and system events. To prevent toast spam and improve UX, we use the `useOnceToast` hook for deduplication and rate limiting.

## useOnceToast Hook

The `useOnceToast` hook provides:
- **Deduplication**: Same toast ID won't show twice within 5 seconds
- **Global Rate Limiting**: Maximum 1 toast per 500ms globally
- **Unique IDs**: Each component uses distinct IDs to avoid conflicts
- **Kill Switch**: `window.__DISABLE_TOASTS = true` suppresses all toasts

### Usage

```typescript
import { useOnceToast } from '@/hooks/useOnceToast';

function MyComponent() {
  const { showOnce } = useOnceToast();

  const handleAction = async () => {
    try {
      await doSomething();
      showOnce('action-success', 'success', 'Action completed!');
    } catch (error) {
      showOnce('action-error', 'error', 'Action failed');
    }
  };
}
```

## When to Use useOnceToast

### ✅ Use useOnceToast for:

1. **Auto-running functions** (useEffect, polling)
   - Device monitoring
   - Health data analysis
   - Background sync operations
   - Auto-refresh operations

2. **Analysis/processing functions**
   - AI insights generation
   - ML predictions
   - Trend analysis
   - Pattern detection

3. **Device/connection monitoring**
   - Battery alerts
   - Connection status
   - Error recovery

4. **Any function that might be called multiple times**
   - Retry logic
   - Polling loops
   - Event handlers that might fire rapidly

### ❌ Use direct `toast` for:

1. **User-initiated actions** (button clicks, form submissions)
   - Save operations
   - Delete confirmations
   - Form submissions
   - Manual refresh actions

2. **Critical events that should always show**
   - Fall detection
   - Emergency alerts
   - Security warnings

3. **One-time operations**
   - Initial setup
   - First-time user actions

## Optimal Toast Placements

### Already Optimized ✅

1. **Advanced Analytics Components**
   - `AIInsights.tsx` - Uses `useOnceToast` for auto-generation
   - `AIRecommendations.tsx` - Uses `useOnceToast` for recommendations
   - `AIInsightsCard.tsx` - Uses `useOnceToast` for insights
   - `EnhancedAIInsights.tsx` - Uses `useOnceToast` for enhanced insights
   - `MLPredictionsDashboard.tsx` - Uses `useOnceToast` for predictions
   - `PredictiveHealthAlerts.tsx` - Uses `useOnceToast` for alerts
   - `MovementPatternAnalysis.tsx` - Uses `useOnceToast` for analysis
   - `AnalyticsExporter.tsx` - Uses `useOnceToast` for exports
   - `AIUsagePredictions.tsx` - Uses `useOnceToast` for predictions

2. **Device Monitoring**
   - `DeviceHealthMonitor.tsx` - Uses `useOnceToast` for device alerts

### Opportunities for Optimization 🔄

1. **EnhancedHealthDataUpload.tsx**
   - Current: Uses React Query mutations with toast in callbacks
   - Opportunity: Could use `useOnceToast` if same action triggered multiple times
   - Priority: Low (React Query already handles some deduplication)

2. **useLiveHealthData.ts**
   - Current: No toast feedback for connection status
   - Opportunity: Add optional toast callbacks for:
     - Connection established
     - Connection lost
     - Reconnection attempts
   - Priority: Medium (would improve UX for connection issues)

3. **RealTimeFallDetection.tsx**
   - Current: Uses direct toasts for critical events
   - Opportunity: Use `useOnceToast` for non-critical actions (calibration, settings)
   - Priority: Low (critical events should always show)

### Missing Toast Feedback Opportunities 📍

1. **Background Sync Operations**
   - Location: `useLiveHealthData.ts`, WebSocket reconnection
   - Action: Show toast when sync completes or fails
   - Type: `info` for success, `error` for failures
   - Use: `useOnceToast` with ID like `sync-status-${timestamp}`

2. **Data Export Operations**
   - Location: Various export components
   - Action: Show progress and completion
   - Type: `loading` → `success` or `error`
   - Use: `useOnceToast` for deduplication

3. **Settings Save Operations**
   - Location: `UserSettingsPanel.tsx`
   - Current: Has toasts ✅
   - Opportunity: Use `useOnceToast` if rapid saves possible

4. **Family Member Operations**
   - Location: `FamilyMemberManager.tsx`, `EnhancedFamilyDashboard.tsx`
   - Current: Has toasts ✅
   - Opportunity: Use `useOnceToast` for batch operations

5. **Emergency Contact Operations**
   - Location: `EnhancedEmergencyContacts.tsx`, `EmergencyContacts.tsx`
   - Current: Has toasts ✅
   - Status: Appropriate (user-initiated actions)

## Testing Strategy

### Unit Tests
- `src/hooks/__tests__/useOnceToast.test.ts` - Comprehensive hook tests
- Tests deduplication, rate limiting, kill switch, reset functionality

### Integration Tests
- `src/components/health/__tests__/DeviceHealthMonitor.toast.test.tsx` - Device monitoring toast deduplication
- `src/components/analytics/__tests__/ToastDeduplication.integration.test.tsx` - Cross-component deduplication
- `src/components/health/__tests__/PredictiveHealthAlerts.toast.test.tsx` - Alert toast usage

### Test Coverage
- ✅ Deduplication within 5 seconds
- ✅ Global rate limiting (500ms)
- ✅ Unique ID handling
- ✅ Multiple hook instances sharing state
- ✅ SSR safety
- ✅ Kill switch functionality
- ✅ Reset functionality

## Best Practices

1. **Use descriptive, unique IDs**
   - Format: `component-action-identifier`
   - Example: `ai-insights-generated`, `device-battery-low-${deviceId}`

2. **Include context in toast messages**
   - Be specific about what happened
   - Include relevant data when helpful
   - Use appropriate severity levels

3. **Consider user experience**
   - Don't show toasts for every minor event
   - Use `info` for informational messages
   - Use `warning` for important but non-critical
   - Use `error` for failures that need attention
   - Use `success` for completed actions

4. **Handle edge cases**
   - Check for SSR environment
   - Handle rapid state changes
   - Consider network failures

## Migration Checklist

When migrating existing toasts to `useOnceToast`:

- [ ] Identify if toast is in auto-running function
- [ ] Replace `toast.*` with `useOnceToast().showOnce`
- [ ] Create unique ID for the toast
- [ ] Add `showOnce` to dependency arrays if needed
- [ ] Update tests to mock `useOnceToast`
- [ ] Verify deduplication works correctly
- [ ] Test with rapid state changes

## Examples

### Before (Direct Toast)
```typescript
useEffect(() => {
  if (data) {
    analyzeData();
    toast.success('Analysis complete');
  }
}, [data]);
```

### After (useOnceToast)
```typescript
const { showOnce } = useOnceToast();

useEffect(() => {
  if (data && insights.length === 0) {
    analyzeData();
    showOnce('analysis-complete', 'success', 'Analysis complete');
  }
}, [data]);
```

## Performance Considerations

- `useOnceToast` adds minimal overhead
- Deduplication prevents UI spam
- Global rate limiting prevents toast storms
- Window-scoped state allows cross-component deduplication

## Future Enhancements

1. **Toast Queue Management**
   - Queue toasts when rate limit hit
   - Show queued toasts when limit clears

2. **User Preferences**
   - Allow users to disable specific toast types
   - Remember user dismissals

3. **Toast Analytics**
   - Track toast frequency
   - Identify spam sources
   - Optimize based on usage patterns

