# PowerShell to Node.js Conversion - Phase 2

## Overview

This document outlines the second phase of converting PowerShell scripts to Node.js for better cross-platform compatibility and integration with the existing Node.js toolchain.

## Converted Scripts

### High Priority Conversions ✅

| PowerShell Script | Node.js Equivalent | Purpose | Benefits |
|------------------|-------------------|---------|----------|
| `debug-device-auth.ps1` | `scripts/node/dev/debug-device-auth.js` | API endpoint testing | Better JSON handling, cross-platform HTTP |
| `setup-git-hooks.ps1` | `scripts/node/dev/setup-git-hooks.js` | Git hooks configuration | Cross-platform git operations, better error handling |
| `fix-circular-dependencies.ps1` | `scripts/node/analysis/fix-circular-dependencies.js` | Icon import circular dependency fixing | Better async file operations, improved regex handling |
| `setup.ps1` | `scripts/node/dev/setup-project.js` | Project setup and dependency installation | Native npm integration, better error handling |
| `optimize-icons.ps1` | `scripts/node/analysis/optimize-icons.js` | Bundle optimization through icon processing | Integration with build tools, better performance |
| `convert-phosphor-to-lucide.ps1` | `scripts/node/analysis/convert-phosphor-to-lucide.js` | Icon library migration | Comprehensive mapping, better file processing |

## New npm Scripts Added

```json
{
  "setup:project": "node scripts/node/dev/setup-project.js",
  "setup:git-hooks": "node scripts/node/dev/setup-git-hooks.js", 
  "debug:device-auth": "node scripts/node/dev/debug-device-auth.js",
  "fix:circular-deps": "node scripts/node/analysis/fix-circular-dependencies.js",
  "optimize:icons": "node scripts/node/analysis/optimize-icons.js",
  "convert:phosphor-to-lucide": "node scripts/node/analysis/convert-phosphor-to-lucide.js"
}
```

## Script Features

### debug-device-auth.js

- **Enhanced Features**: Verbose mode, better error handling, structured JSON output
- **Usage**: `npm run debug:device-auth -- --verbose --base-url http://localhost:8789`
- **Benefits**: Cross-platform HTTP testing, better JSON processing

### setup-git-hooks.js

- **Enhanced Features**: Force overwrite, dry-run mode, verbose output, multiple hook types
- **Usage**: `npm run setup:git-hooks -- --force --verbose`
- **Hooks Created**: pre-commit, post-push, pre-push with VitalSense-specific checks

### fix-circular-dependencies.js

- **Enhanced Features**: Parallel processing, multiple optimization patterns, detailed reporting
- **Usage**: `npm run fix:circular-deps -- --verbose --dry-run`
- **Capabilities**: Icon import optimization, relative path fixing, tree-shaking improvements

### setup-project.js

- **Enhanced Features**: Package manager detection (npm/yarn/pnpm), selective installation
- **Usage**: `npm run setup:project -- --verbose --skip-server`
- **Benefits**: Native npm integration, better dependency management

### optimize-icons.js

- **Enhanced Features**: Multiple optimization strategies, bundle size estimation, threshold checking
- **Usage**: `npm run optimize:icons -- --dry-run --threshold 10`
- **Optimizations**: Phosphor→Lucide migration, tree-shaking, dynamic loading

### convert-phosphor-to-lucide.js

- **Enhanced Features**: Comprehensive icon mapping (60+ icons), conversion reporting, JSX updates
- **Usage**: `npm run convert:phosphor-to-lucide -- --generate-report --dry-run`
- **Capabilities**: Full Phosphor→Lucide conversion with health-specific mappings

## Remaining PowerShell Scripts

### Keep as PowerShell (PowerShell-specific functionality)

- `PowerShell-Profile.ps1` - PowerShell profile management
- `enhanced-vitalsense-profile.ps1` - Enhanced PowerShell profile
- `fast-vitalsense-profile.ps1` - Fast-loading profile
- `unified-profile-loader.ps1` - Profile loading system
- `quick-profile-test.ps1` - Profile testing
- `setup-vscode-workspace.ps1` - VS Code workspace setup
- `terminal-init.ps1` - Terminal initialization
- `vitalsense-banner.ps1` - PowerShell banner display
- `run-task.ps1` - VS Code task runner integration
- `VSCodeIntegration.psm1` - PowerShell module for VS Code

### Medium Priority (Could be converted)

- `app-store-prep.ps1` - iOS App Store preparation (210 lines, complex automation)
- `quick-deploy-auth0.ps1` - Auth0 deployment (99 lines, API calls)
- `fix-icon-name-mismatches.ps1` - Icon name fixing
- `migrate-ios-hig-icons.ps1` - iOS HIG compliance

## Technical Benefits of Node.js Versions

### Performance Improvements

- **Async File Operations**: Non-blocking file processing
- **Parallel Processing**: Batch processing with concurrency limits
- **Memory Efficiency**: Better memory management for large file operations

### Cross-Platform Compatibility

- **Unified Toolchain**: Consistent behavior across Windows, macOS, Linux
- **Native JSON**: Built-in JSON parsing and manipulation
- **Better HTTP**: Modern HTTP client libraries (axios)

### Integration Benefits

- **npm Scripts**: Direct integration with package.json workflows
- **Build Pipeline**: Seamless integration with existing Node.js build tools
- **Error Handling**: Consistent error handling patterns across all scripts

## Usage Examples

### Quick Setup (New Developer)

```bash
# Complete project setup
npm run setup:project

# Setup git hooks for quality checks
npm run setup:git-hooks --force

# Test API endpoint
npm run debug:device-auth --verbose
```

### Icon Optimization Workflow

```bash
# Check current icon usage
npm run optimize:icons --dry-run --verbose

# Apply optimizations
npm run optimize:icons

# Convert Phosphor to Lucide (if needed)
npm run convert:phosphor-to-lucide --generate-report
```

### Development Workflow

```bash
# Fix any circular dependencies
npm run fix:circular-deps --dry-run

# Apply fixes
npm run fix:circular-deps
```

## Migration Status

- ✅ **Phase 1 Complete**: Major script migration (47 scripts → archive)
- ✅ **Phase 2 Complete**: High-priority PowerShell → Node.js conversion (6 scripts)
- 🔄 **Phase 3 Pending**: Medium-priority conversions (iOS-specific scripts)

## Next Steps

1. **Test New Scripts**: Validate all converted scripts in development workflow
2. **Update Documentation**: Update developer onboarding docs with new npm scripts
3. **VS Code Tasks**: Add VS Code tasks for new Node.js scripts
4. **Consider iOS Scripts**: Evaluate whether iOS-specific PowerShell scripts need conversion

## Dependencies Added

The converted scripts use standard Node.js packages:

- `commander` - Command-line argument parsing
- `axios` - HTTP client (for API testing)
- `glob` - File pattern matching
- Built-in Node.js modules: `fs/promises`, `path`, `child_process`

All dependencies are already present in the project's package.json.
