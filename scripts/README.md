# VitalSense Scripts - Functional Organization

This directory contains all scripts for the VitalSense Health Monitoring Platform, organized by **function** rather than programming language.

## Directory Structure

```
scripts/
├── development/          # Development setup, debugging, git hooks
├── testing/             # Health checks, endpoint testing, integration tests
├── analysis/           # Performance monitoring, bundle analysis, optimization
├── deployment/         # Infrastructure deployment, Auth0, DNS setup
├── branding/           # VitalSense branding, icon optimization, consistency
├── ios/                # iOS-specific development and App Store preparation
├── powershell-tools/   # PowerShell profiles and VS Code integration
├── ci/                 # CI/CD specific scripts
├── build/              # Build utilities and configuration
└── _archive/           # Legacy scripts and migration artifacts
```

## Functional Categories

### 🛠️ Development (`development/`)

**Purpose**: Development environment setup, debugging, and git workflow management

**Key Scripts**:

- `setup-project.js` - Complete project setup with package manager detection
- `setup-git-hooks.js` - Git hooks with VitalSense-specific checks
- `debug-device-auth.js` - API endpoint testing and debugging
- `lint-runner.js` - TypeScript and Swift linting
- `start-dev.js` - Development server startup
- `task-runner.js` - VS Code task execution
- `onboarding-wizard.js` - Interactive setup for new developers

**npm Scripts**:

```bash
npm run setup:project          # Complete project setup
npm run setup:git-hooks        # Install git hooks
npm run debug:device-auth       # Debug API endpoints
npm run start:dev              # Start development workflow
```

### 🧪 Testing (`testing/`)

**Purpose**: Health monitoring, endpoint validation, and integration testing

**Key Scripts**:

- `test-runner.js` - Comprehensive test suite coordination
- `test-integration.js` - Full system integration testing
- `test-all-endpoints.js` - API endpoint validation
- `simple-probe.js` - Quick health checks
- `probe.js` - Enhanced health monitoring with verbose output
- `app-status-check.js` - VitalSense app status verification

**npm Scripts**:

```bash
npm run test:quick             # Quick health check
npm run test:full              # Comprehensive test suite
npm run probe                  # Enhanced health probe
```

### 📊 Analysis (`analysis/`)

**Purpose**: Performance monitoring, bundle optimization, and code analysis

**Key Scripts**:

- `bundle-analyzer.js` - Comprehensive bundle analysis
- `performance-monitor.js` - Real-time performance tracking
- `css-optimizer.js` - CSS bundle optimization
- `quick-bundle-check.js` - Fast bundle size analysis
- `config-validator.js` - Configuration validation
- `perf-slo-sampler.js` - SLO performance sampling

**npm Scripts**:

```bash
npm run analyze:bundle         # Bundle analysis
npm run perf:monitor          # Performance monitoring
npm run analyze:quick         # Quick analysis
```

### 🚀 Deployment (`deployment/`)

**Purpose**: Infrastructure deployment, Auth0 setup, and production releases

**Key Scripts**:

- `platform-deploy.js` - Full platform deployment
- `setup-production-infrastructure.js` - Production infrastructure setup
- `auth0-setup.js` - Auth0 authentication configuration
- `dns-setup.js` - DNS and domain configuration
- `vitalsense-deploy.js` - VitalSense-specific deployment
- `cloudflare-purge-cache.js` - Cache management

**npm Scripts**:

```bash
npm run deploy:dry             # Dry run deployment
npm run deploy:production      # Production deployment
npm run setup:infrastructure   # Infrastructure setup
```

### 🎨 Branding (`branding/`)

**Purpose**: VitalSense branding consistency, icon optimization, and visual identity

**Key Scripts**:

- `branding-audit.js` - Comprehensive branding verification
- `optimize-icons.js` - Icon bundle optimization
- `convert-phosphor-to-lucide.js` - Icon library migration
- `fix-circular-dependencies.js` - Icon import optimization
- `verify-production-branding.js` - Production branding checks

**npm Scripts**:

```bash
npm run branding:audit         # Branding consistency check
npm run optimize:icons         # Icon optimization
npm run convert:phosphor-to-lucide  # Icon migration
```

### 📱 iOS (`ios/`)

**Purpose**: iOS development, App Store preparation, and platform-specific tools

**Key Scripts**:

- `app-store-prep.ps1` - App Store submission preparation (PowerShell)

**Integration**: Works with iOS project scripts in `ios/scripts/`

### 🔧 PowerShell Tools (`powershell-tools/`)

**Purpose**: PowerShell profiles, VS Code integration, and Windows-specific tooling

**Key Scripts**:

- `PowerShell-Profile.ps1` - Main PowerShell profile
- `enhanced-vitalsense-profile.ps1` - Enhanced development profile
- `VSCodeIntegration.psm1` - VS Code integration module
- `run-task.ps1` - VS Code task runner
- `setup-vscode-workspace.ps1` - VS Code workspace setup

**Usage**: Load via PowerShell profile or direct execution

## Migration Benefits

### ✅ Improved Organization

- **Functional Grouping**: Scripts organized by purpose, not language
- **Clear Responsibility**: Each directory has a specific function
- **Better Discoverability**: Easier to find the right script for the task

### ✅ Cross-Platform Consistency

- **Node.js First**: Primary scripts use Node.js for cross-platform compatibility
- **PowerShell When Needed**: PowerShell scripts only for Windows-specific tasks
- **Unified npm Scripts**: Consistent command-line interface

