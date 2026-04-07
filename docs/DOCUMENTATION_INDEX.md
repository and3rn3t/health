# VitalSense — Documentation Index

Complete index of all project documentation. Links point only to files that exist in this repository.

**Last verified**: April 2026

---

## Getting Started

Start here for setup and onboarding.

| Document | Description |
|----------|-------------|
| [getting-started/README.md](getting-started/README.md) | 15-minute quick start guide |
| [getting-started/SETUP_GUIDE.md](getting-started/SETUP_GUIDE.md) | Full development environment setup |
| [getting-started/NEW_USER_TUTORIAL.md](getting-started/NEW_USER_TUTORIAL.md) | Interactive onboarding wizard |

## Architecture & Design

System architecture, API specs, and design decisions.

| Document | Description |
|----------|-------------|
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | High-level system architecture |
| [architecture/API.md](architecture/API.md) | REST API endpoint documentation |
| [architecture/WEBSOCKETS.md](architecture/WEBSOCKETS.md) | WebSocket protocol and message contracts |
| [architecture/PRD.md](architecture/PRD.md) | Product requirements document |
| [architecture/DOCKER.md](architecture/DOCKER.md) | Docker local development setup |
| [architecture/adr/ADR-0001-node-version-governance.md](architecture/adr/ADR-0001-node-version-governance.md) | ADR: Node version governance |
| [architecture/adr/ADR-0002-staged-healthkit-permissions.md](architecture/adr/ADR-0002-staged-healthkit-permissions.md) | ADR: Staged HealthKit permission strategy |

## Development

Development workflows, testing, and tooling.

| Document | Description |
|----------|-------------|
| [develop/DEVELOPMENT.md](develop/DEVELOPMENT.md) | Development setup and workflow guide |
| [develop/SCRIPTS_REFERENCE.md](develop/SCRIPTS_REFERENCE.md) | Complete pnpm scripts reference |
| [develop/testing.md](develop/testing.md) | Testing strategy (Vitest, Playwright, XCTest) |
| [develop/observability.md](develop/observability.md) | Logging, metrics, and health checks |

## Deployment & Infrastructure

Production deployment and Cloudflare configuration.

| Document | Description |
|----------|-------------|
| [deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md](deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) | Full production deployment guide with observability |
| [deploy/CLOUDFLARE_DNS_SETUP.md](deploy/CLOUDFLARE_DNS_SETUP.md) | DNS records and subdomain strategy |
| [deploy/go-live-config.md](deploy/go-live-config.md) | Go-live runtime configuration checklist |
| [deploy/DEPLOYMENT_PREP_CHECKLIST.md](deploy/DEPLOYMENT_PREP_CHECKLIST.md) | Environment setup checklist (KV, secrets, testing) |

## Security & Privacy

Security baselines, data retention, and secret management.

| Document | Description |
|----------|-------------|
| [security/SECURITY_BASELINE.md](security/SECURITY_BASELINE.md) | HIPAA-aligned security baseline |
| [security/RETENTION_POLICY.md](security/RETENTION_POLICY.md) | Data retention policy by record type |
| [security/SECRET_MANAGEMENT.md](security/SECRET_MANAGEMENT.md) | Secret storage, rotation, and CI enforcement |
| [security/BIAS_ASSESSMENT.md](security/BIAS_ASSESSMENT.md) | Algorithmic bias assessment for health models |

## Troubleshooting

| Document | Description |
|----------|-------------|
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues across Web, Worker, iOS, Docker, and CI |

## Project Management

| Document | Description |
|----------|-------------|
| [project-management/ROADMAP.md](project-management/ROADMAP.md) | Product roadmap and priorities |
| [CHANGELOG.md](CHANGELOG.md) | Release history and production rollbacks |

## iOS Development

iOS documentation lives in the [`ios/docs/`](../ios/docs/) directory within the iOS workspace. Key documents:

| Document | Description |
|----------|-------------|
| [ios/docs/INDEX.md](../ios/docs/INDEX.md) | iOS documentation index |
| [ios/docs/MODEL_TRAINING.md](../ios/docs/MODEL_TRAINING.md) | CoreML training pipeline |
| [ios/docs/XCODE_PROJECT_SETUP.md](../ios/docs/XCODE_PROJECT_SETUP.md) | Xcode project configuration |

