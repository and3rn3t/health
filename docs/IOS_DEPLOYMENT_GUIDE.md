# 🚀 iOS App Deployment Guide for Cloudflare Integration

This guide explains how to deploy multiple iOS apps that connect to Cloudflare Workers infrastructure.

## 📋 Overview

Your health platform can support multiple iOS apps (main app, caregiver dashboard, senior-friendly version, clinical tools) all sharing the same Cloudflare Workers backend with proper environment isolation.

### Architecture

```text
iOS Apps (Multiple Variants)
    ↕ HTTP/WebSocket
Cloudflare Workers (Edge Network)
    ↕ Storage
Cloudflare KV/R2/Durable Objects
```

## 🏗️ App Deployment Process

### 1. Single App Deployment

#### Development Environment

```bash
# Generate iOS configurations for development
npm run ios:deploy:dev

# Start Cloudflare Worker locally
npm run cf:dev

# Start WebSocket server for realtime features
npm run start:server

# Open iOS project in Xcode
open ios/HealthKitBridge.xcodeproj
```

#### Staging Environment

```bash
# Deploy worker to Cloudflare staging
wrangler deploy --env staging

# Generate iOS configurations for staging
npm run ios:deploy:staging

# Build iOS app for TestFlight
# Use Xcode: Product > Archive > Distribute App
```

#### Production Environment

```bash
# Deploy worker to Cloudflare production
wrangler deploy --env production

# Generate iOS configurations for production
npm run ios:deploy:prod

# Build iOS app for App Store
# Use Xcode: Product > Archive > Upload to App Store
```

### 2. Multi-App Deployment

#### List Available Apps

```bash
npm run multi-app:list
```

Shows configured apps:

- **health-main**: Main health monitoring app
- **health-caregiver**: Caregiver dashboard app
- **health-senior**: Simplified senior-friendly app
- **health-clinical**: Healthcare provider dashboard

#### Create New App Variants

```bash
# Interactive mode (recommended for first-time setup)
npm run multi-app:interactive

# Or create specific app
npm run multi-app -- -Action create -AppName health-caregiver -Force
```

#### Deploy Multiple Apps

```bash
# Deploy all apps to development
npm run multi-app:deploy:dev

# Deploy all apps to staging
npm run multi-app:deploy:staging

# Deploy specific apps
npm run multi-app -- -Action deploy -Apps @('health-main','health-caregiver') -Environment production
```

## 🔧 Configuration Management

### Environment Synchronization

Keep iOS apps and Cloudflare Workers in sync:

```bash
# Check deployment status
npm run ios:status

# Sync iOS configuration with deployed worker
npm run ios:sync:dev      # Development
npm run ios:sync:staging  # Staging
npm run ios:sync:prod     # Production
```

### Configuration Files Generated

Each environment generates:

- **Config.plist**: iOS app runtime configuration
- **EnvironmentConfig.swift**: Swift environment constants
- **{environment}.xcconfig**: Xcode build configuration

Example Config.plist:

```xml
<key>apiBaseURL</key>
<string>https://api.yourdomain.com</string>
<key>webSocketURL</key>
<string>wss://api.yourdomain.com/ws</string>
<key>environment</key>
<string>production</string>
```

## 🌐 Cloudflare Worker Setup

### Environment Variables

Configure in `wrangler.toml`:

```toml
[env.development]
vars = { ENVIRONMENT = "development", ALLOWED_ORIGINS = "http://localhost:5173" }

[env.staging]
vars = { ENVIRONMENT = "staging", ALLOWED_ORIGINS = "https://staging.yourdomain.com" }

[env.production]
vars = { ENVIRONMENT = "production", ALLOWED_ORIGINS = "https://yourdomain.com" }
```

### Worker Deployment

Each app variant can have its own worker or share workers:

```bash
# Deploy shared worker for all apps
wrangler deploy --env production

# Deploy app-specific worker (advanced)
wrangler deploy --env production --name health-caregiver-prod
```

## 📱 iOS App Variants

### Bundle Identifiers

Each app needs unique bundle IDs:

- Main: `com.yourcompany.health`
- Caregiver: `com.yourcompany.health.caregiver`
- Senior: `com.yourcompany.health.senior`
- Clinical: `com.yourcompany.health.clinical`

### Code Signing

Configure different provisioning profiles:

- **Development**: Use development certificates
- **Staging**: Use ad-hoc or enterprise distribution
- **Production**: Use App Store distribution

### Feature Differentiation

Apps can enable/disable features based on variant:

