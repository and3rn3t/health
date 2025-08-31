# 🧪 iOS Testing Configuration Guide

## Overview

This guide covers the comprehensive testing configuration for the HealthKit Bridge iOS application. The testing setup includes unit tests, UI tests, performance tests, and automated CI/CD integration.

## Testing Architecture

### Test Targets

- **HealthKitBridgeTests**: Unit tests for business logic, API clients, and core functionality
- **HealthKitBridgeUITests**: User interface and integration tests
- **Performance Tests**: Memory, CPU, and response time validation

### Test Schemes

- **HealthKitBridge**: Main application scheme with debug configuration
- **HealthKitBridge-UnitTests**: Optimized for unit test execution with code coverage
- **HealthKitBridge-UITests**: UI test execution with simulator optimization
- **Performance Tests**: Specialized performance testing configuration

## Quick Start

### Prerequisites

```powershell
# Check dependencies
npm run ios:test:env-check

# Setup environment (first time only)
npm run ios:test:env-setup
```

### Running Tests

```powershell
# Run all tests
npm run ios:test

# Unit tests only
npm run ios:test:unit

# UI tests only
npm run ios:test:ui

# Performance tests
npm run ios:test:performance

# With code coverage
npm run ios:test:coverage

# On physical device
npm run ios:test:device

# Verbose output
npm run ios:test:verbose
```

## Test Configuration Files

### XCTestPlan (`HealthKitBridge.xctestplan`)

Centralized test configuration with multiple test scenarios:

- **Unit Tests**: Fast execution with code coverage
- **UI Tests**: Comprehensive UI validation
- **Performance Tests**: Resource monitoring and thresholds
- **All Tests**: Complete test suite execution

### Test Schemes (`xcshareddata/xcschemes/`)

- Environment variables for test execution
- Code coverage configuration
- Test execution ordering and parallelization
- Debug and memory debugging tools

### Environment Configuration

#### Test Environment Variables

```bash
TEST_HOST_URL=http://127.0.0.1:8789          # Backend API URL
TEST_WEBSOCKET_URL=ws://localhost:3001        # WebSocket server URL
TEST_TIMEOUT=30                               # Test timeout in seconds
MOCK_HEALTHKIT_DATA=YES                       # Enable HealthKit mocking
```

#### Performance Thresholds

```bash
MAX_MEMORY_USAGE_MB=100                       # Maximum memory usage
MAX_CPU_USAGE_PERCENT=80                      # Maximum CPU usage
MAX_RESPONSE_TIME_MS=2000                     # API response time limit
MAX_STARTUP_TIME_MS=5000                      # App startup time limit
```

### TestConfig.swift

Runtime test configuration helper providing:

- Environment variable access
- Test mode detection
- Performance threshold validation
- Mock configuration management
- Test data directory management

## Test Organization

### Unit Tests Structure

```
HealthKitBridgeTests/
├── HealthKitBridgeTests.swift          # Main test suite
├── HealthKitManagerTests.swift         # HealthKit integration
├── ApiClientTests.swift                # API communication
├── WebSocketManagerTests.swift         # Real-time communication
├── ConfigurationTests.swift            # Configuration validation
└── PerformanceMonitorTests.swift       # Performance monitoring
```

### Test Categories

1. **Core Functionality**: Basic app operations and singletons
2. **HealthKit Integration**: Permission handling and data processing
3. **Network Communication**: API calls and WebSocket messaging
4. **Configuration**: Settings validation and environment handling
5. **Performance**: Resource usage and timing validation
6. **UI/UX**: User interface and accessibility testing

## Advanced Testing Features

### Code Coverage

- Automatic coverage collection for unit tests
- Coverage reports in JSON format
- Minimum coverage thresholds (80% target)
- Function-level coverage tracking

### Performance Testing

- Memory usage monitoring
- CPU utilization tracking
- Response time measurement
- App startup time validation
- Battery usage assessment

### Mock System

- HealthKit data mocking for simulator testing
- API response mocking for offline testing
- WebSocket message simulation
- Configurable via environment variables

## Continuous Integration

### GitHub Actions Workflow

The `.github/workflows/ios-tests.yml` file provides:

- Multi-simulator testing (iPhone 15, iPad Air)
- Parallel test execution
- Code coverage reporting
- Performance benchmarking
- Artifact upload for test results

### Pre-commit Hooks

Automatic testing before commits:

- Swift linting validation
- Unit test execution
- TypeScript testing (for related changes)
- Environment validation

## Troubleshooting

### Common Issues

#### 1. Simulator Not Available

```powershell
# Reset simulators
xcrun simctl shutdown all
xcrun simctl erase all

# Re-setup environment
npm run ios:test:env-setup
```

#### 2. Test Environment Issues

```powershell
# Validate environment
npm run ios:test:env-check

# Clean test data
npm run ios:test:clean
```

#### 3. Code Coverage Not Generated

- Ensure tests run through correct scheme
- Check that `enableCodeCoverage` is set in test plans
- Verify xccov is available in PATH

#### 4. Performance Tests Failing

- Check performance thresholds in TestConfig.swift
- Monitor system resources during testing
- Adjust thresholds based on target device capabilities

### Debugging Tests

#### Enable Verbose Logging

```bash
export ENABLE_TEST_LOGGING=YES
export LOG_LEVEL=DEBUG
npm run ios:test:verbose
```

#### Capture Screenshots

```bash
export CAPTURE_SCREENSHOTS=YES
npm run ios:test:ui
```

#### Save Test Artifacts

```bash
export SAVE_TEST_ARTIFACTS=YES
npm run ios:test
```

## Best Practices

### Test Writing Guidelines

1. **Isolation**: Each test should be independent
2. **Naming**: Use descriptive test method names
3. **Setup/Teardown**: Proper test environment management
4. **Assertions**: Clear and specific test assertions
5. **Mocking**: Use mocks for external dependencies

### Performance Considerations

1. **Parallel Execution**: Unit tests can run in parallel
2. **UI Test Serialization**: UI tests run sequentially
3. **Resource Cleanup**: Proper memory and resource management
4. **Test Data**: Clean test data between runs

### Maintenance

1. **Regular Updates**: Keep test dependencies updated
2. **Coverage Monitoring**: Maintain minimum coverage thresholds
3. **Performance Baselines**: Update performance benchmarks
4. **Environment Sync**: Keep test environment in sync with production

## Integration with Development Workflow

### VS Code Tasks

Pre-configured tasks for testing:

- `iOS: Check Swift Errors`
- `iOS: Swift Lint`
- `iOS: Swift Format`
- Various test execution tasks

### npm Scripts

Comprehensive npm scripts for all testing scenarios:

- Environment setup and validation
- Individual test suite execution
- Coverage and performance testing
- Device and simulator testing

### Git Hooks

Automated quality gates:

- Pre-commit testing for iOS changes
- Lint and format validation
- Quick unit test execution

## Monitoring and Reporting

### Test Results

- Detailed test execution reports
- Pass/fail statistics
- Execution time tracking
- Error details and stack traces

### Code Coverage

- Line-by-line coverage reports
- Function coverage statistics
- Coverage trends over time
- Threshold validation

### Performance Metrics

- Memory usage profiles
- CPU utilization graphs
- Response time distributions
- Battery impact assessment

This testing configuration ensures comprehensive validation of the HealthKit Bridge application across all supported platforms and scenarios.
