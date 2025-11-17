# LiDAR WebSocket & Error Handling Integration

## ✅ Completed Integrations

### 1. WebSocket Streaming ✓

#### WebSocketManager+LiDAR.swift
Created comprehensive WebSocket extension for LiDAR data streaming:

- **`sendLiDARScanProgress`** - Real-time scan progress streaming
  - Progress percentage
  - Point count
  - Scan quality
  - Frame count and motion samples
  
- **`sendLiDARScanResult`** - Complete scan results
  - Full scan metadata (ID, type, date, duration)
  - Metrics (score, quality, frame count)
  - Insights with recommendations
  - Type-specific metrics (gait, fall risk, balance, environmental)
  
- **`sendLiDARGaitMetrics`** - Real-time gait metrics
  - Cadence (steps per minute)
  - Stride length
  - Walking speed
  - Step symmetry
  
- **`sendLiDAREnvironmentalData`** - Environmental scan data
  - Obstacle positions (3D coordinates)
  - Obstacle count
  - Floor stability score
  - Hazard count
  
- **`sendLiDARBalanceData`** - Balance analysis data
  - Center of mass position
  - Postural sway measurement
  - Stability score

#### Streaming Integration Points

1. **Scan Progress** - Streamed every 0.5 seconds during scan
   - Location: `LiDARScanningManager.updateScanProgress()`
   - Data: Progress, point count, quality, frame/motion counts

2. **Real-time Gait Metrics** - Streamed every 1 second during gait analysis
   - Location: `LiDARCameraView.streamGaitMetricsIfNeeded()`
   - Data: Cadence, stride length, walking speed, step symmetry

3. **Environmental Data** - Streamed every 1 second during environmental scans
   - Location: `LiDARCameraView.streamEnvironmentalDataIfNeeded()`
   - Data: Obstacles, floor stability, hazards

4. **Balance Data** - Streamed every 1 second during balance tests
   - Location: `LiDARCameraView.streamBalanceDataIfNeeded()`
   - Data: Center of mass, postural sway, stability score

5. **Completed Results** - Streamed when scan completes
   - Location: `LiDARScanningManager.processScanData()`
   - Data: Complete scan result with all metrics and insights

### 2. Error Handling Integration ✓

#### ErrorHandler.swift Updates

**New Error Categories:**
- `.lidar` - LiDAR-specific errors
- `.arkit` - ARKit and AR session errors
- `.ml` - Machine learning and CoreML errors

**Error Detection:**
- Automatic category detection from error domain
- ARKit errors → `.arkit` category
- LiDAR errors → `.lidar` category
- ML errors → `.ml` category

#### Error Handling Integration Points

1. **Scan Initialization**
   - Location: `LiDARScanningManager.startScan()`
   - Errors: LiDAR unavailable, scan start failures
   - Severity: High (blocks scan functionality)
   - Recovery: None (requires device support)

2. **AR Session Setup**
   - Location: `LiDARCameraView.makeUIView()`
   - Errors: Scene reconstruction not supported, AR session failures
   - Severity: Critical/High (blocks AR functionality)
   - Recovery: Retry (max 2 attempts)

3. **Frame Processing**
   - Location: `LiDARCameraView.session(_:didUpdate:)`
   - Errors: No scene depth data, frame processing failures
   - Severity: Low/Medium (non-blocking)
   - Recovery: Retry (max 1 attempt)

4. **AR Frame Collection**
   - Location: `LiDARScanningManager.processFrame()`
   - Errors: Frame processing failures
   - Severity: Medium (affects data quality)
   - Recovery: Retry (max 1 attempt)

5. **Motion Tracking**
   - Location: `LiDARScanningManager.startMotionTracking()`
   - Errors: Accelerometer/gyroscope unavailable, update failures
   - Severity: Low/Medium (features degraded)
   - Recovery: Fallback (continue without motion data)

6. **Scan Processing**
   - Location: `LiDARScanningManager.processScanData()`
   - Errors: No frames collected, processing failures
   - Severity: Medium (blocks result generation)
   - Recovery: None (cannot recover missing data)

7. **HealthKit Integration**
   - Location: `LiDARScanningManager.saveToHealthKit()`
   - Errors: HealthKit not authorized, save failures
   - Severity: Medium (blocks health data saving)
   - Recovery: UserAction/Retry

8. **Gait Metrics Extraction**
   - Location: `LiDARScanningManager.saveGaitMetricsToHealthKit()`
   - Errors: Failed to extract gait metrics
   - Severity: Low (optional feature)
   - Recovery: None

9. **Walking Speed/Step Length Save**
   - Location: `LiDARScanningManager.saveGaitMetricsToHealthKit()`
   - Errors: HealthKit save failures
   - Severity: Low (non-critical)
   - Recovery: Retry (max 1 attempt)

10. **WebSocket Streaming**
    - Location: `LiDARScanningManager.processScanData()`
    - Errors: Failed to send scan result
    - Severity: Low (non-blocking, offline support)
    - Recovery: Reconnect (automatic retry)

### 3. Error Recovery Strategies ✓

**Implemented Recovery Strategies:**

- **`.none`** - No recovery (user action required)
  - LiDAR unavailable
  - Scene reconstruction not supported
  - No frames collected

- **`.retry(maxAttempts: Int)`** - Automatic retry
  - AR session failures (max 2 attempts)
  - Frame processing failures (max 1 attempt)
  - HealthKit save failures (max 1-2 attempts)
  - Scan data processing (max 3 attempts)

