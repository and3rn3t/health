# 🔧 VitalSense Development Setup Guide

Complete guide for setting up your VitalSense development environment across all platforms.

## 📋 Prerequisites

### Required Software

- **Node.js 22.21.1+**: [Download from nodejs.org](https://nodejs.org/) (enforced by `engines` in `package.json`)
- **pnpm 10.16+**: [Install via Corepack](https://pnpm.io/installation) (`corepack enable && corepack prepare`)
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **VS Code**: [Download from code.visualstudio.com](https://code.visualstudio.com/)

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
   pnpm install
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
   pnpm dev

   # Cloudflare Worker (in separate terminal)
   pnpm cf:dev
   ```

### iOS Development Setup

1. **Prerequisites**: macOS with Xcode 26.2 installed (see `ios/.xcode-version`)

2. **Open Xcode Project**

   ```bash
   # From repo root
   pnpm ios:open
   # Or manually:
   open ios/Andernet-Posture/Andernet\ Posture.xcodeproj
   ```

3. **Setup Device Testing**
   - Connect iOS device via USB
   - Enable Developer Mode in iOS Settings
   - Trust your development certificate

For detailed iOS setup, see the [iOS docs](../../ios/docs/INDEX.md).

## 🔐 Authentication Setup

### Auth0 Configuration

1. **Create Auth0 Account**: [auth0.com](https://auth0.com)

2. **Configure Application**
   - Application Type: Single Page Application
   - Allowed Callback URLs: `http://localhost:5173/callback`
   - Allowed Logout URLs: `http://localhost:5173`

3. **Set Secrets via Wrangler**

   ```bash
   wrangler secret put AUTH0_CLIENT_SECRET
   wrangler secret put DEVICE_JWT_SECRET
   ```

Auth0 configuration is documented in the [Security Baseline](../security/SECURITY_BASELINE.md) and [Architecture](../architecture/ARCHITECTURE.md) guides.

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
pnpm dev              # Start web development server
pnpm build            # Build for production
pnpm test             # Run test suite

# Worker Development
pnpm cf:dev           # Start Cloudflare Worker locally
pnpm build:worker     # Build Worker for deployment
pnpm deploy:prod      # Deploy to production
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

## Testing Setup

### Web Application Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### iOS Testing

```bash
# From ios/ directory
make test              # Unit tests
make lint              # SwiftLint
```

## Deployment Setup

### Development Deployment

```bash
pnpm cf:deploy
```

### Production Deployment

```bash
pnpm deploy:prod
```

For complete deployment setup, see [Deployment Guide](../deploy/README.md).

## 🆘 Troubleshooting

### Common Issues

1. **Port Conflicts**: Use `Kill-Port 5173` (Windows) or `lsof -ti:5173 | xargs kill` (macOS/Linux)
2. **Permission Errors**: Run PowerShell as Administrator (Windows)
3. **Node Version**: Use `nvm use 18` to switch Node.js versions
4. **Build Errors**: Clear cache with `pnpm clean`

### Getting Help

- **Common Issues**: [Troubleshooting](../TROUBLESHOOTING.md)
- **Full Docs**: [Documentation Index](../DOCUMENTATION_INDEX.md)

## 🎯 Next Steps

After setup, explore:

1. **Web Development**: [Architecture Documentation](../architecture/)
2. **iOS Development**: [iOS Docs](../../ios/docs/INDEX.md)
3. **API Development**: [API Documentation](../architecture/API.md)
4. **Deployment**: [Deployment Workflow](../deploy/)

---

**Support**: [Troubleshooting](../TROUBLESHOOTING.md)
