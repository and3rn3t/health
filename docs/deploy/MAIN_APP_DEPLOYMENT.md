# 🎯 Main Health App Deployment Guide

Simple deployment workflow for your health iOS app with Cloudflare Workers integration.

## 🚀 Quick Start

### Development Environment

```bash
# 1. Start Cloudflare Worker locally
npm run cf:dev

# 2. Configure iOS app for development
npm run app:deploy:dev

# 3. Open iOS project and build
open ios/HealthKitBridge.xcodeproj
```

### Production Environment

```bash
# 1. Deploy Cloudflare Worker
wrangler deploy --env production

# 2. Configure iOS app for production
npm run app:deploy:prod

# 3. Build and submit via Xcode
# Use Xcode: Product > Archive > Distribute App
```

## 📋 Available Commands

### Deployment Commands

- `npm run app:deploy` - Deploy with default environment (development)
- `npm run app:deploy:dev` - Configure for development environment
- `npm run app:deploy:staging` - Configure for staging environment
- `npm run app:deploy:prod` - Configure for production environment

### Status & Validation

- `npm run app:status` - Show detailed deployment status
- `npm run app:quick` - Quick health check
- `npm run app:sync` - Update iOS configuration only

### iOS Development Tools

- `npm run ios:quick` - Quick iOS project validation
- `npm run ios:full` - Comprehensive iOS project check
- `npm run ios:fix` - Auto-fix common iOS issues
- `npm run ios:ready` - Prepare iOS project for build

## 🔧 What Each Environment Configures

### Development

- **API**: `http://127.0.0.1:8789` (local worker)
- **WebSocket**: `ws://localhost:3001` (local WebSocket server)
- **Purpose**: Local development with hot reload

### Staging

- **API**: `https://staging-api.andernet.dev`
- **WebSocket**: `wss://staging-api.andernet.dev/ws`
- **Purpose**: Testing before production release

### Production

- **API**: `https://api.andernet.dev`
- **WebSocket**: `wss://api.andernet.dev/ws`
- **Purpose**: Live app for users

## 📱 iOS Configuration Files

The deployment automatically updates:

### Config.plist

Runtime configuration for your iOS app:

```xml
<key>apiBaseURL</key>
<string>https://api.andernet.dev</string>
<key>webSocketURL</key>
<string>wss://api.andernet.dev/ws</string>
<key>environment</key>
<string>production</string>
```

## 🔍 VS Code Integration

Available tasks via **Terminal > Run Task**:

- **App: Deploy Development** - Configure for local development
- **App: Deploy Production** - Configure for production
- **App: Status Check** - Show deployment status
- **App: Quick Check** - Fast validation

## 🎯 Typical Workflow

### Daily Development

1. `npm run cf:dev` - Start local Cloudflare Worker
2. `npm run app:quick` - Quick check everything is ready
3. Open Xcode and start coding

### Preparing for Release

1. `npm run ios:full` - Comprehensive validation
2. `npm run ios:fix` - Auto-fix any issues found
3. `wrangler deploy --env production` - Deploy backend
4. `npm run app:deploy:prod` - Configure iOS for production
5. Build and submit via Xcode

### Troubleshooting

1. `npm run app:status` - Check what's wrong
2. `npm run app:sync` - Fix configuration issues
3. `npm run ios:fix` - Fix iOS project issues

## 🌐 Cloudflare Worker Integration

Your iOS app automatically connects to the right Cloudflare Worker based on environment:

- **Local Development**: Worker runs on your machine at `127.0.0.1:8789`
- **Staging**: Worker deployed to Cloudflare edge at staging domain
- **Production**: Worker deployed to Cloudflare edge at production domain

The deployment tool ensures your iOS app configuration always matches your deployed worker environment.

## 🔧 Manual Configuration

If you need to manually check or update the iOS configuration:

1. Open `ios/HealthKitBridge/Config.plist`
2. Update the `apiBaseURL` and `webSocketURL` values
3. Rebuild your iOS app

Or use the sync command: `npm run app:sync`

## 💡 Tips

- **Always deploy the worker first**, then configure iOS
- **Use staging environment** for testing before production
- **Run quick checks** regularly during development
- **Check status** if something isn't working
- **The tools are idempotent** - safe to run multiple times

---

**Need help?** Run `npm run app:status` to see the current state of your deployment.
