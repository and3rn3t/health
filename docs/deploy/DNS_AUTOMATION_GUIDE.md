# DNS Automation Setup Guide

## 🎯 Quick Start

Your health platform can now be deployed with **automated DNS configuration**!

### **Prerequisites**

1. **Cloudflare API Token** with DNS permissions

```bash
# Get from: https://dash.cloudflare.com/profile/api-tokens
# Permissions needed: Zone:DNS:Edit for andernet.dev

export CLOUDFLARE_API_TOKEN="your-token-here"
```

2. **Domain Already Configured** ✅
   - `andernet.dev` is already in Cloudflare

## 🚀 Deployment Commands

### **Phase 1: MVP (Deploy Now)**

```bash
# Deploy main health app to health.andernet.dev
npm run platform:phase1

# Or step by step:
npm run dns:phase1        # Create DNS records
npm run deploy:prod       # Deploy worker
```

### **Phase 2: API Separation (When Ready)**

```bash
# Add api.health.andernet.dev + ws.health.andernet.dev
npm run platform:phase2
```

### **Phase 3: Full Platform (Production)**

```bash
# Add emergency, files, caregiver subdomains
npm run platform:phase3
```

## 🔧 Manual DNS Management

### **View Configuration**

```bash
# See what will be created (dry run)
npm run dns:phase1 -- -DryRun
```

### **Create DNS Records Only**

```bash
# Just DNS, no worker deployment
npm run dns:phase1
npm run dns:phase2
npm run dns:phase3
```

### **Clean Up**

```bash
# Remove all health.* DNS records
npm run dns:cleanup
```

## 📋 Configuration File

All DNS mappings are defined in `config/dns-config.yml`:

```yaml
domain: 'andernet.dev'

phases:
  1: # health.andernet.dev
  2: # api.health.andernet.dev, ws.health.andernet.dev
  3: # emergency.health.andernet.dev, files.health.andernet.dev, caregiver.health.andernet.dev
```

## 🌐 Result URLs

After deployment, your platform will be available at:

- **Phase 1**: `https://health.andernet.dev`
- **Phase 2**: `https://api.health.andernet.dev`, `https://ws.health.andernet.dev`
- **Phase 3**: `https://emergency.health.andernet.dev`, etc.

## 🔍 Verification

```bash
# Test all deployed endpoints
npm run platform:verify

# Manual testing
curl https://health.andernet.dev/health
```

## ⚡ One-Command Deployment

```bash
# Deploy everything for Phase 1 (recommended start)
npm run platform:phase1

# This will:
# 1. Create health.andernet.dev DNS record
# 2. Deploy your Cloudflare Worker
# 3. Verify the deployment
# 4. Show you the live URL
```

**Your health platform will be live in ~2 minutes!** 🎉