- **`.reconnect`** - WebSocket reconnection
  - Failed to send scan result
  - WebSocket connection issues

- **`.fallback`** - Graceful degradation
  - Accelerometer/gyroscope unavailable
  - Continue with reduced functionality

- **`.userAction`** - Requires user intervention
  - HealthKit authorization required
  - Permission issues

### 4. Analytics Integration ✓

**Analytics Events Logged:**

- `lidar_scan_started` - When scan begins
  - Parameters: scan_type, duration
  
- `lidar_ar_session_started` - When AR session starts
  - Parameters: scan_type, scene_reconstruction type

**Error Analytics:**
- All errors logged to `ErrorHandler`
- Critical errors automatically reported
- Error history maintained (last 100 errors)
- Error rate tracking

## 📊 Data Flow

### Real-time Streaming Flow
```
AR Frame → Process → Calculate Metrics → Stream to WebSocket
    ↓           ↓              ↓                   ↓
ARFrame    Analysis    Gait/Env/Balance    WebSocketManager
                           Metrics              ↓
                                          Web Platform
```

### Error Handling Flow
```
Operation → Error Occurred → ErrorHandler.handle()
    ↓              ↓                  ↓
Try Operation   Catch Error    Categorize Error
    ↓              ↓                  ↓
Success      Determine Severity   Log Error
                            ↓
                    Attempt Recovery
                            ↓
              Retry/Fallback/UserAction
```

### WebSocket Streaming Protocol

**Message Format:**
```json
{
  "type": "lidar_scan_progress|lidar_scan_result|lidar_gait_metrics|...",
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "ios_lidar",
  "data": {
    // Type-specific data
  }
}
```

**Message Types:**
- `lidar_scan_progress` - Real-time scan progress
- `lidar_scan_result` - Completed scan results
- `lidar_gait_metrics` - Real-time gait metrics
- `lidar_environmental_data` - Environmental scan data
- `lidar_balance_data` - Balance analysis data

## 🔧 Technical Implementation

### Streaming Throttling
- **Scan Progress**: Every 0.5 seconds (2 Hz)
- **Gait Metrics**: Every 1 second (1 Hz)
- **Environmental Data**: Every 1 second (1 Hz)
- **Balance Data**: Every 1 second (1 Hz)

### Error Severity Levels
- **Critical**: App cannot function (AR session failures)
- **High**: Major feature broken (LiDAR unavailable)
- **Medium**: Feature degraded (HealthKit save failures, frame processing issues)
- **Low**: Minor issue, non-blocking (WebSocket failures, missing optional data)

### Error Categories
- **`.lidar`**: LiDAR-specific errors
- **`.arkit`**: ARKit and AR session errors
- **`.ml`**: Machine learning errors
- **`.websocket`**: WebSocket connection errors
- **`.healthKit`**: HealthKit save errors
- **`.data`**: Motion sensor errors

## 📝 Error Examples

### Example 1: LiDAR Unavailable
```swift
ErrorHandler.shared.handle(
    AppError(
        error: NSError(domain: "LiDARScanningManager", code: -1, ...),
        context: "LiDAR scan start",
        category: .lidar,
        severity: .high,
        recovery: .none
    )
)
```

### Example 2: AR Session Failure
```swift
ErrorHandler.shared.handle(
    error,
    context: "Starting AR session",
    category: .arkit,
    severity: .critical,
    recovery: .retry(maxAttempts: 2)
)
```

### Example 3: WebSocket Streaming Failure
```swift
ErrorHandler.shared.handle(
    AppError(...),
    context: "LiDAR scan result streaming",
    category: .websocket,
    severity: .low,
    recovery: .reconnect
)
```

## 🚀 Benefits

### WebSocket Streaming Benefits
- **Real-time Updates**: Web platform receives live scan data
- **Better UX**: Caregivers can monitor scans in real-time
- **Data Synchronization**: Ensures web platform has latest data
- **Offline Support**: Buffers data when disconnected

### Error Handling Benefits
- **Graceful Degradation**: App continues functioning with reduced features
- **User Awareness**: Users informed of critical issues
- **Automatic Recovery**: Many errors automatically retry
- **Error Tracking**: Comprehensive error history for debugging
- **Analytics Integration**: Error rates and patterns tracked

## 📈 Performance Considerations

### Streaming Performance
- Throttled to prevent network overload
- Non-blocking async operations
- Background queue processing
- Automatic buffering when offline

### Error Handling Performance
- Lightweight error objects
- Async error processing
- Minimal UI impact
- Efficient error history storage

## ✅ Testing Recommendations

### WebSocket Testing
- [ ] Verify all message types are sent correctly
- [ ] Test streaming throttling
- [ ] Test offline buffering
- [ ] Test reconnection after network loss

### Error Handling Testing
- [ ] Test all error scenarios
- [ ] Verify error recovery strategies
- [ ] Test error history persistence
- [ ] Verify user-facing error alerts

## 🔍 Code Quality

### Error Handling Best Practices
- ✅ Comprehensive error coverage
- ✅ Appropriate severity levels
- ✅ Recovery strategies for all error types
- ✅ User-friendly error messages
- ✅ Error logging and analytics

### WebSocket Best Practices
- ✅ Type-safe message formats
- ✅ Throttled streaming
- ✅ Error handling for send failures
- ✅ Offline support
- ✅ Reconnection handling
