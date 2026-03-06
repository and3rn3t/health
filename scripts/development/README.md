# Development Scripts

This directory contains scripts for development environment setup, debugging, and git workflow management.

## Scripts Overview

### Setup & Configuration

- **`setup-project.js`** - Complete project setup with package manager detection
- **`setup-git-hooks.js`** - Install git hooks with VitalSense-specific checks
- **`onboarding-wizard.js`** - Interactive setup guide for new developers

### Development Workflow

- **`start-dev.js`** - Development server startup and workflow
- **`task-runner.js`** - VS Code task execution and management
- **`lint-runner.js`** - TypeScript and Swift linting

### Debugging & Testing

- **`debug-device-auth.js`** - API endpoint testing and debugging
- **`pwsh-env-check.js`** - PowerShell environment validation

### Git Management

- **`install-git-hook.js`** - Individual git hook installation
- **`remove-git-hook.js`** - Git hook removal
- **`install-precommit-guard.js`** - Pre-commit guard installation

### Legacy Scripts

- **`setup-git-hooks.ps1`** - PowerShell version of git hooks setup
- **`setup.ps1`** - PowerShell project setup script
- **`debug-device-auth.ps1`** - PowerShell API debugging script

## Usage Examples

```bash
# New project setup
npm run setup:project

# Install git hooks with VitalSense checks
npm run setup:git-hooks

# Start development workflow
npm run start:dev

# Debug API endpoints
npm run debug:device-auth --verbose

# Run TypeScript linting
npm run lint:ts
```

## Key Features

- **Cross-platform compatibility** - Node.js scripts work on all platforms
- **Interactive setup** - Onboarding wizard for new developers
- **Git integration** - Hooks with VitalSense-specific quality checks
- **Development server management** - Automated startup and configuration
- **Comprehensive linting** - TypeScript and Swift code quality checks
