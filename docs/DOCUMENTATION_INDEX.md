# VitalSense — Documentation Index

Complete index of all project documentation. Links point only to files that exist in this repository.

**Last verified**: November 2026

---

## Getting Started

Start here for setup and onboarding.

| Document                                                                     | Description                        |
| ---------------------------------------------------------------------------- | ---------------------------------- |
| [getting-started/README.md](getting-started/README.md)                       | 15-minute quick start guide        |
| [getting-started/SETUP_GUIDE.md](getting-started/SETUP_GUIDE.md)             | Full development environment setup |
| [getting-started/NEW_USER_TUTORIAL.md](getting-started/NEW_USER_TUTORIAL.md) | Interactive onboarding wizard      |

## Architecture & Design

System architecture, API specs, and design decisions.

| Document                                                                                                               | Description                               |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)                                                           | High-level system architecture            |
| [architecture/API.md](architecture/API.md)                                                                             | REST API endpoint documentation           |
| [architecture/WEBSOCKETS.md](architecture/WEBSOCKETS.md)                                                               | WebSocket protocol and message contracts  |
| [architecture/PRD.md](architecture/PRD.md)                                                                             | Product requirements document             |
| [architecture/DOCKER.md](architecture/DOCKER.md)                                                                       | Docker local development setup            |
| [architecture/adr/ADR-0001-node-version-governance.md](architecture/adr/ADR-0001-node-version-governance.md)           | ADR: Node version governance              |
| [architecture/adr/ADR-0002-staged-healthkit-permissions.md](architecture/adr/ADR-0002-staged-healthkit-permissions.md) | ADR: Staged HealthKit permission strategy |

## Development

Development workflows, testing, and tooling.

| Document                                                     | Description                                   |
| ------------------------------------------------------------ | --------------------------------------------- |
| [develop/DEVELOPMENT.md](develop/DEVELOPMENT.md)             | Development setup and workflow guide          |
| [develop/SCRIPTS_REFERENCE.md](develop/SCRIPTS_REFERENCE.md) | Complete pnpm scripts reference               |
| [develop/testing.md](develop/testing.md)                     | Testing strategy (Vitest, Playwright, XCTest) |
| [develop/observability.md](develop/observability.md)         | Logging, metrics, and health checks           |

## Deployment & Infrastructure

Production deployment and Cloudflare configuration.

| Document                                                                               | Description                                         |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md](deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) | Full production deployment guide with observability |
| [deploy/CLOUDFLARE_DNS_SETUP.md](deploy/CLOUDFLARE_DNS_SETUP.md)                       | DNS records and subdomain strategy                  |
| [deploy/go-live-config.md](deploy/go-live-config.md)                                   | Go-live runtime configuration checklist             |
| [deploy/DEPLOYMENT_PREP_CHECKLIST.md](deploy/DEPLOYMENT_PREP_CHECKLIST.md)             | Environment setup checklist (KV, secrets, testing)  |

## Security & Privacy

Security baselines, data retention, and secret management.

| Document                                                       | Description                                   |
| -------------------------------------------------------------- | --------------------------------------------- |
| [security/SECURITY_BASELINE.md](security/SECURITY_BASELINE.md) | HIPAA-aligned security baseline               |
| [security/RETENTION_POLICY.md](security/RETENTION_POLICY.md)   | Data retention policy by record type          |
| [security/SECRET_MANAGEMENT.md](security/SECRET_MANAGEMENT.md) | Secret storage, rotation, and CI enforcement  |
| [security/BIAS_ASSESSMENT.md](security/BIAS_ASSESSMENT.md)     | Algorithmic bias assessment for health models |

## Troubleshooting

| Document                                 | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues across Web, Worker, iOS, Docker, and CI |

## Project Management

| Document                                                       | Description                    |
| -------------------------------------------------------------- | ------------------------------ |
| [project-management/ROADMAP.md](project-management/ROADMAP.md) | Product roadmap and priorities |

## iOS Development

iOS documentation lives in the [`ios/docs/`](../ios/docs/) directory within the iOS workspace. Key documents:

| Document                                                    | Description                                   |
| ----------------------------------------------------------- | --------------------------------------------- |
| [ios/docs/INDEX.md](../ios/docs/INDEX.md)                   | iOS documentation index                       |
| [ios/docs/MODEL_TRAINING.md](../ios/docs/MODEL_TRAINING.md) | CoreML training pipeline                      |
| [ios/CLAUDE.md](../ios/CLAUDE.md)                           | iOS architecture, patterns and build commands |

## Quick Navigation

| I want to…                | Go to                                                         |
| ------------------------- | ------------------------------------------------------------- |
| Set up my dev environment | [Getting Started](getting-started/README.md)                  |
| Understand the API        | [API docs](architecture/API.md)                               |
| Deploy to production      | [Production guide](deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) |
| Fix a build error         | [Troubleshooting](TROUBLESHOOTING.md)                         |
| Work on iOS               | [iOS docs](../ios/docs/INDEX.md)                              |
| Manage secrets            | [Secret management](security/SECRET_MANAGEMENT.md)            |

## Root-Level Documentation

- [`README.md`](../README.md) — Project overview and quick start
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — Contribution guidelines
- [`SECURITY.md`](../SECURITY.md) — Security policy
- [`privacy-policy.md`](../privacy-policy.md) — Privacy policy
- [`LICENSE`](../LICENSE) — MIT license

## Conventions

Markdown only, relative links, `pnpm` (never `npm run`) in commands, and
**VitalSense** as the product name in user-facing text.
