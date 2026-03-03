# 📱 Health & LiDAR Explorer

> **A portfolio project exploring iOS development with HealthKit and LiDAR sensors**

[![Portfolio](https://img.shields.io/badge/Project-Portfolio-blue.svg)]()
[![iOS](https://img.shields.io/badge/iOS-16+-black.svg)](https://developer.apple.com/ios/)
[![Swift](https://img.shields.io/badge/Swift-5.0+-orange.svg)](https://developer.apple.com/swift/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**🎯 Project Goal:** Learn iOS development, HealthKit integration, and LiDAR/computer vision through hands-on experimentation.

## 🧪 What This Project Explores

This is a learning-focused project that combines:

- **iOS Native Development**: SwiftUI, HealthKit framework, Core Motion
- **HealthKit Integration**: Reading and syncing health data from Apple Health
- **LiDAR & Computer Vision**: Using iPhone's depth sensors for posture and gait analysis
- **Web Dashboard**: React-based visualization of health metrics
- **Cloudflare Edge**: Serverless API with Workers, KV, and R2

### Key Features

- 📊 **Health Data Visualization**: Import and display Apple Health metrics
- 🚶 **Gait Analysis**: Real-time walking pattern analysis using sensors
- 📱 **iOS HealthKit Bridge**: Native Swift app for secure data access
- 🌐 **Web Dashboard**: Interactive React interface for health insights
- 🔄 **Real-time Sync**: WebSocket-based live data streaming

## 🛠️ Technology Stack

### iOS Application
- **Swift & SwiftUI** - Native iOS interface
- **HealthKit** - Secure health data access
- **Core Motion** - Sensor data collection
- **LiDAR APIs** - Depth sensing and posture detection

### Web Application
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS v4** for styling
- **TanStack Query** for state management

### Backend
- **Cloudflare Workers** - Serverless edge API
- **Hono** - Lightweight API framework
- **Cloudflare KV/R2** - Data storage
- **WebSocket Server** - Real-time data streaming

## 🚀 Quick Start

### Web Application

```bash
# Install dependencies
npm install

# Start development servers
npm run dev          # React app on http://localhost:5173
npm run cf:dev       # Cloudflare Worker on http://localhost:8787
npm run ws:dev       # WebSocket server on ws://localhost:3001
```

### iOS Application (Mac required)

```bash
# Open the Xcode project
open ios/Andernet-Posture/Andernet\ Posture.xcodeproj

# Or navigate to ios/ folder and open in Xcode
```

**Requirements:**
- macOS with Xcode 15+
- iOS device with HealthKit support (simulator won't work)
- Apple Developer account for device testing

### Docker (Optional)

```bash
# Run worker + websocket services
docker compose up --build -d

# Access services
# - Worker: http://localhost:8789
# - WebSocket: ws://localhost:3001

# View logs
docker compose logs -f
```

## 📖 What I Learned

### iOS Development
- HealthKit permission models and privacy considerations
- SwiftUI state management and reactive patterns
- Core Motion sensor data processing
- Network framework for reliable data transmission

### Computer Vision
- LiDAR depth data interpretation
- Real-time posture detection algorithms
- Gait pattern recognition from sensor data
- Coordinate system transformations

### Web Development
- React 19 with Server Components
- TypeScript for type-safe development
- Cloudflare Workers edge computing
- WebSocket real-time communication

### Performance Optimization
- Bundle size optimization (~187KB gzipped)
- Lazy loading and code splitting
- Edge caching strategies
- Real-time data streaming patterns

## 🏗️ Architecture

```text
┌─────────────────┐         ┌──────────────────┐
│   iOS App       │         │  React Web App   │
│   (HealthKit    │◄───────►│  (Dashboard)     │
│    + LiDAR)     │         │                  │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌──────────────────────────────────────────────┐
│         Cloudflare Workers (API)             │
│  ┌─────────────┐      ┌──────────────────┐  │
│  │   Health    │      │   Real-time      │  │
│  │  Analytics  │      │   WebSocket      │  │
│  └─────────────┘      └──────────────────┘  │
└──────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Cloudflare KV  │         │  Cloudflare R2  │
│  (JSON Data)    │         │  (Files)        │
└─────────────────┘         └─────────────────┘
```

## 📂 Project Structure

```text
health/
├── ios/                      # iOS Swift application
│   └── Andernet-Posture/    # Xcode project
├── src/                      # React web application
│   ├── components/          # UI components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities and services
├── server/                   # WebSocket server
├── docs/                     # Documentation
└── scripts/                  # Build and automation scripts
```

## 🎯 Project Goals

### ✅ Completed
- ✅ Basic HealthKit data reading
- ✅ React dashboard with health charts
- ✅ Cloudflare Workers API deployment
- ✅ WebSocket real-time streaming
- ✅ iOS app with sensor data collection

### 🚧 In Progress
- 🔄 Advanced gait analysis algorithms
- 🔄 LiDAR-based posture detection
- 🔄 Enhanced data visualization

### 📋 Future Exploration
- 📅 Apple Watch companion app
- 📅 Core ML model integration
- 📅 Advanced computer vision features
- 📅 Long-term health trend analysis

## 🧰 Development Tools

- **Xcode** - iOS development
- **VS Code** - Web development
- **Docker** - Local development environment
- **GitHub Actions** - CI/CD pipelines
- **Cloudflare** - Edge deployment platform

## 📊 Performance

- **Bundle Size**: ~187KB gzipped (optimized with aggressive code splitting)
- **API Response**: Sub-100ms via edge computing
- **Real-time Updates**: WebSocket with automatic reconnection
- **iOS Performance**: Optimized sensor data processing

## 📄 Documentation

- **[iOS Setup Guide](docs/IOS_DEPLOYMENT_GUIDE.md)** - Complete iOS setup
- **[Architecture](docs/architecture/ARCHITECTURE.md)** - System design overview
- **[API Docs](docs/architecture/API.md)** - REST endpoints
- **[WebSocket Guide](docs/architecture/WEBSOCKETS.md)** - Real-time communication

## 🤝 Contributing

This is primarily a personal learning project, but feedback and suggestions are welcome! Feel free to:

- Open issues for bugs or questions
- Submit pull requests for improvements
- Share ideas for features to explore

### Development Setup

```bash
# Prerequisites
node >= 18.0.0
npm >= 9.0.0
macOS with Xcode 15+ (for iOS development)
```

## 📄 License

MIT License - feel free to learn from and adapt this code for your own projects.

## 🙏 Acknowledgments

- Apple's HealthKit and Core Motion frameworks
- Cloudflare Workers platform
- React and TypeScript communities
- Open source projects that made this possible

---

**Note**: This is a learning/portfolio project focused on exploring iOS development and sensor integration. It is not intended for production use or clinical applications.
