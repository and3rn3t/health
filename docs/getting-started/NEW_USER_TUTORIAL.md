# VitalSense New User Tutorial

Welcome to VitalSense! This quick "walk me through" guide helps you set up the project, verify your environment, and run the app locally—with progress tracking.

## What you'll do

- Run the interactive onboarding wizard with progress
- Ensure prerequisites (Node, Git, Wrangler, optional Docker)
- Create your `.env` automatically
- Install dependencies, validate config, and quick‑lint
- Start the Worker and check health

## 1) Run the onboarding wizard

From VS Code:

- Press Ctrl+Shift+P → Tasks: Run Task → "Onboarding: New User Wizard"
- Or run in a terminal:

```pwsh
node scripts/node/dev/onboarding-wizard.js
```

Flags:
- `--yes` or `-y`: non‑interactive defaults
- `--dry-run`: show steps without making changes

Progress will be written to `.onboarding-progress.json` in the repo root.

## 2) Start development services

- Start the Worker:
  - Tasks → `wrangler-dev-8789` (runs on http://127.0.0.1:8789)
- Optional WebSocket + Docker services:
  - Tasks → `🐳 Docker: Dev Workflow (no logs)`

## 3) Validate it's working

- Health check: `http://127.0.0.1:8789/health`
- Quick probe task: `probe-health-8789-curl` or `probe-worker-8789`
- Branding check: Tasks → "VitalSense App: Status (8789 Worker)"

## 4) Common next steps

- Run tests: Tasks → "🧪 Full Test Suite"
- Lint/fix: Tasks → "🔧 Fix All Issues"
- Docs hub: `docs/DOCUMENTATION_INDEX.md`
- WebSocket protocol: `docs/architecture/WEBSOCKETS.md`

## Troubleshooting

- If Wrangler is missing, install globally: `npm i -g wrangler`
- If Docker isn't available, you can skip the WebSocket container and use only the Worker while developing
- See `docs/troubleshooting/` for more

Happy building with VitalSense!
