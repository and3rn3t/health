# Dockerizing VitalSense

This guide shows how to run the VitalSense Worker (Cloudflare dev) and the WebSocket bridge with Docker.

## What you get

- Worker: Cloudflare Worker running locally via `wrangler dev` on <http://localhost:8789>
- WebSocket bridge: Node WebSocket server on ws://localhost:3001
- Shared dev network via docker-compose

## Prerequisites

- Docker Desktop installed and running
- Port 8789 and 3001 available locally

## Start the stack

```pwsh
# From repo root
docker compose up --build -d
```

- Worker UI/API: <http://localhost:8789>
- WebSocket: ws://localhost:3001

## Logs

```pwsh
docker compose logs -f worker
docker compose logs -f websocket
```

## Stop

```pwsh
docker compose down
```

## Environment

The compose file sets development defaults:

- DEVICE_JWT_SECRET=dev-local for device-auth paths
- ALLOWED_ORIGINS includes <http://localhost:8789>
- WEBSOCKET_URL=ws://localhost:3001 wired into the Worker

To override, edit `docker-compose.yml` or pass `--env-file` with your own `.env`.

## Notes

- This setup is for local development only. Production runs on Cloudflare Workers; do not run Node APIs inside the worker image.
- If you change worker code, rebuild images or mount source into the container and call `wrangler dev --local --watch` as needed.
- The existing non-Docker dev workflow via VS Code tasks remains supported.
