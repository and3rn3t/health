# VitalSense Health App - Complete Documentation Index

This document provides a comprehensive index of all documentation in the project, organized by category.

## 📚 Main Documentation Directories

### Core Architecture & Design

- [`architecture/`](./architecture/) - System architecture, API specs, and design documents
  - [`API.md`](./architecture/API.md) - Complete API documentation
  - [`ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) - System architecture overview
  - [`PRD.md`](./architecture/PRD.md) - Product Requirements Document
  - [`WEBSOCKETS.md`](./architecture/WEBSOCKETS.md) - WebSocket protocol specification

### Development

- [`development/`](./development/) - Development guides and workflows
  - [`endpoint-test-plan.md`](./development/endpoint-test-plan.md) - API endpoint testing plan
  - [`POWERSHELL_VSCODE_INTEGRATION.md`](./development/POWERSHELL_VSCODE_INTEGRATION.md) - PowerShell-VS Code integration
  - [`SETUP_GUIDE.md`](./development/SETUP_GUIDE.md) - Development environment setup

### iOS Development

- [`ios/`](./ios/) - iOS-specific documentation
  - [`IOS_DEVELOPMENT_WINDOWS.md`](./ios/IOS_DEVELOPMENT_WINDOWS.md) - iOS development on Windows
  - [`IOS_TESTING_CONFIG.md`](./ios/IOS_TESTING_CONFIG.md) - iOS testing configuration
  - [`IOS_PRODUCTION_CONFIG_COMPLETE.md`](./ios/IOS_PRODUCTION_CONFIG_COMPLETE.md) - Production configuration
  - [`IOS_INTEGRATION_TEST_RESULTS.md`](./ios/IOS_INTEGRATION_TEST_RESULTS.md) - Integration test results

- [`ios-documentation/`](./ios-documentation/) - Detailed iOS project documentation (moved from ios/Documentation/)
  - [`BUNDLE_ID_UPDATE.md`](./ios-documentation/BUNDLE_ID_UPDATE.md) - Bundle ID update guide
  - [`CHANGELOG.md`](./ios-documentation/CHANGELOG.md) - iOS project changelog
  - [`DEVELOPMENT_GUIDE.md`](./ios-documentation/DEVELOPMENT_GUIDE.md) - Comprehensive development guide
  - [`DOCKER_USAGE.md`](./ios-documentation/DOCKER_USAGE.md) - Docker usage for iOS development
  - [`INTEGRATION_STATUS.md`](./ios-documentation/INTEGRATION_STATUS.md) - Integration status tracking
  - [`MIGRATION_GUIDE.md`](./ios-documentation/MIGRATION_GUIDE.md) - Migration guide for updates
  - [`ORGANIZATION_SUMMARY.md`](./ios-documentation/ORGANIZATION_SUMMARY.md) - Project organization
  - [`PROJECT_STRUCTURE.md`](./ios-documentation/PROJECT_STRUCTURE.md) - iOS project structure
  - [`REBRANDING_SUMMARY.md`](./ios-documentation/REBRANDING_SUMMARY.md) - VitalSense rebranding summary
  - [`WATCH_DEVELOPMENT_PLAN.md`](./ios-documentation/WATCH_DEVELOPMENT_PLAN.md) - Apple Watch development plan
  - [`WATCH_INTEGRATION_GUIDE.md`](./ios-documentation/WATCH_INTEGRATION_GUIDE.md) - Watch integration guide

### Deployment & Infrastructure

- [`deployment/`](./deployment/) - Deployment guides and infrastructure setup
  - [`API_SUBDOMAIN_STRATEGY.md`](./deployment/API_SUBDOMAIN_STRATEGY.md) - API subdomain strategy
  - [`CLOUDFLARE_DNS_SETUP.md`](./deployment/CLOUDFLARE_DNS_SETUP.md) - Cloudflare DNS configuration
  - [`DEPLOYMENT_COMPLETE.txt`](./deployment/DEPLOYMENT_COMPLETE.txt) - Deployment completion status
  - [`DEPLOYMENT_PREP_CHECKLIST.md`](./deployment/DEPLOYMENT_PREP_CHECKLIST.md) - Pre-deployment checklist
  - [`DEPLOYMENT_SUCCESS.md`](./deployment/DEPLOYMENT_SUCCESS.md) - Successful deployment guide
  - [`DNS_AUTOMATION_GUIDE.md`](./deployment/DNS_AUTOMATION_GUIDE.md) - DNS automation

### Authentication

- [`authentication/`](./authentication/) - Authentication and authorization documentation
  - [`AUTH0_CUSTOM_BRANDING_GUIDE.md`](./authentication/AUTH0_CUSTOM_BRANDING_GUIDE.md) - Auth0 custom branding

- [`auth0-custom-login/`](./auth0-custom-login/) - Auth0 custom login implementation (moved from root)
  - [`IMPLEMENTATION_SUMMARY.md`](./auth0-custom-login/IMPLEMENTATION_SUMMARY.md) - Implementation summary
  - [`README.md`](./auth0-custom-login/README.md) - Auth0 custom login setup
  - [`TROUBLESHOOTING.md`](./auth0-custom-login/TROUBLESHOOTING.md) - Auth0 troubleshooting

### Security

- [`security/`](./security/) - Security documentation and policies
  - [`AUTH0_INTEGRATION.md`](./security/AUTH0_INTEGRATION.md) - Auth0 security integration
  - [`RETENTION_POLICY.md`](./security/RETENTION_POLICY.md) - Data retention policy
  - [`SECURITY_BASELINE.md`](./security/SECURITY_BASELINE.md) - Security baseline requirements

### Troubleshooting

- [`troubleshooting/`](./troubleshooting/) - Troubleshooting guides and solutions
  - [`BUILD_TROUBLESHOOTING.md`](./troubleshooting/BUILD_TROUBLESHOOTING.md) - Build troubleshooting
  - [`PROBLEM_SOLUTIONS_DATABASE.md`](./troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md) - Comprehensive problem database

### Project Management

- [`project-management/`](./project-management/) - Project management and planning
  - [`IMPLEMENTATION_CHECKLIST.md`](./project-management/IMPLEMENTATION_CHECKLIST.md) - Implementation checklist
  - [`LESSONS_LEARNED.md`](./project-management/LESSONS_LEARNED.md) - Project lessons learned
  - [`NEXT_STEPS.md`](./project-management/NEXT_STEPS.md) - Next development steps
  - [`PROJECT_CLEANUP_SUMMARY.md`](./project-management/PROJECT_CLEANUP_SUMMARY.md) - Project cleanup summary

### Getting Started

- [`getting-started/`](./getting-started/) - Quick start guides
  - [`README_QUICK_START.md`](./getting-started/README_QUICK_START.md) - Quick start guide
  - [`SETUP_GUIDE.md`](./getting-started/SETUP_GUIDE.md) - Detailed setup guide

## 📄 Root-Level Documentation (Consolidated)

The following documents were moved from the project root to [`root-docs/`](./root-docs/) for better organization:

### Project Status & Deployment

- [`DEPLOYMENT_STATUS.md`](./root-docs/DEPLOYMENT_STATUS.md) - Current deployment status
- [`iOS-PRODUCTION-READY.md`](./root-docs/iOS-PRODUCTION-READY.md) - iOS production readiness
- [`iOS-WEBSOCKET-TESTING.md`](./root-docs/iOS-WEBSOCKET-TESTING.md) - iOS WebSocket testing
- [`WEBSOCKET-DEPLOYMENT.md`](./root-docs/WEBSOCKET-DEPLOYMENT.md) - WebSocket deployment guide
- [`WHATS_NEXT_ROADMAP.md`](./root-docs/WHATS_NEXT_ROADMAP.md) - Project roadmap

### Authentication & Setup

- [`AUTH0_SETUP_STATUS.md`](./root-docs/AUTH0_SETUP_STATUS.md) - Auth0 setup status
- [`AUTH0-LOGIN-FIXED.md`](./root-docs/AUTH0-LOGIN-FIXED.md) - Auth0 login fixes
- [`auth0-setup-guide.md`](./root-docs/auth0-setup-guide.md) - Auth0 setup guide

### Project Policies

- [`CONTRIBUTING.md`](./root-docs/CONTRIBUTING.md) - Contribution guidelines
- [`SECURITY.md`](./root-docs/SECURITY.md) - Security policy
- [`privacy-policy.md`](./root-docs/privacy-policy.md) - Privacy policy
- [`terms-of-service.md`](./root-docs/terms-of-service.md) - Terms of service

## 📄 Source Code Documentation (Consolidated)

Documentation that was previously in the source code has been moved to [`src-docs/`](./src-docs/):

- [`prd.md`](./src-docs/prd.md) - Product Requirements Document (alternative version)
- [`Phase5-Progress.md`](./src-docs/Phase5-Progress.md) - Phase 5 development progress
- [`AppleWatchHealthKitIntegration.md`](./src-docs/AppleWatchHealthKitIntegration.md) - Apple Watch integration

## 📄 Additional Documentation

### Branding & Features

- [`VITALSENSE_BRANDING.md`](./VITALSENSE_BRANDING.md) - VitalSense branding guidelines
- [`enhanced-health-data-features.md`](./enhanced-health-data-features.md) - Enhanced health data features
- [`performance-optimizations.md`](./performance-optimizations.md) - Performance optimization guide

### Repository Documentation

- [`README.md`](./README.md) - Main project documentation index

## 🔍 Finding Documentation

### By Topic

- **Getting Started**: Start with [`getting-started/`](./getting-started/)
- **Development Setup**: See [`development/`](./development/) and [`ios/`](./ios/)
- **API Development**: Check [`architecture/API.md`](./architecture/API.md)
- **Deployment**: Look in [`deployment/`](./deployment/)
- **Troubleshooting**: Visit [`troubleshooting/`](./troubleshooting/)

### By Platform

- **Web/React**: [`architecture/`](./architecture/), [`development/`](./development/)
- **iOS**: [`ios/`](./ios/), [`ios-documentation/`](./ios-documentation/)
- **Infrastructure**: [`deployment/`](./deployment/), [`security/`](./security/)

### By Development Phase

- **Planning**: [`project-management/`](./project-management/), [`architecture/PRD.md`](./architecture/PRD.md)
- **Development**: [`development/`](./development/), [`ios/`](./ios/)
- **Testing**: [`troubleshooting/`](./troubleshooting/), various test documentation
- **Deployment**: [`deployment/`](./deployment/), [`root-docs/DEPLOYMENT_STATUS.md`](./root-docs/DEPLOYMENT_STATUS.md)

## 📝 Documentation Standards

All documentation follows these conventions:

- Markdown format (.md files)
- Clear headers and table of contents for longer documents
- Cross-references using relative links
- Screenshots and diagrams where helpful
- Code examples with syntax highlighting
- Consistent file naming (UPPER_CASE for status docs, lowercase for guides)

---

**Last Updated**: September 2, 2025  
**Total Documents**: 60+ documentation files across all categories
