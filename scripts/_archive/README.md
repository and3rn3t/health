# Scripts Archive

This directory contains legacy PowerShell scripts that have been replaced by modern Node.js equivalents.

## Migration Summary

As of September 27, 2025, the VitalSense project has migrated from a dual PowerShell/Node.js script architecture to a primarily Node.js-based system for better cross-platform compatibility and maintainability.

## What Was Archived

The `legacy-powershell/` directory contains PowerShell scripts that were replaced by Node.js versions:

### Testing Scripts

- `probe.ps1` → `../node/health/probe.js`
- `simple-probe.ps1` → `../node/health/simple-probe.js`
- `test-*.ps1` → `../node/test/*.js`

### Deployment Scripts

- `deploy-*.ps1` → `../node/deploy/*.js`
- `dns-setup.ps1` → `../node/deploy/dns-setup.js`
- `setup-production-*.ps1` → `../node/infrastructure/*.js`

### Branding & Verification Scripts

- `verify-*.ps1` → `../node/branding/*.js`
- `find-*.ps1` → `../node/branding/*.js`

### Development Scripts

- Various development utilities replaced by Node.js equivalents

## What Was Kept

These PowerShell scripts remain active for Windows-specific functionality:

- `VSCodeIntegration.psm1` - Core PowerShell utilities module
- `setup-vscode-workspace.ps1` - VS Code workspace configuration
- `PowerShell-Profile.ps1` - Development profile setup
- `terminal-init.ps1` - Terminal initialization

## Using Node.js Scripts

All modern development workflows should use Node.js scripts:

```bash
# Health checking
npm run probe:simple
npm run probe:dev:nodejs

# Testing
npm run verify:branding
npm run test:e2e

# Deployment
npm run deploy:dev
npm run platform:deploy

# Development
npm run dev
npm run build
```

## VS Code Integration

VS Code tasks have been updated to use Node.js scripts primarily. Use `Ctrl+Shift+P` → "Tasks: Run Task" to access:

- 🚀 Node.js Development Workflow
- ⚡ Quick Health Check
- 🧪 Full Test Suite
- 💎 VitalSense Deploy

## Migration Benefits

1. **Cross-platform compatibility** - Works on Windows, macOS, Linux
2. **Better performance** - Faster execution and startup times
3. **Enhanced error handling** - More robust error reporting
4. **Consistent tooling** - Aligned with modern JavaScript ecosystem
5. **Reduced maintenance** - Single codebase instead of dual implementations

## Need PowerShell?

If you need to run legacy PowerShell scripts from this archive:

```powershell
# Run from scripts root directory
pwsh -NoProfile -File _archive/legacy-powershell/script-name.ps1
```

**Note:** Archived scripts may not work with current project structure changes.
