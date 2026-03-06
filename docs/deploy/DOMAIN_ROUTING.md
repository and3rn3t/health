# Domain Routing Configuration

This document describes the DNS and routing configuration for all Cloudflare Workers environments.

## 🌐 Production Domains

### Main Web Application
- **Domain**: `health.andernet.dev`
- **Worker**: `health-app-prod` (production environment)
- **Purpose**: Primary user entry point for the React web application
- **Routes**: All traffic to `health.andernet.dev/*` is handled by the main worker
- **Services**: 
  - React SPA
  - API endpoints (`/api/*`)
  - Static assets
  - Health checks (`/health`)

### WebSocket Service
- **Domain**: `ws.health.andernet.dev`
- **Worker**: `vitalsense-websocket-advanced-prod` (advanced-websocket-prod environment)
- **Purpose**: Real-time WebSocket connections for health data streaming
- **Routes**: `ws.health.andernet.dev/*` routes to the advanced websocket worker
- **Services**:
  - WebSocket connections (`/ws`)
  - Health checks (`/health`)

## 🔧 Development Domains

### Development Web Application
- **Worker**: `health-app-dev` (development environment)
- **Access**: Via `workers.dev` subdomain only (no custom domain)
- **URL**: `health-app-dev.<account>.workers.dev`

### Development WebSocket Service
- **Worker**: `vitalsense-websocket-advanced-dev` (advanced-websocket-dev environment)
- **Access**: Via `workers.dev` subdomain only
- **URL**: `vitalsense-websocket-advanced-dev.<account>.workers.dev`

## 📋 Environment Configuration

### Production Environment (`--env production`)
```toml
[env.production]
name = "health-app-prod"
routes = ["health.andernet.dev/*"]
```

**Environment Variables**:
- `BASE_URL = "https://health.andernet.dev"`
- `API_BASE_URL = "https://health.andernet.dev/api"`
- `WEBSOCKET_URL = "wss://ws.health.andernet.dev/ws"`
- `ALLOWED_ORIGINS = "https://health.andernet.dev"`

### Advanced WebSocket Production (`--env advanced-websocket-prod`)
```toml
[env.advanced-websocket-prod]
name = "vitalsense-websocket-advanced-prod"
routes = ["ws.health.andernet.dev/*"]
```

### Development Environment (`--env development`)
```toml
[env.development]
name = "health-app-dev"
# No custom routes - uses workers.dev subdomain
```

**Environment Variables**:
- `BASE_URL = "http://localhost:8789"`
- `WEBSOCKET_URL = "wss://vitalsense-websocket-advanced-dev.andernet.workers.dev/ws"`

### Advanced WebSocket Development (`--env advanced-websocket-dev`)
```toml
[env.advanced-websocket-dev]
name = "vitalsense-websocket-advanced-dev"
# No custom routes - uses workers.dev subdomain
```

## 🚫 Removed Domains

The following domains have been removed from production configuration:
- `vitalsense.andernet.dev` - Removed to ensure only `health.andernet.dev` is the user entry point

## ✅ DNS Requirements

### Required DNS Records (in Cloudflare)

1. **Main App**:
   - `health.andernet.dev` → CNAME to `health-app-prod.workers.dev` (or use Worker Routes)

2. **WebSocket Service**:
   - `ws.health.andernet.dev` → CNAME to `vitalsense-websocket-advanced-prod.workers.dev` (or use Worker Routes)

### Worker Routes (Recommended)

Worker Routes are preferred over CNAME records as they:
- Automatically handle SSL/TLS
- Provide better performance
- Are configured in `wrangler.toml`

Routes are configured in `wrangler.toml`:
```toml
[[env.production.routes]]
pattern = "health.andernet.dev/*"
zone_name = "andernet.dev"

[[env.advanced-websocket-prod.routes]]
pattern = "ws.health.andernet.dev/*"
zone_name = "andernet.dev"
```

## 🔍 Verification

To verify DNS and routing:

```bash
# Check main app
curl https://health.andernet.dev/health

# Check websocket service
curl https://ws.health.andernet.dev/health

# Verify DNS resolution
nslookup health.andernet.dev
nslookup ws.health.andernet.dev
```

## 📝 Notes

- All production domains use `andernet.dev` zone
- Development environments use `workers.dev` subdomains only
- SSL/TLS is automatically handled by Cloudflare
- Each worker environment has isolated routing configuration

