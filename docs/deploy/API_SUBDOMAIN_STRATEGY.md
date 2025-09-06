# API Subdomain Strategy & Deployment Plan

## 🏥 Health Platform Domain Architecture

### **Primary Domain Structure**

````text
### **Primary Domain Structure**

```text
andernet.dev (root domain)
├── health.andernet.dev          → Main React SPA + Landing
├── api.health.andernet.dev      → Core Health Data APIs
├── ws.health.andernet.dev       → WebSocket Real-time Services
├── emergency.health.andernet.dev → Emergency Response APIs
├── caregiver.health.andernet.dev → Caregiver Dashboard APIs
└── files.health.andernet.dev    → File Storage & Apple Health Imports
````

````

## 🚀 Deployment Timeline & Phases

### **Phase 1: MVP (Current) - Single Worker**

- **Domain**: `health.andernet.dev`
- **Deployment**: Single Cloudflare Worker handling all routes
- **Configuration**: Current `wrangler.toml` with internal routing
- **Timeline**: Immediate development and initial deployment

### **Phase 2: API Separation (Month 1-2)**

- **Add**: `api.health.andernet.dev`
- **Purpose**: Separate API traffic from static assets
- **Benefits**: Better caching, API-specific rate limiting
- **Implementation**: Route `/api/*` to subdomain

### **Phase 3: Real-time Services (Month 2-3)**

- **Add**: `ws.health.andernet.dev`
- **Purpose**: Dedicated WebSocket connections for fall monitoring
- **Benefits**: Lower latency, dedicated Durable Objects
- **Critical For**: Real-time fall detection alerts

### **Phase 4: Emergency Services (Month 3-4)**

- **Add**: `emergency.health.andernet.dev`
- **Purpose**: High-priority emergency response APIs
- **Benefits**: Isolated scaling, enhanced security monitoring
- **Critical For**: Fall detection emergency alerts

### **Phase 5: Multi-tenant (Month 4-6)**

- **Add**: `caregiver.health.andernet.dev`
- **Add**: `files.health.andernet.dev`
- **Purpose**: Caregiver access control, large file handling
- **Benefits**: Role-based access, optimized file operations

## ⚙️ Technical Implementation Options

### **Option A: Single Worker (Current)**

```toml
# All subdomains → health-app-worker
[env.production.routes]
pattern = "*.health.andernet.dev/*"
zone_name = "andernet.dev"
````

**Pros**: Simpler deployment, shared resources, easier development
**Cons**: Single point of failure, less granular scaling

### **Option B: Multiple Workers (Recommended for Scale)**

```bash
# Separate wrangler.toml configs per subdomain
wrangler.api.toml      → api.health.andernet.dev
wrangler.ws.toml       → ws.health.andernet.dev
wrangler.emergency.toml → emergency.health.andernet.dev
```

**Pros**: Independent scaling, isolated failures, specialized optimization
**Cons**: More complex deployment, resource duplication

## 🔒 Security & Compliance Considerations

### **HIPAA/Health Data Requirements**

- **Subdomain Isolation**: Separate sensitive health data APIs
- **Emergency Services**: Dedicated domain for critical alerts
- **Audit Logging**: Per-subdomain analytics and monitoring

### **DNS & Certificate Strategy**

```bash
# Cloudflare DNS Records (when ready to deploy)
health.andernet.dev          CNAME → health-app.workers.dev
api.health.andernet.dev      CNAME → health-api.workers.dev
ws.health.andernet.dev       CNAME → health-ws.workers.dev
emergency.health.andernet.dev CNAME → health-emergency.workers.dev
```

## 🕐 When to Configure Each Subdomain

### **Immediate (Development)**

- ✅ **Main domain**: `health.andernet.dev` (already configured)
- ✅ **Environment variables**: API endpoints ready in config

### **Before Beta Launch**

- 🎯 **API subdomain**: `api.health.andernet.dev`
- 🎯 **WebSocket subdomain**: `ws.health.andernet.dev`

### **Before Production Launch**

- 🚨 **Emergency subdomain**: `emergency.health.andernet.dev`
- 📊 **Files subdomain**: `files.health.andernet.dev`

### **Post-Launch Scaling**

- 👥 **Caregiver subdomain**: `caregiver.health.andernet.dev`
- 🔧 **Admin subdomain**: `admin.health.andernet.dev` (future)

## 📋 Action Items by Phase

### **Current Phase (MVP)**

- [x] Configure primary domain in wrangler.toml
- [x] Set up environment variables for all future endpoints
- [ ] Purchase/configure primary domain
- [ ] Set up Cloudflare zone

### **Phase 2 (API Separation)**

- [ ] Create separate API worker deployment
- [ ] Configure `api.health.andernet.dev` DNS
- [ ] Update client to use API subdomain
- [ ] Implement subdomain-based CORS

### **Phase 3+ (Specialized Services)**

- [ ] Deploy WebSocket-specific worker
- [ ] Configure emergency response subdomain
- [ ] Set up file upload/download subdomain
- [ ] Implement multi-tenant caregiver access

## 🎯 Recommendation

**Start with single worker** (current setup) for MVP, then **migrate to subdomains** as features mature. Your current `wrangler.toml` is already configured with all necessary environment variables for future subdomain deployment.

The configuration is **future-ready** - you can deploy immediately with the main domain and add subdomains incrementally as traffic and feature complexity grow.
