# VitalSense New User Tutorial

Welcome to VitalSense! This quick "walk me through" guide helps you set up the project, verify your environment, and run the app locally—with progress tracking.

## What you'll do

- Ensure prerequisites (Node 22.21.1+, pnpm, Git, Wrangler)
- Install dependencies and configure environment
- Start the Worker and verify the health endpoint
- Run tests

## 1) Install and configure

```bash
git clone https://github.com/and3rn3t/health.git
cd health
pnpm install
cp .env.example .env.local   # then edit with your Auth0 credentials
```

## 2) Start development services

- Start the Worker:
  - Tasks → `wrangler-dev-8789` (runs on <http://127.0.0.1:8789>)
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
- See [Troubleshooting](../TROUBLESHOOTING.md) for more

Happy building with VitalSense!
