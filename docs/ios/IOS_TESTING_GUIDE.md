# 🧪 iOS Testing Guide

Comprehensive testing strategy for the HealthKit Bridge iOS application.

## 📋 Test Structure

### Unit Tests (`/ios/HealthKitBridgeTests/`)

- **HealthKitBridgeTests.swift** - Main test suite with basic functionality
- **HealthKitManagerTests.swift** - HealthKit integration and data handling tests
- **ApiClientTests.swift** - API communication and networking tests
- **WebSocketManagerTests.swift** - Real-time communication tests
- **ConfigurationTests.swift** - Configuration and environment tests
- **PerformanceMonitorTests.swift** - Performance monitoring and metrics tests

### UI Tests (`/ios/HealthKitBridgeUITests/`)

- **HealthKitBridgeUITests.swift** - Basic UI functionality tests
- **HealthKitBridgeUITestsComprehensive.swift** - Complete UI testing suite

## 🚀 Running Tests

### Quick Commands

```bash
# Run all tests
npm run ios:test

# Run only unit tests
npm run ios:test:unit

# Run only UI tests
npm run ios:test:ui

# Run performance tests
npm run ios:test:performance

# Run with code coverage
npm run ios:test:coverage

# Run on physical device
npm run ios:test:device

# Run with verbose output
npm run ios:test:verbose
```

### Advanced Test Runner

```bash
# Run specific test case
pwsh ios/scripts/ios-test-runner.ps1 -Unit -TestCase "testHealthKitAvailability"

# Run tests on specific simulator
pwsh ios/scripts/ios-test-runner.ps1 -All -Simulator "iPhone 14 Pro"

# Run with coverage and performance analysis
pwsh ios/scripts/ios-test-runner.ps1 -All -Coverage -Performance
```

## 🧪 Test Categories

### 1. **Configuration Tests**

- App configuration validation
- Environment-specific settings
- URL format validation
- Config.plist integrity
- Thread safety of configuration access

### 2. **HealthKit Integration Tests**

- HealthKit availability checks
- Permission request handling
- Data type validation
- Background delivery setup
- Observer query management
- Data processing and validation

### 3. **API Communication Tests**

- Device token retrieval
- Health data transmission
- Network error handling
- Request/response validation
- Authentication flow
- Concurrent request handling

### 4. **WebSocket Communication Tests**

- Connection establishment
- Message sending/receiving
- Reconnection logic
- Error handling
- Mock mode testing
- Message serialization

### 5. **Performance Monitoring Tests**

- Metric recording accuracy
- Statistics calculation
- Memory usage tracking
- Network performance monitoring
- Battery usage tracking
- Concurrent access safety

### 6. **UI Functionality Tests**

- App launch and stability
- HealthKit permission prompts
- Health data display
- Connection status indicators
- Button interactions
- Navigation flow
- Error state handling
- Background/foreground transitions
- Accessibility compliance

## 📊 Test Coverage Areas

### Core Functionality

- [x] Singleton pattern implementation
- [x] Configuration loading and validation
- [x] HealthKit permission management
- [x] Health data reading and processing
- [x] API communication
- [x] WebSocket real-time communication
- [x] Performance monitoring
- [x] Error handling and recovery

### Edge Cases

- [x] Invalid configuration handling
- [x] Network connectivity issues
- [x] HealthKit permission denial
- [x] Large data set processing
- [x] Memory pressure scenarios
- [x] Battery optimization
- [x] Background task management

### User Experience

- [x] App launch performance
- [x] UI responsiveness
- [x] Error message clarity
- [x] Loading state management
- [x] Accessibility features
- [x] Offline functionality

## 🔧 Test Environment Setup

### Prerequisites

1. **Xcode** - Latest version with iOS SDK
2. **iOS Simulator** - Multiple device types for testing
3. **Physical Device** - For device-specific testing (optional)
4. **PowerShell** - For running test scripts on Windows

### Configuration