### ✅ Enhanced Maintainability

- **Logical Structure**: Related functionality grouped together
- **Clear Dependencies**: Easy to understand script relationships
- **Documentation**: Each directory has clear purpose and usage

## Quick Reference

### New Developers

```bash
# Start development server
npm run dev

# Health check
npm run probe:simple

# Run tests
npm run test:e2e

# Build for production
npm run build
```

### Using Node.js Scripts Directly

```bash
# Health checking
node scripts/node/health/simple-probe.js --port 8787
node scripts/node/health/probe.js --verbose

# Testing
node scripts/node/test/test-all-endpoints.js --verbose
node scripts/node/test/test-integration.js

# Deployment
node scripts/node/deploy/platform-deploy.js --dry-run
node scripts/node/infrastructure/setup-production-infrastructure.js

# Branding verification
node scripts/node/branding/verify-production-branding.js
node scripts/node/branding/branding-audit.js
```

### VS Code Integration

Use `Ctrl+Shift+P` → "Tasks: Run Task" for common workflows:

- **🚀 Node.js Development Workflow** - Start dev server with pre-checks
- **⚡ Quick Health Check** - Fast environment validation
- **🧪 Full Test Suite** - Comprehensive testing
- **💎 VitalSense Deploy** - Branding verification and deployment
- **🔧 Fix All Issues** - Auto-fix linting issues

## Script Categories

### 1. Development (`node/dev/`)

- `start-dev.js` - Development server with pre-checks
- `task-runner.js` - Unified task execution
- `lint-runner.js` - Code quality enforcement
- `onboarding-wizard.js` - New developer setup

### 2. Testing (`node/test/`)

- `test-all-endpoints.js` - Comprehensive API testing
- `test-integration.js` - System integration tests
- `test-enhanced-health-processing.js` - Health data validation
- `test-websocket-connection.js` - WebSocket connectivity

### 3. Deployment (`node/deploy/` & `node/infrastructure/`)

- `platform-deploy.js` - Multi-phase platform deployment
- `dns-setup.js` - DNS configuration automation
- `setup-production-infrastructure.js` - Production environment setup

### 4. Health Monitoring (`node/health/`)

- `simple-probe.js` - Basic endpoint health check
- `probe.js` - Comprehensive health analysis
- `app-status-check.js` - Application status verification

### 5. Branding & Verification (`node/branding/`)

- `verify-production-branding.js` - Production branding validation
- `branding-audit.js` - Comprehensive brand consistency check
- `find-worker-url.js` - Worker URL discovery

### 6. Analysis (`node/analysis/`)

- `bundle-analyzer.js` - Bundle size and composition analysis
- `quick-bundle-check.js` - Fast bundle validation
- `css-optimizer.js` - CSS optimization and analysis

### 7. Build (`build/`)

- `build.js` - Main application build
- `build-worker.js` - Cloudflare Worker build
- `dev-esbuild.js` - Development build with esbuild
- `generate-pwa-icons.js` - PWA icon generation

### 8. PowerShell Utilities (`powershell/`)

Windows-specific scripts for advanced development features:

- `VSCodeIntegration.psm1` - Core PowerShell utilities module
- `setup-vscode-workspace.ps1` - VS Code workspace configuration
- `PowerShell-Profile.ps1` - Enhanced development profile
- `terminal-init.ps1` - Terminal initialization

## Migration Information

**Legacy PowerShell scripts** have been moved to `_archive/legacy-powershell/`.

**Benefits of Node.js migration:**

- ✅ Cross-platform compatibility (Windows, macOS, Linux)
- ✅ Better performance and faster startup
- ✅ Enhanced error handling and reporting
- ✅ Consistent with modern JavaScript ecosystem
- ✅ Single codebase instead of dual PowerShell/Node.js

## Common Patterns

### Running Scripts with Arguments

```bash
# With npm scripts (recommended)
npm run probe:dev:nodejs -- --verbose --port 8789

# Direct execution
node scripts/node/health/probe.js --verbose --port 8789

# With environment variables
NODE_ENV=development node scripts/node/dev/start-dev.js
```

### Error Handling

All Node.js scripts include:

- Structured error messages
- Exit codes for CI/CD integration
- Verbose mode for debugging
- JSON output for automation

### VS Code Tasks

Scripts are integrated with VS Code tasks for one-click execution. Tasks include:

- Progress indicators
- Background process management
- Dependency chains
- Error reporting

## Environment Variables

Key environment variables used by scripts:

```bash
NODE_ENV=development|production    # Environment mode
PORT=8787                         # Default development port
VERBOSE=true                      # Enable verbose logging
DRY_RUN=true                     # Preview mode for deployment scripts
```

## Contributing

When adding new scripts:

1. **Use Node.js** for new functionality (not PowerShell)
2. **Follow the existing structure** - place in appropriate `node/` subdirectory
3. **Include error handling** - proper exit codes and error messages
4. **Add VS Code task** if it's a common workflow
5. **Update package.json** with npm script shortcuts
6. **Document in this README**

## Support

For issues with scripts:

1. Check `_archive/README.md` for migration notes
2. Use `--verbose` flag for detailed output
3. Check VS Code tasks for common workflows
4. Refer to `docs/develop/POWERSHELL_VSCODE_INTEGRATION.md` for PowerShell-specific help
