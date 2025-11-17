# Analytics Setup Guide

This guide explains how to use and extend the AnalyticsManager for performance monitoring and analytics.

## 🎯 Current Implementation

The app includes a comprehensive `AnalyticsManager` that provides:
- Performance monitoring and timing
- Memory usage tracking
- Battery usage monitoring
- Event logging
- Session tracking
- Analytics provider abstraction

## 📊 Usage Examples

### Logging Events

```swift
// Log a user action
AnalyticsManager.shared.logEvent("gait_analysis_started", parameters: [
    "user_id": userId,
    "device_type": "iPhone"
])

// Log a screen view
AnalyticsManager.shared.logEvent("screen_view", parameters: [
    "screen_name": "HealthDashboard",
    "previous_screen": "Settings"
])
```

### Performance Monitoring

```swift
// Time an operation automatically
let timer = AnalyticsManager.shared.startTiming("data_fetch")
// ... perform operation ...
_ = timer.stop() // Automatically records timing

// Or manually record timing
AnalyticsManager.shared.recordTiming("operation_name", duration: 2.5)
```

### Memory & Battery Monitoring

```swift
// Record current memory usage
AnalyticsManager.shared.recordMemoryUsage()

// Record current battery usage
AnalyticsManager.shared.recordBatteryUsage()

// These are called automatically every 60 seconds
```

### Querying Analytics

```swift
// Get average duration for an operation
if let avgDuration = AnalyticsManager.shared.getAverageDuration(for: "data_fetch") {
    print("Average fetch time: \(avgDuration)s")
}

// Get operation count
let count = AnalyticsManager.shared.getOperationCount("gait_analysis")

// Get metrics summary
let summary = AnalyticsManager.shared.getMetricsSummary()
print("Total operations: \(summary.totalOperations)")
print("Average duration: \(summary.averageDuration)s")
print("Slowest operation: \(summary.slowestOperation ?? "none")")
```

## 🔧 Integrating External Analytics SDKs

### Firebase Analytics

**Setup:**

1. Add Firebase SDK (if not already added for Crashlytics)

2. Create `FirebaseAnalyticsProvider`:
```swift
import FirebaseAnalytics

class FirebaseAnalyticsProvider: AnalyticsProvider {
    func logEvent(_ event: AnalyticsEvent) {
        Analytics.logEvent(event.name, parameters: convertParameters(event.parameters))
    }
    
    func logError(_ event: AnalyticsEvent) {
        Analytics.logEvent("error", parameters: convertParameters(event.parameters))
    }
    
    func logPerformance(_ metric: PerformanceMetric) {
        Analytics.logEvent("performance_metric", parameters: [
            "operation": metric.operation,
            "duration": String(metric.duration),
            "timestamp": ISO8601DateFormatter().string(from: metric.timestamp)
        ])
    }
    
    private func convertParameters(_ params: [String: String]) -> [String: Any] {
        return params.mapValues { $0 }
    }
}
```

3. Add to `AnalyticsManager.setupProviders()`:
```swift
providers.append(FirebaseAnalyticsProvider())
```

### Mixpanel

**Setup:**

1. Add Mixpanel SDK via SPM

2. Create `MixpanelAnalyticsProvider`:
```swift
import Mixpanel

class MixpanelAnalyticsProvider: AnalyticsProvider {
    private let mixpanel = Mixpanel.mainInstance()
    
    func logEvent(_ event: AnalyticsEvent) {
        mixpanel.track(event: event.name, properties: event.parameters)
    }
    
    func logError(_ event: AnalyticsEvent) {
        mixpanel.track(event: "error", properties: event.parameters)
    }
    
    func logPerformance(_ metric: PerformanceMetric) {
        mixpanel.track(event: "performance", properties: [
            "operation": metric.operation,
            "duration": metric.duration
        ])
    }
}
```

### Amplitude

Similar pattern - implement `AnalyticsProvider` protocol and add to providers list.

## 📈 Performance Monitoring

### Automatic Monitoring

The app automatically monitors:
- App initialization time
- Background sync duration
- HealthKit sync duration
- Memory usage (every 60 seconds)
- Battery usage (every 60 seconds)

### Custom Monitoring

Add performance monitoring to any operation:

```swift
// Method 1: Automatic (recommended)
let timer = analyticsManager.startTiming("custom_operation")
defer { _ = timer.stop() }
// ... your code ...

// Method 2: Manual
let startTime = Date()
// ... your code ...
let duration = Date().timeIntervalSince(startTime)
analyticsManager.recordTiming("custom_operation", duration: duration)
```

### Performance Thresholds

The manager automatically alerts on:
- Operations taking > 5 seconds
- High memory usage (> 80%)
- Low battery (< 20%)

## 🔍 Analytics Dashboard (Future Enhancement)

Create a SwiftUI view to display analytics:

```swift
struct AnalyticsDashboardView: View {
    @StateObject private var analytics = AnalyticsManager.shared
    
    var body: some View {
        List {
            Section("Performance Metrics") {
                ForEach(analytics.performanceMetrics.prefix(20)) { metric in
                    HStack {
                        Text(metric.operation)
                        Spacer()
                        Text(String(format: "%.3fs", metric.duration))
                    }
                }
            }
            
            Section("Session") {
                if let session = analytics.sessionMetrics {
                    Text("Duration: \(formatDuration(session.duration ?? 0))")
                    Text("Events: \(session.eventsCount)")
                }
            }
            
            Section("Memory") {
                if let memory = analytics.memoryUsage {
                    Text("Used: \(String(format: "%.2f", memory.usedMB)) MB")
                    Text("Total: \(String(format: "%.2f", memory.totalMB)) MB")
                    Text("Percentage: \(String(format: "%.1f", memory.percentage))%")
                }
            }
        }
        .navigationTitle("Analytics")
    }
}
```

## 🎯 Best Practices

1. **Event Naming:**
   - Use snake_case: `gait_analysis_started`
   - Be descriptive: `health_metric_viewed` not `viewed`
   - Group by feature: `gait_*`, `health_*`, `notification_*`

2. **Parameters:**
   - Keep parameter keys consistent
   - Use appropriate value types
   - Don't include PII unless necessary

3. **Performance:**
   - Don't block UI for analytics
   - Use async/background queue for heavy operations
   - Batch events when possible

4. **Privacy:**
   - Respect user privacy preferences
   - Don't track sensitive health data
   - Follow privacy manifest declarations

## ✅ Checklist

- [ ] Analytics manager initialized in app
- [ ] Key user actions logged
- [ ] Performance bottlenecks identified
- [ ] Memory/battery monitoring active
- [ ] External SDK integrated (if needed)
- [ ] Privacy considerations addressed
- [ ] Analytics dashboard created (optional)

## 📚 Additional Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Mixpanel Documentation](https://developer.mixpanel.com/docs/swift)
- [Amplitude Documentation](https://developers.amplitude.com/docs/ios)