## Quick Navigation

| I want to… | Go to |
|-------------|-------|
| Set up my dev environment | [Getting Started](getting-started/README.md) |
| Understand the API | [API docs](architecture/API.md) |
| Deploy to production | [Production guide](deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) |
| Fix a build error | [Troubleshooting](TROUBLESHOOTING.md) |
| Work on iOS | [iOS docs](../ios/docs/INDEX.md) |
| Manage secrets | [Secret management](security/SECRET_MANAGEMENT.md) |

## Recent Updates

### April 2026 — Documentation Cleanup

- Rewritten scripts reference to match actual 27 pnpm scripts
- Fixed Node version references (≥22.21.1 per `package.json engines`)
- Removed stale geospatial/STAC/LiDAR content from roadmap, testing, and observability docs
- Consolidated `npm run` → `pnpm` across all docs, PR template, and CONTRIBUTING guide
- Updated privacy policy to VitalSense branding
- Removed references to non-existent scripts and setup PowerShell files
- **Archived historical cleanup documents** for reference

### September 2025 - Major Reorganization

- **Archived 30+ completed documents** to reduce clutter
- **Consolidated redundant Auth0 documentation** into primary guides
- **Created getting-started folder** with quick onboarding guides
- **Moved iOS-specific docs** to proper iOS folder
- **Standardized naming conventions** across all documentation

### 📚 New Documentation

- **VitalSense Branding Documentation** - Complete implementation and troubleshooting guides
- **Getting Started Guides** - Quick setup and detailed environment configuration
- **Consolidated Auth Documentation** - Streamlined Auth0 setup process
- **Performance SLO & Governance** - Budgets, drift rules, WS schema & latency tracking

### 🎯 Improved Organization

- **Clear folder structure** with purpose-based organization
- **Reduced redundancy** by consolidating overlapping documentation
- **Better cross-references** with consistent linking
- **Active vs. archived** separation for easier maintenance

---

**Last Updated**: January 2025  
**Documentation Health**: ✅ Excellent - Well organized and maintained  
**Total Active Files**: ~50 focused, current documentation files

## 📄 Root-Level Documentation

The following important documentation files are located at the project root:

- [`README.md`](../README.md) - Main project overview and quick start
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Contribution guidelines
- [`SECURITY.md`](../SECURITY.md) - Security policy
- [`privacy-policy.md`](../privacy-policy.md) - Privacy policy
- [`LICENSE`](../LICENSE) - Project license

## 🔍 Finding Documentation

### By Topic

- **Getting Started**: Start with [`getting-started/`](./getting-started/)
- **Development Setup**: See [`develop/`](./develop/) and [`ios/`](./ios/)
- **API Development**: Check [`architecture/API.md`](./architecture/API.md)
- **Deployment**: Look in [`deploy/`](./deploy/)
- **Troubleshooting**: Visit [`troubleshooting/`](./troubleshooting/)
  - [`PROBLEM_SOLUTIONS_DATABASE.md`](./troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md) - Comprehensive problem database
  - [`VITALSENSE_BRANDING_LESSONS_LEARNED.md`](./troubleshooting/VITALSENSE_BRANDING_LESSONS_LEARNED.md) - Complete branding implementation guide
  - [`VITALSENSE_BRANDING_QUICK_REFERENCE.md`](./troubleshooting/VITALSENSE_BRANDING_QUICK_REFERENCE.md) - Quick branding fixes

### By Platform

- **Web/React**: [`architecture/`](./architecture/), [`develop/`](./develop/)
- **iOS**: [`ios/`](./ios/) - comprehensive iOS documentation
- **Infrastructure**: [`deploy/`](./deploy/), [`security/`](./security/)

### By Development Phase

- **Planning**: [`project-management/`](./project-management/), [`architecture/PRD.md`](./architecture/PRD.md)
- **Development**: [`getting-started/`](./getting-started/), [`develop/`](./develop/), [`ios/`](./ios/)
- **Testing**: [`troubleshooting/`](./troubleshooting/), various test documentation
- **Deployment**: [`deploy/`](./deploy/) folder

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