```swift
// In EnvironmentConfig.swift
static let enabledFeatures: [String] = {
    switch variant {
    case "caregiver":
        return ["notifications", "emergency_alerts", "patient_management"]
    case "senior":
        return ["simple_ui", "emergency_alerts", "medication_reminders"]
    case "clinical":
        return ["clinical_data", "compliance", "patient_management"]
    default:
        return ["healthkit", "analytics", "notifications"]
    }
}()
```

## 🔄 Continuous Deployment

### GitHub Actions Integration

Create workflow for automated deployment:

```yaml
name: Deploy iOS Apps
on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloudflare
        run: |
          npm install
          npm run build
          wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-ios:
    runs-on: macos-latest
    needs: deploy-workers
    steps:
      - uses: actions/checkout@v3
      - name: Build iOS Apps
        run: |
          npm run ios:deploy:prod
          # Add Xcode build and upload steps
```

### Automated Testing

Test deployments with the integrated tools:

```bash
# Quick validation
npm run ios:quick

# Full deployment test
npm run ios:full

# Integration status check
npm run ios:status
```

## 📊 Monitoring & Analytics

### Health Checks

Monitor your deployment:

```bash
# Test all endpoints
npm run probe:dev

# Check worker status
curl https://api.yourdomain.com/health

# Monitor WebSocket connectivity
# Use built-in iOS app diagnostics
```

### Error Tracking

- **iOS**: Use built-in crash reporting or services like Crashlytics
- **Cloudflare**: Monitor via Wrangler logs and Analytics dashboard
- **Integration**: Use deployment reports for configuration issues

### Performance Monitoring

- **Edge Performance**: Cloudflare Analytics dashboard
- **iOS Performance**: Xcode Instruments
- **API Response Times**: Worker analytics and logging

## 🔒 Security Considerations

### API Authentication

Each app variant can have different auth requirements:

- Development: No auth or simple tokens
- Staging: Test authentication
- Production: Full OAuth/JWT implementation

### Data Isolation

Ensure apps access appropriate data:

- Use environment-specific KV namespaces
- Implement proper access controls in workers
- Validate app identity via bundle ID

### Certificate Management

- Use different signing certificates per environment
- Rotate secrets regularly
- Store sensitive values in Cloudflare secrets

## 🎯 Best Practices

### Development Workflow

1. **Start Local**: Always test with local worker first
2. **Sync Early**: Keep iOS and worker configs synchronized
3. **Test Integration**: Use status commands to verify connectivity
4. **Deploy Incrementally**: Test staging before production

### Configuration Management

1. **Version Control**: Store configuration templates, not secrets
2. **Environment Parity**: Keep environments as similar as possible
3. **Automated Generation**: Use scripts to generate configurations
4. **Validation**: Always validate before deployment

### Multi-App Strategy

1. **Shared Infrastructure**: Use common workers when possible
2. **Feature Flags**: Enable/disable features per app variant
3. **Coordinated Releases**: Deploy backend first, then iOS apps
4. **Rollback Planning**: Prepare rollback procedures for issues

## 🚨 Troubleshooting

### Common Issues

#### iOS App Can't Connect to Worker

```bash
# Check worker status
npm run ios:status

# Sync configurations
npm run ios:sync

# Validate endpoints in Config.plist
cat ios/HealthKitBridge/Config.plist | grep -A1 apiBaseURL
```

#### Worker Deployment Fails

```bash
# Check authentication
wrangler whoami

# Validate wrangler.toml
wrangler deploy --dry-run

# Check environment configuration
wrangler tail --env production
```

#### Configuration Mismatch

```bash
# Regenerate all configurations
npm run ios:deploy:prod

# Force sync
npm run ios:sync:prod

# Validate integration
npm run multi-app:status
```

### Debug Commands

```bash
# iOS development debugging
npm run ios:quick           # Quick validation
npm run ios:full            # Comprehensive check
npm run ios:fix             # Auto-fix issues

# Deployment debugging
npm run ios:deploy          # Single app deployment
npm run multi-app:status    # Multi-app status
npm run ios:cf-deploy       # Coordinated deployment
```

## 📚 Additional Resources

- **Cloudflare Workers Docs**: [workers.cloudflare.com](https://workers.cloudflare.com)
- **Wrangler CLI**: [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler/)
- **iOS App Distribution**: [developer.apple.com/app-store-connect](https://developer.apple.com/app-store-connect/)
- **Xcode Cloud**: [developer.apple.com/xcode-cloud](https://developer.apple.com/xcode-cloud/)

---

**Next Steps**: Run `npm run multi-app:interactive` to explore the multi-app deployment system!
