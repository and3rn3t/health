# VitalSense — Documentation Hub

> Health monitoring platform: Apple Health insights, fall risk detection, emergency alerts, caregiver dashboards.

The full list of documents is in the **[Documentation Index](DOCUMENTATION_INDEX.md)**.

## Quick Navigation

| I want to…                  | Go to                                                         |
| --------------------------- | ------------------------------------------------------------- |
| Get started quickly         | [Quick Start](getting-started/README.md)                      |
| Set up my dev environment   | [Setup Guide](getting-started/SETUP_GUIDE.md)                 |
| Understand the architecture | [Architecture](architecture/ARCHITECTURE.md)                  |
| Read the API docs           | [API](architecture/API.md)                                    |
| Deploy to production        | [Production Guide](deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) |
| Fix an issue                | [Troubleshooting](TROUBLESHOOTING.md)                         |
| Work on iOS                 | [iOS Docs](../ios/docs/INDEX.md)                              |
| Manage secrets              | [Secret management](security/SECRET_MANAGEMENT.md)            |

## Structure

```
docs/
├── getting-started/     — Quick start, setup guide, onboarding wizard
├── architecture/        — System design, API, WebSockets, PRD, ADRs
├── develop/             — Dev workflow, scripts reference, testing, observability
├── deploy/              — Production deployment, DNS, go-live config
├── security/            — Security baseline, retention, secrets, bias assessment
├── project-management/  — Roadmap
└── TROUBLESHOOTING.md   — Common issues and fixes
```

iOS documentation lives in [`../ios/docs/`](../ios/docs/INDEX.md).

## Related

- [Contributing](../CONTRIBUTING.md) · [Security policy](../SECURITY.md) · [Privacy policy](../privacy-policy.md)
