# 🏥 VitalSense - Apple Health Insights & Fall Risk Monitor

> **A comprehensive health data analysis platform that transforms Apple Health data into actionable insights while providing proactive fall risk monitoring, real-time gait analysis, and emergency response capabilities.**

**🚀 Now Live:** [https://health.andernet.dev](https://health.andernet.dev)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![iOS](https://img.shields.io/badge/iOS-16+-black.svg)](https://developer.apple.com/ios/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Production](https://img.shields.io/badge/Status-Live-brightgreen.svg)](https://health.andernet.dev)
[![Branding Audit](https://github.com/and3rn3t/health/actions/workflows/branding-audit.yml/badge.svg)](.github/workflows/branding-audit.yml)
[![iOS Tests](https://github.com/and3rn3t/health/actions/workflows/ios-tests.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/ios-tests.yml)
[![Core CI](https://github.com/and3rn3t/health/actions/workflows/ci-core.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/ci-core.yml)
[![Security & Quality](https://github.com/and3rn3t/health/actions/workflows/security-quality.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/security-quality.yml)
[![Optimized Pipeline](https://github.com/and3rn3t/health/actions/workflows/optimized-pipeline.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/optimized-pipeline.yml)
[![Smoke Tests](https://github.com/and3rn3t/health/actions/workflows/smoke.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/smoke.yml)

<!-- Dynamic CI Badges (generated on main by baseline_metrics job) -->
<p>
  <img alt="Coverage" src="./ci-baselines/badges/coverage.svg" />
  <img alt="ESLint Errors" src="./ci-baselines/badges/eslint-errors.svg" />
  <img alt="ESLint Warnings" src="./ci-baselines/badges/eslint-warnings.svg" />
  <img alt="Latency" src="./ci-baselines/badges/perf-latency.svg" />
  <img alt="Main Bundle Size" src="./ci-baselines/badges/bundle-main.svg" />
</p>

> Badges above are lightweight SVGs committed by CI (no external shield calls) keeping repo self-contained & offline-view friendly.

## 🚀 Quick Start

### Web Application (5 minutes)

```bash
# Install dependencies
npm install

# Start development servers
npm run dev          # React app on http://localhost:5173
npm run cf:dev       # Cloudflare Worker on http://localhost:8787
npm run ws:dev       # WebSocket server on ws://localhost:3001
```

### 🐳 Docker (Worker + WebSocket)

```bash
# Build and start both services
docker compose up --build -d

# Access
# - Worker (API + static): http://localhost:8789
# - WebSocket server: ws://localhost:3001

# View logs
docker compose logs -f worker
docker compose logs -f websocket

# Stop
docker compose down
```

See also: docs/DOCKER.md for full usage and environment details.

#### Docker Dev Workflow (VS Code Tasks)

- Bring up everything and run health checks:
  - Tasks → "🐳 Docker: Dev Workflow (no logs)"
- Tail logs:
  - "🐳 Docker: Logs (worker)" and "🐳 Docker: Logs (websocket)"
- Quick probes:
  - Worker: "probe-health-8789-curl" → <http://127.0.0.1:8789/health>
  - WebSocket: "🐳 Docker: Health (websocket)" → <http://127.0.0.1:3001/api/health>

Endpoints:

- API + static: <http://127.0.0.1:8789>
- WebSocket REST health: <http://127.0.0.1:3001/api/health>

### iOS Application (15 minutes on Mac)

1. **Open Xcode** and create new iOS project
2. **Add HealthKit capability** in project settings
3. **Copy Swift files** from `ios/HealthKitBridge/` to your project
4. **Configure Info.plist** with HealthKit permissions
5. **Build and run** on physical device (HealthKit requires real device)

📖 **[Complete Setup Guide →](docs/SETUP_GUIDE.md)**

## 🏗️ Architecture

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   iOS App       │    │  React Web App   │    │  Caregiver      │
│   (HealthKit)   │◄──►│  (Dashboard)     │◄──►│  Dashboard      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (API + Static)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Health    │  │   Auth &    │  │    Emergency Alert      │ │
│  │  Analytics  │  │   Privacy   │  │      System             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Cloudflare KV  │    │   Cloudflare R2  │    │   WebSocket     │
│  (Health Data)  │    │  (File Storage)  │    │   (Real-time)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 🏥 Health Analytics

- **Comprehensive Data Analysis**: Import and analyze all Apple Health metrics
- **Advanced Insights**: Correlation analysis and trend detection beyond Apple Health
- **Personalized Recommendations**: AI-driven health insights and interventions
- **Clinical Integration**: HIPAA-compliant health record management

### ⚠️ Fall Risk Monitoring

- **Proactive Assessment**: Real-time gait and balance analysis
- **Predictive Modeling**: Machine learning for fall risk prediction
- **Personalized Alerts**: Custom risk thresholds and notifications
- **Intervention Tracking**: Monitor effectiveness of prevention strategies

### 🚨 Emergency Response

- **Automatic Fall Detection**: Real-time monitoring with immediate alerts
- **Emergency Contacts**: Instant notification system for caregivers
- **Location Sharing**: GPS coordinates for emergency responders
- **Incident Documentation**: Comprehensive fall tracking and reporting

### 👨‍⚕️ Caregiver Dashboard

- **Real-time Monitoring**: Live health metrics and status updates
- **Collaborative Care**: Multi-stakeholder communication platform
- **Clinical Documentation**: Professional reporting and record keeping
- **Privacy Controls**: Granular consent and access management

## 🛠️ Technology Stack

### Frontend

- **React 19** with TypeScript for type-safe UI development
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** with semantic design tokens
- **Radix UI** for accessible component primitives
- **TanStack Query** for server state management

### Backend

- **Cloudflare Workers** for serverless edge computing
- **Hono** for lightweight API framework
- **Cloudflare KV/R2** for data storage and file handling
- **WebSocket** bridge for real-time communications

### Mobile

- **Swift** with SwiftUI for native iOS experience
- **HealthKit** for secure health data access
- **Core Motion** for advanced sensor data analysis
- **Network** framework for reliable data transmission

### Security & Privacy

- **End-to-end encryption** for all health data
- **Zero-knowledge architecture** - server cannot read personal data
- **HIPAA compliance** with comprehensive audit trails

### Performance & Optimization

- **Production Bundle**: ~187KB optimized with aggressive code splitting
- **React Performance**: Lazy loading, memoization, and Suspense boundaries
- **Edge Computing**: Cloudflare Workers for sub-100ms global response times
- **Real-time Updates**: WebSocket connections with automatic reconnection
- **Incremental Loading**: Component-level code splitting for faster initial loads

_Latest optimization: December 2024 - See `docs/_archive/optimizations/OPTIMIZATION_DEPLOYMENT_COMPLETE.md`_

- **JWT authentication** with secure token management

## 📊 Project Status

### ✅ Completed

- ✅ React web application with health dashboard
- ✅ Cloudflare Workers API with secure endpoints
- ✅ iOS HealthKit bridge with real-time sync
- ✅ WebSocket server for live data streaming
- ✅ End-to-end encryption and JWT authentication
- ✅ Automated deployment pipelines
- ✅ Comprehensive documentation and troubleshooting guides
- ✅ Automated branding & rebrand residue audit (HTML markers + legacy term scan)

### 🚧 In Progress

- 🔄 Advanced fall detection algorithms
- 🔄 Enhanced caregiver dashboard features
- 🔄 Apple Watch companion application

### 📋 Planned

- 📅 Production deployment optimization
- 📅 Clinical integration partnerships
- 📅 Advanced analytics and ML features
- 📅 Healthcare provider portal

## 🧾 Branding & Rebrand Integrity

We enforce VitalSense branding consistency in CI:

- Combined audit script: `node scripts/node/branding/branding-audit.js`
- Runs in smoke + deploy workflows (HTML marker verification + legacy "HealthGuard" residue scan)
- Outputs markdown report: `reports/branding-audit-summary.md` (uploaded as artifact)

Local development quick checks:

```bash
npm run branding:audit:local      # Against local Worker (port 8787)
npm run verify:branding:local     # Simple HTML marker pass
npm run verify:rebrand            # Residual term scan only
```

Branding gates fail if required VitalSense markers are missing or any legacy brand strings remain. A dedicated workflow (`branding-audit.yml`) runs in two modes (matrix):

| Mode       | Target                        | Purpose                                         |
| ---------- | ----------------------------- | ----------------------------------------------- |
| local      | <http://127.0.0.1:8787>       | Verifies dev Worker build branding consistency  |
| production | <https://health.andernet.dev> | Ensures deployed site remains correctly branded |

## 📖 Documentation

### 🚀 Getting Started

### CSS Strategy

We follow a consolidation‑first CSS approach: one primary hashed CSS bundle from Tailwind (`src/main.css`), with optional code‑split CSS only for large, lazy‑loaded features. Rationale, guardrails, and workflow live in `docs/development/CSS_STRATEGY.md`.

### 📱 iOS Development

- **[iOS Setup Guide](docs/IOS_DEPLOYMENT_GUIDE.md)** - Complete iOS build and deployment
- **[Windows Development](docs/IOS_DEVELOPMENT_WINDOWS.md)** - iOS development on Windows
- **[Build Troubleshooting](docs/BUILD_TROUBLESHOOTING.md)** - Common issues and solutions

### 🏗️ Architecture & API

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and technical decisions
- **[API Documentation](docs/API.md)** - REST endpoints and data schemas
- **[WebSocket Guide](docs/WEBSOCKETS.md)** - Real-time communication patterns

### 🔧 Advanced Topics

- **[Security Baseline](docs/SECURITY_BASELINE.md)** - Security implementation details
- **[Problem Solutions Database](docs/PROBLEM_SOLUTIONS_DATABASE.md)** - Comprehensive troubleshooting
- **[Lessons Learned](docs/LESSONS_LEARNED.md)** - Project insights and best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup and workflow
- Code style and quality standards
- Testing requirements and strategies
- Security and privacy considerations
- Documentation expectations

### Development Environment

```bash
# Prerequisites
node >= 18.0.0
npm >= 9.0.0
# For iOS development
Xcode >= 15.0 (macOS only)
```

### Code Quality

- **TypeScript** strict mode enabled
- **ESLint** for code quality
- **Prettier** for consistent formatting
- **Zod** for runtime validation
- **React Testing Library** for component tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Complete guides in [`/docs`](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/and3rn3t/health/issues) for bugs and feature requests
- **Security**: Report security issues via [SECURITY.md](SECURITY.md)
- **Discussions**: [GitHub Discussions](https://github.com/and3rn3t/health/discussions) for questions and ideas

## 🏥 About VitalSense

VitalSense represents the next generation of proactive health monitoring, combining the power of Apple's HealthKit with advanced analytics and machine learning to provide unprecedented insights into health trends and fall risk assessment. Built with privacy-first principles and clinical-grade security, it empowers individuals and their care teams to make informed decisions about health and safety.

**Key Principles:**

- **Privacy First**: Your health data stays private with end-to-end encryption
- **Proactive Care**: Early detection and intervention prevent health crises
- **Collaborative**: Seamless communication between patients, families, and providers
- **Evidence-Based**: Decisions backed by comprehensive data analysis

---

Built with ❤️ for better health outcomes and peace of mind.
