# Testing Scripts

This directory contains scripts for health monitoring, endpoint validation, and comprehensive testing.

## Scripts Overview

### Health Monitoring

- **`simple-probe.js`** - Quick health checks for development endpoints
- **`probe.js`** - Enhanced health monitoring with detailed output
- **`app-status-check.js`** - VitalSense application status verification

### Integration Testing

- **`test-runner.js`** - Comprehensive test suite coordination
- **`test-integration.js`** - Full system integration testing
- **`test-all-endpoints.js`** - Complete API endpoint validation

### Specialized Testing

- **`test-browser-endpoints.js`** - Browser-based endpoint testing
- **`test-enhanced-health-processing.js`** - Health data processing validation
- **`test-dev-env.js`** - Development environment validation

### WebSocket Testing

- **`test-websocket-client.js`** - WebSocket client functionality testing
- **`test-websocket-connection.js`** - WebSocket connection validation
- **`test-websocket-reconnect.js`** - WebSocket reconnection logic testing

### Authentication Testing

- **`test-auth0-login-page.js`** - Auth0 login page validation

## Usage Examples

```bash
# Quick health check
npm run test:quick

# Comprehensive testing
npm run test:full

# Enhanced health probe
npm run probe --verbose

# API endpoint validation
npm run test:api

# Production environment testing
npm run test:prod
```

## Test Categories

### Development Testing

- Local endpoint health checks
- Development server validation
- Quick smoke tests

### Integration Testing

- Full system integration validation
- Cross-service communication testing
- End-to-end workflow verification

### Production Testing

- Production endpoint validation
- Performance verification
- Security and authentication testing

## Key Features

- **Parallel execution** - Multiple endpoints tested simultaneously
- **Detailed reporting** - Comprehensive test results with timing
- **Environment awareness** - Different test suites for dev/staging/prod
- **WebSocket support** - Complete WebSocket functionality testing
- **Health monitoring** - Continuous health check capabilities
- **VitalSense branding verification** - Ensures consistent brand identity
