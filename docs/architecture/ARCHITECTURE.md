# Architecture Overview

A learning project exploring iOS development with HealthKit integration and a web-based health dashboard.

## High-Level Architecture

```text
iOS App (Swift/HealthKit) ↔ API (Cloudflare Workers) ↔ Web Dashboard (React)
```

### Components

- **iOS Application**: Native Swift app using HealthKit and Core Motion
- **Web Dashboard**: React 19 + TypeScript single-page application
- **API Layer**: Cloudflare Workers (serverless edge functions)
- **Real-time Bridge**: Node.js WebSocket server for live data streaming
- **Storage**: Cloudflare KV (JSON) and R2 (files)

## Technology Stack

### Frontend (Web)
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- TanStack Query for server state

### Backend
- Cloudflare Workers (Hono framework)
- Node.js WebSocket server
- Cloudflare KV and R2 for storage

### iOS
- Swift 5 with SwiftUI
- HealthKit framework
- Core Motion for sensors
- Network framework for API calls

## Build Outputs

- **Web Bundle**: `dist/` (served as Worker assets)
- **Worker Bundle**: `dist-worker/index.js` (entry: `src/worker.ts`)
- **iOS App**: Built via Xcode

## API Routes

The Cloudflare Worker handles:

- `GET /health` - Health check endpoint
- `GET /api/health-data` - Fetch health metrics
- `POST /api/health-data` - Store health data
- `GET /*` - Static asset serving (SPA fallback)

## WebSocket Server

Local development server (`server/websocket-server.js`) provides:

- Real-time health data updates
- Live sensor streaming
- Connection status management

**Message Types:**
- `connection_established` - Initial handshake
- `live_health_update` - Real-time metrics
- `historical_data_update` - Batch data sync

## Data Flow

### iOS → Backend
1. iOS app requests HealthKit permissions
2. Reads health data from Apple Health
3. POSTs JSON to Cloudflare Worker API
4. Worker stores in Cloudflare KV

### Backend → Web
1. React app fetches data via REST API
2. Displays charts and visualizations
3. WebSocket connection for real-time updates

## Storage Strategy

- **Cloudflare KV**: JSON health data records
- **Cloudflare R2**: File uploads (exports, reports)
- **Local**: iOS app uses Core Data for offline caching

## Security

- HealthKit data stays private to the device
- API uses JWT authentication
- HTTPS/WSS for all network communication
- No server-side access to raw health records

## Development Workflow

```bash
# Start all services
npm run dev          # React dev server (5173)
npm run cf:dev       # Cloudflare Worker (8787)
npm run ws:dev       # WebSocket server (3001)
```

## Deployment

- **Web + Worker**: Cloudflare Pages (automatic via GitHub)
- **iOS App**: Manual Xcode build for personal device
- **WebSocket**: Optional for local development only

## Performance Considerations

- Edge computing reduces API latency (<100ms globally)
- Code splitting keeps initial bundle small (~187KB gzipped)
- Lazy loading for charts and visualizations
- WebSocket reconnection for reliable real-time updates

---

For detailed API documentation, see [API.md](API.md).  
For WebSocket protocol details, see [WEBSOCKETS.md](WEBSOCKETS.md).