```bash
# Set up iOS development environment
npm run ios:setup

# Verify iOS project structure
npm run ios:check

# Run quick validation
npm run ios:quick
```

### Test Data

Tests use mock data and sandbox environments:

- Mock HealthKit data for simulator testing
- Test API endpoints for network communication
- Simulated WebSocket server for real-time testing

## 📈 Performance Testing

### Metrics Tracked

- **HealthKit Read Performance**
  - Data retrieval duration
  - Sample processing time
  - Memory usage during reads

- **API Call Performance**
  - Request/response latency
  - Success/failure rates
  - Concurrent request handling

- **WebSocket Performance**
  - Connection establishment time
  - Message processing latency
  - Reconnection efficiency

- **UI Performance**
  - Launch time
  - Navigation responsiveness
  - Scrolling performance

### Performance Thresholds

- HealthKit reads: < 2 seconds for 1000 samples
- API calls: < 5 seconds timeout
- WebSocket messages: < 100ms processing time
- UI interactions: < 16ms frame time

## 🚨 Testing Best Practices

### Unit Testing

1. Test each component in isolation
2. Use dependency injection for testability
3. Mock external dependencies (HealthKit, network)
4. Test both success and failure scenarios
5. Validate thread safety for shared components

### UI Testing

1. Test real user workflows
2. Handle system permission dialogs
3. Validate accessibility compliance
4. Test on multiple device sizes
5. Verify offline/online state handling

### Integration Testing

1. Test component interactions
2. Validate end-to-end data flow
3. Test against real backend services
4. Verify performance under load
5. Test error propagation and handling

## 🐛 Debugging Test Issues

### Common Issues

**Test Target Missing**

```bash
# Verify test targets are properly configured
xcodebuild -list -project ios/HealthKitBridge.xcodeproj
```

**Simulator Issues**

```bash
# Reset simulator if tests fail
xcrun simctl erase all
```

**Permission Dialogs**

```bash
# Grant permissions programmatically in tests
# Use UI testing framework to handle system dialogs
```

**Network Connectivity**

```bash
# Ensure development server is running
npm run cf:dev

# Check WebSocket server
npm run start:server
```

### Test Debugging

1. **Enable Verbose Logging**

   ```bash
   npm run ios:test:verbose
   ```

2. **Run Individual Test Cases**

   ```bash
   pwsh ios/scripts/ios-test-runner.ps1 -Unit -TestCase "testSpecificFunction"
   ```

3. **Generate Coverage Reports**

   ```bash
   npm run ios:test:coverage
   ```

4. **Review Test Results**
   - Check Xcode test navigator
   - Review console output for detailed logs
   - Analyze performance metrics

## 📋 Test Checklist

### Before Release

- [ ] All unit tests passing
- [ ] All UI tests passing
- [ ] Performance tests within thresholds
- [ ] Code coverage > 80%
- [ ] No memory leaks detected
- [ ] Error scenarios handled gracefully
- [ ] Accessibility requirements met
- [ ] Device testing completed
- [ ] Integration tests passing

### Continuous Integration

- [ ] Automated test execution
- [ ] Test result reporting
- [ ] Coverage trend monitoring
- [ ] Performance regression detection
- [ ] Flaky test identification

## 🎯 Testing Goals

1. **Reliability** - Ensure app functions correctly under all conditions
2. **Performance** - Maintain responsive user experience
3. **Compatibility** - Work across iOS versions and devices
4. **Accessibility** - Support users with disabilities
5. **Security** - Protect sensitive health data
6. **Maintainability** - Enable confident code changes

## 📚 Additional Resources

- [iOS Testing Documentation](../ios/README.md)
- [HealthKit Testing Best Practices](../ios/IOS_DEVELOPMENT_WINDOWS.md)
- [Performance Monitoring Guide](../troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md)
- [Build Troubleshooting](../troubleshooting/BUILD_TROUBLESHOOTING.md)
