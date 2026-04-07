# 🚀 Getting Started with VitalSense

Welcome to VitalSense - your comprehensive health monitoring platform! This guide will get you up and running in 15 minutes.

## 🎯 Quick Start (15 minutes)

### Prerequisites

- **Development Environment**: VS Code with recommended extensions
- **Node.js**: Version 22.21.1 or later (see `engines` in `package.json`)
- **pnpm**: Version 10.16+ (via Corepack)
- **Git**: For version control

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/and3rn3t/health.git
cd health

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env.local
```

### 2. Start Development Servers

**Option A: VS Code Tasks (Recommended)**

1. Open VS Code: `code .`
2. Press `Ctrl+Shift+P` → "Tasks: Run Task"
3. Select `🚀 Node.js Development Workflow`

**Option B: Command Line**

```bash
# Start the development server
pnpm dev

# In another terminal, start the Cloudflare Worker
pnpm cf:dev
```

### 3. Verify Installation

- **Web App**: Open <http://localhost:5173>
- **API Health**: <http://localhost:8787/health>
- **WebSocket**: Should auto-connect when you load the app

### 4. Explore the Platform

1. **Demo Mode**: Click "Demo Mode" to explore with sample data
2. **Health Dashboard**: View sample health metrics and insights
3. **Fall Risk Assessment**: See the fall detection algorithms in action

## What's Next?

- **For Development**: See [Development Setup Guide](SETUP_GUIDE.md)
- **For iOS**: Check [iOS Development Guide](../../ios/docs/INDEX.md)
- **For Deployment**: Review [Deployment Guide](../deploy/README.md)

## Need Help?

- **Issues**: Check [Troubleshooting Guide](../TROUBLESHOOTING.md)
- **Documentation**: Browse [Complete Documentation Index](../DOCUMENTATION_INDEX.md)

---

**Time to Value**: ⚡ 15 minutes to working development environment  
**Next Step**: Choose your path - [Web Development](SETUP_GUIDE.md) | [iOS Development](../../ios/docs/INDEX.md) | [API Development](../architecture/API.md)
