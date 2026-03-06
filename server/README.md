# VitalSense Server Directory

This directory contains the WebSocket server implementation for VitalSense.

## 🎯 Primary Server

**`vitalsense-enhanced-server.js`** is the **canonical production server** and should be used for all deployments.

### Features
- ✅ SQLite database persistence
- ✅ JWT authentication
- ✅ Health data processing and alerts
- ✅ Rate limiting and security (Helmet, CORS)
- ✅ Emergency alert system
- ✅ Express REST API endpoints

### Usage

```bash
# Development
npm run dev  # In server/ directory
# or
NODE_ENV=development node vitalsense-enhanced-server.js

# Production
NODE_ENV=production node vitalsense-enhanced-server.js
```

### Configuration

The server uses environment variables for configuration:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DEVICE_JWT_SECRET` - JWT secret for device authentication
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

### Database

The server uses SQLite for persistence. Database file location:
- Development: `server/data/vitalsense-production.db`
- Production: Configure via environment variable

## 📦 Archived Servers

The following servers have been archived to `server/_archive/`:

- `websocket-server.js` - Basic WebSocket server (legacy)
- `vitalsense-websocket-server.js` - Simplified WebSocket server (legacy)

These are kept for reference only. All new development should use `vitalsense-enhanced-server.js`.

## 🐳 Docker

See `Dockerfile` for containerized deployment.

## 📚 Related Documentation

- Main project README: `../README.md`
- Deployment guide: `../docs/deploy/`
- Architecture: `../docs/architecture/`
