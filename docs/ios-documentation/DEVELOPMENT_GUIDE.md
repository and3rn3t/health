# VitalSense Monitor - Development Guide

## 📚 **Complete Documentation Index**

Welcome to VitalSense Monitor development! This guide provides a complete overview of all project documentation organized for easy navigation.

---

## 🏗️ **Project Foundation**

### **Core Documentation**

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Complete project organization and architecture
- **[ORGANIZATION_SUMMARY.md](./ORGANIZATION_SUMMARY.md)** - High-level project summary
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration instructions and best practices

### **Project History & Updates**

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and feature changes
- **[REBRANDING_SUMMARY.md](./REBRANDING_SUMMARY.md)** - Complete rebranding from HealthKit Bridge to VitalSense Monitor
- **[BUNDLE_ID_UPDATE.md](./BUNDLE_ID_UPDATE.md)** - Bundle identifier updates (`dev.andernet.vitalsense.monitor`)

---

## 🔧 **Development Setup**

### **Environment Configuration**

- **[DOCKER_USAGE.md](./DOCKER_USAGE.md)** - Docker guidelines for iOS development (backend services only)
- **[INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md)** - Current integration and feature status

### **Apple Watch Development**

- **[WATCH_INTEGRATION_GUIDE.md](./WATCH_INTEGRATION_GUIDE.md)** - Complete Apple Watch setup and integration

### **AI-Assisted Development**

- **[copilot-instructions.md](./copilot-instructions.md)** - GitHub Copilot guidelines and medical domain knowledge

---

## 🎯 **Quick Start Guide**

### 1. **Understanding the Project**

Start with → **[REBRANDING_SUMMARY.md](./REBRANDING_SUMMARY.md)** to understand the project identity and scope.

### 2. **Project Architecture**

Read → **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** for complete code organization and architecture patterns.

### 3. **Development Environment**

- Review → **[DOCKER_USAGE.md](./DOCKER_USAGE.md)** for backend services setup
- Check → **[BUNDLE_ID_UPDATE.md](./BUNDLE_ID_UPDATE.md)** for proper bundle configuration

### 4. **Feature Development**

- Follow → **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** for adding new features
- Use → **[copilot-instructions.md](./copilot-instructions.md)** for AI-assisted development

### 5. **Apple Watch Integration**

Implement → **[WATCH_INTEGRATION_GUIDE.md](./WATCH_INTEGRATION_GUIDE.md)** for Watch connectivity.

---

## 📱 **VitalSense Monitor Overview**

**VitalSense Monitor** is a medical-grade iOS application specializing in:

- **Fall Risk Assessment** - Comprehensive gait analysis and mobility monitoring
- **Apple Watch Integration** - Real-time motion sensor data collection
- **WebSocket Communication** - Live data transmission to healthcare systems
- **Clinical Data Standards** - HIPAA-aware medical data handling

### **Bundle ID Structure**

```text
Main App:     dev.andernet.vitalsense.monitor
Unit Tests:   dev.andernet.vitalsense.monitor.tests
UI Tests:     dev.andernet.vitalsense.monitor.uitests
```

### **Key Technologies**

- **Swift 5.9+** with SwiftUI (iOS 16.0+)
- **HealthKit + CoreMotion** for medical data
- **WatchConnectivity** for iPhone-Watch communication
- **WebSocket** for real-time data transmission

---

## 🔗 **Documentation Connections**

All documentation files are interconnected and cross-referenced:

- **Architecture** → [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) links to feature guides
- **Setup** → [DOCKER_USAGE.md](./DOCKER_USAGE.md) references integration status
- **Updates** → [REBRANDING_SUMMARY.md](./REBRANDING_SUMMARY.md) connects to bundle ID changes
- **Development** → [copilot-instructions.md](./copilot-instructions.md) references all technical docs

---

## 💡 **Next Steps**

1. **New Developer?** Start with [REBRANDING_SUMMARY.md](./REBRANDING_SUMMARY.md) → [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. **Adding Features?** Use [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) → [copilot-instructions.md](./copilot-instructions.md)
3. **Watch Development?** Follow [WATCH_INTEGRATION_GUIDE.md](./WATCH_INTEGRATION_GUIDE.md)
4. **Backend Services?** Configure via [DOCKER_USAGE.md](./DOCKER_USAGE.md)

---

*All documentation files are located in `Documentation/` and maintain consistent cross-references and links.*
