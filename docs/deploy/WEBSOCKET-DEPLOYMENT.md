# 🚀 WebSocket Server Production Deployment Guide

## 🎯 Quick Deploy Options

### 🚂 Railway (Recommended - Fastest)

**Best for**: Quick deployment with minimal setup

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Deploy (from server directory)
cd server
railway login
railway deploy
```

**Pros**:

- ✅ Free tier available
- ✅ Automatic HTTPS/WSS
- ✅ Easy domain setup
- ✅ Good WebSocket support

**Expected URL**: `wss://vitalsense-websocket-production.up.railway.app`

---

### 🪰 Fly.io (Recommended - Production)

**Best for**: Production-grade deployment with excellent performance

```bash
# 1. Install Fly CLI
# Download from: https://fly.io/docs/getting-started/installing-flyctl/

# 2. Deploy (from server directory)
cd server
fly auth login
fly launch
fly deploy
```

**Pros**:

- ✅ Excellent WebSocket support
- ✅ Global edge deployment
- ✅ Built-in monitoring
- ✅ Custom domains

**Expected URL**: `wss://vitalsense-websocket.fly.dev`

---

### ▲ Vercel (Limited WebSocket Support)

**Best for**: Quick testing (limited WebSocket functionality)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy (from server directory)
cd server
vercel login
vercel --prod
```

**Pros**:

- ✅ Very fast deployment
- ✅ Good for API endpoints

**Cons**:

- ⚠️ Limited WebSocket support (serverless limitations)

---

### 🎨 Render (Manual Setup)

**Best for**: Simple deployment with UI

1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `NODE_ENV=production`

**Pros**:

- ✅ Good WebSocket support
- ✅ Easy UI-based deployment
- ✅ Free tier available

---

## 🏃‍♂️ Quick Start (Railway - Fastest)

```powershell
# Run the deployment script
.\scripts\deploy-websocket-server.ps1 -Platform railway

# Or manual deployment:
cd server
npm install -g @railway/cli
railway login
railway deploy
```

## 📱 iOS App Configuration

After deployment, update your iOS app:

1. **Get the WebSocket URL** from your deployment platform
2. **Update Config.plist**:

   ```xml
   <key>WS_URL</key>
   <string>wss://your-deployment-url.com</string>
   <key>API_BASE_URL</key>
   <string>https://your-deployment-url.com/api</string>
   ```

3. **Build & install** on your iOS device
4. **Test the connection** remotely!

## 🧪 Testing Remote Connection

Once deployed, your iOS app can:

- ✅ Connect from anywhere with internet
- ✅ Stream real health data in real-time
- ✅ Test full WebSocket functionality
- ✅ Validate production-ready performance

## 🔧 Platform Comparison

| Platform | WebSocket Support | Setup Difficulty | Free Tier | Custom Domain |
| -------- | ----------------- | ---------------- | --------- | ------------- |
| Railway  | ✅ Excellent      | 🟢 Easy          | ✅ Yes    | ✅ Yes        |
| Fly.io   | ✅ Excellent      | 🟡 Medium        | ✅ Yes    | ✅ Yes        |
| Vercel   | ⚠️ Limited        | 🟢 Easy          | ✅ Yes    | ✅ Yes        |
| Render   | ✅ Good           | 🟢 Easy          | ✅ Yes    | ✅ Yes        |

## 🎯 Recommendation

**For immediate testing**: Use **Railway** - it's the fastest to deploy and has excellent WebSocket support.

**For production**: Use **Fly.io** - it offers the best performance and global edge deployment.

Would you like me to help you deploy to one of these platforms?
