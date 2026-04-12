# VitalSense

> Health monitoring platform: Apple Health insights, fall risk detection, emergency alerts, caregiver dashboards.

[![iOS](https://img.shields.io/badge/iOS-26+-black.svg)](https://developer.apple.com/ios/)
[![Swift](https://img.shields.io/badge/Swift-6.0-orange.svg)](https://developer.apple.com/swift/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/and3rn3t/health/actions/workflows/ci-core.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/ci-core.yml)
[![codecov](https://codecov.io/gh/and3rn3t/health/graph/badge.svg)](https://codecov.io/gh/and3rn3t/health)
[![iOS CI](https://github.com/and3rn3t/health/actions/workflows/ios-ci.yml/badge.svg)](https://github.com/and3rn3t/health/actions/workflows/ios-ci.yml)

## Features

- **Health Data Visualization** — Import and display Apple Health metrics with trend analysis
- **Fall Risk Assessment** — Real-time gait, balance, and mobility scoring
- **Emergency Detection & Response** — Automatic fall detection with caregiver alerts
- **Caregiver Dashboard** — Remote monitoring for family and healthcare providers
- **Real-time Sync** — WebSocket-based live data streaming between iOS and web

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind v4, Radix UI, TanStack Query |
| Backend | Cloudflare Workers (Hono), Durable Objects, KV/R2 |
| iOS | Swift, SwiftUI, HealthKit, CoreML |
| Auth | Auth0 with JWT (JWKS + HS256 fallback) |
| Testing | Vitest, Playwright, XCTest |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start Cloudflare Worker locally
pnpm cf:dev
```

### iOS (Mac required)

```bash
open ios/Andernet-Posture/Andernet\ Posture.xcodeproj
```

### Docker (optional)

```bash
docker compose up --build -d
# Worker: http://localhost:8789
```

## Key Commands

```bash
pnpm dev              # Vite dev server
pnpm build            # Build web app
pnpm build:worker     # Build Cloudflare Worker
pnpm test             # Run Vitest
pnpm lint             # ESLint
pnpm type-check       # TypeScript validation
pnpm validate         # lint + type-check + test
pnpm cf:dev           # Local Workers preview
pnpm deploy:prod      # Deploy to production
```

## Architecture

```
iOS App (HealthKit) ──► Cloudflare Worker (Hono) ◄── React Web App
                              │
                    ┌─────────┴──────────┐
                    │                    │
              Cloudflare KV        Cloudflare R2
              (health data)        (files/audit)
```

- **React app** builds to `dist/`, served as Worker static assets
- **Worker** handles `/api/*` routes, `/ws` WebSocket upgrade, and static serving
- **Durable Objects** manage `HealthWebSocket` sessions and `RateLimiter` enforcement
- **iOS app** syncs health data via WebSocket bridge

## Project Structure

```
src/
├── components/        # React components (ui/, health/, gamification/)
├── hooks/             # Custom hooks (useAuth, useLiveHealthData, useWebSocket)
├── lib/               # Utilities, config, health processors
├── schemas/           # Zod schemas for health data validation
└── worker/            # Cloudflare Worker (routes/, middleware, Durable Objects)
ios/                   # Native iOS app (Andernet Posture)
docs/                  # Documentation hub
scripts/               # Build, CI, config sync
e2e/                   # Playwright E2E tests
```

## Documentation

- **[Documentation Hub](docs/README.md)** — Full index of all docs
- **[Architecture](docs/architecture/ARCHITECTURE.md)** — System design
- **[API Docs](docs/architecture/API.md)** — REST endpoints
- **[WebSocket Guide](docs/architecture/WEBSOCKETS.md)** — Real-time protocol
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** — Common issues and fixes

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR checklist.

## License

[MIT](LICENSE)
