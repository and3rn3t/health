# 🔧 VitalSense Development Setup Guide

Complete guide for setting up your VitalSense development environment across all platforms.

## 📋 Prerequisites

### Required Software

- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **VS Code**: [Download from code.visualstudio.com](https://code.visualstudio.com/)
- **PowerShell 7** (Windows): [Install from Microsoft Store](https://aka.ms/PowerShell)

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```bash
# Core extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.powershell

# Additional helpful extensions
code --install-extension GitHub.copilot
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-json
```

## 🚀 Platform-Specific Setup

### Web Development Setup

1. **Clone Repository**

   ```bash
   git clone https://github.com/and3rn3t/health.git
   cd health
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   # Copy example environment file
   cp .env.example .env.local

   # Edit with your configuration
   # Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, etc.
   ```

4. **Start Development Servers**

   ```bash
   # Primary development server
   npm run dev

   # API server (in separate terminal)
   npm run api:dev

   # WebSocket server (in separate terminal)
   npm run ws:dev
   ```

### iOS Development Setup (Windows)

1. **Install iOS Development Tools**

   ```powershell
   # Run the iOS setup script
   .\ios\scripts\setup-ios-dev-windows.ps1 -All
   ```

2. **Configure Xcode Project**

   ```bash
   cd ios
   # Open the project
   open HealthKitBridge.xcodeproj
   ```

3. **Setup Device Testing**
   - Connect iOS device via USB
   - Enable Developer Mode in iOS Settings
   - Trust your development certificate

For detailed iOS setup, see [iOS Development Guide](../ios/IOS_DEVELOPMENT_WINDOWS.md).

## 🔐 Authentication Setup

### Auth0 Configuration

1. **Create Auth0 Account**: [auth0.com](https://auth0.com)

2. **Configure Application**
   - Application Type: Single Page Application
   - Allowed Callback URLs: `http://localhost:5173/callback`
   - Allowed Logout URLs: `http://localhost:5173`

3. **Deploy Custom Login Page**

   ```powershell
   # Test deployment
   .\scripts\quick-deploy-auth0.ps1 -TestMode

   # Deploy to production
   .\scripts\quick-deploy-auth0.ps1
   ```

For complete Auth0 setup, see [Auth0 Integration Guide](../auth/AUTH0_CUSTOM_BRANDING_GUIDE.md).

## 🏗️ Development Workflow

### VS Code Tasks

Use these tasks for common development operations:

- **🚀 Node.js Development Workflow**: Start complete development environment
- **⚡ Quick Health Check**: Validate development environment
- **🧪 Full Test Suite**: Run comprehensive testing
- **🔧 Fix All Issues**: Auto-fix linting and formatting issues

Access via `Ctrl+Shift+P` → "Tasks: Run Task"

### Command Line Workflow

```bash
# Development
npm run dev              # Start web development server
npm run build           # Build for production
npm run test            # Run test suite

# API Development
npm run api:dev         # Start API server
npm run api:build       # Build API for deployment

# iOS Development
npm run ios:build       # Build iOS app
npm run ios:test        # Run iOS tests
```

## 🔧 Configuration Files

### Key Configuration Files

- **`package.json`**: Node.js dependencies and scripts
- **`vite.config.ts`**: Web app build configuration
- **`wrangler.toml`**: Cloudflare Worker configuration
- **`tsconfig.json`**: TypeScript configuration
- **`.vscode/tasks.json`**: VS Code task definitions

### Environment Variables

Create `.env.local` with:

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id

# API Configuration
VITE_API_BASE_URL=http://localhost:8787

# Development Settings
NODE_ENV=development
```

## 🧪 Testing Setup

### Web Application Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Health check all endpoints
npm run test:api
```

### iOS Testing

```bash
# Unit tests
npm run ios:test

# UI tests
npm run ios:test:ui

# Device testing
npm run ios:test:device
```

## 🚀 Deployment Setup

### Development Deployment

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy with health checks
npm run deploy:dev:safe
```

### Production Deployment

```bash
# Deploy to production
npm run deploy:prod

# Deploy with full validation
npm run deploy:prod:safe
```

For complete deployment setup, see [Deployment Guide](../deploy/MAIN_APP_DEPLOYMENT.md).

## 🆘 Troubleshooting

### Common Issues

1. **Port Conflicts**: Use `Kill-Port 5173` (Windows) or `lsof -ti:5173 | xargs kill` (macOS/Linux)
2. **Permission Errors**: Run PowerShell as Administrator (Windows)
3. **Node Version**: Use `nvm use 18` to switch Node.js versions
4. **Build Errors**: Clear cache with `npm run clean`

### Getting Help

- **Build Issues**: [Build Troubleshooting Guide](../troubleshooting/BUILD_TROUBLESHOOTING.md)
- **Branding Issues**: [VitalSense Branding Quick Reference](../troubleshooting/VITALSENSE_BRANDING_QUICK_REFERENCE.md)
- **All Problems**: [Problem Solutions Database](../troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md)

## 🎯 Next Steps

After setup, explore:

1. **Web Development**: [Architecture Documentation](../architecture/)
2. **iOS Development**: [iOS Development Guide](../ios/)
3. **API Development**: [API Documentation](../architecture/API.md)
4. **Deployment**: [Deployment Workflow](../deploy/)

---

**Setup Time**: 30-45 minutes for complete environment  
**Support**: Available in [Troubleshooting Documentation](../troubleshooting/)
