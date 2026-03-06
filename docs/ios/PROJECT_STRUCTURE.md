# VitalSense Monitor - Project Structure

## 📁 Project Organization

This project follows Swift and iOS development best practices with a feature-based architecture that promotes maintainability, testability, and scalability. VitalSense Monitor is a medical-grade iOS application for fall risk assessment and gait analysis.

## 🏗️ Directory Structure

```text
HealthKitBridge/
├── Documentation/                  # All project documentation
│   ├── CHANGELOG.md               # Version history and changes
│   ├── PROJECT_STRUCTURE.md       # This file - project organization guide
│   ├── WATCH_INTEGRATION_GUIDE.md # Apple Watch setup instructions
│   ├── INTEGRATION_STATUS.md      # Integration status tracking
│   ├── MIGRATION_GUIDE.md         # Migration instructions
│   ├── ORGANIZATION_SUMMARY.md    # Project organization summary
│   ├── REBRANDING_SUMMARY.md      # VitalSense Monitor rebranding details
│   ├── BUNDLE_ID_UPDATE.md        # Bundle ID update documentation
│   ├── DOCKER_USAGE.md            # Docker usage guidelines for iOS development
│   └── copilot-instructions.md    # GitHub Copilot development guidelines
│
├── HealthKitBridge/               # Main iOS application source code
│   ├── Core/                      # Core foundational components
│   │   ├── Managers/              # Singleton service managers
│   │   │   ├── HealthKitManager.swift          # HealthKit data access
│   │   │   ├── WebSocketManager.swift          # Real-time data transmission
│   │   │   ├── BackgroundTaskManager.swift     # Background processing
│   │   │   ├── BatteryOptimizationManager.swift # Power management
│   │   │   ├── DataCacheManager.swift          # Local data caching
│   │   │   ├── OfflineDataSyncManager.swift    # Offline sync handling
│   │   │   ├── PerformanceMonitor.swift        # App performance tracking
│   │   │   ├── SmartNotificationManager.swift  # Intelligent notifications
│   │   │   ├── SecurityManager.swift           # Security and encryption
│   │   │   └── ApiClient.swift                 # External API communication
│   │   │
│   │   ├── Models/                # Data models and structures
│   │   │   ├── GaitAnalysisModels.swift        # Gait analysis data structures
│   │   │   └── AdvancedHealthMetrics.swift     # Health metrics models
│   │   │
│   │   └── Extensions/            # Swift language extensions
│   │       └── HealthKitExtensions.swift       # HealthKit framework extensions
│   │
│   ├── Features/                  # Feature-based modules
│   │   ├── FallRisk/              # Fall risk assessment
│   │   │   ├── FallRiskAnalysisEngine.swift    # Fall risk calculation engine
│   │   │   └── FallRiskDashboardView.swift     # Fall risk UI dashboard
│   │   │
│   │   ├── GaitAnalysis/          # Gait analysis and monitoring
│   │   │   ├── FallRiskGaitManager.swift       # Main gait analysis coordinator
│   │   │   └── FallRiskGaitDashboardView.swift # Gait analysis UI
│   │   │
│   │   ├── HealthDashboard/       # Health data visualization
│   │   │   ├── AdvancedHealthDashboardView.swift # Main health dashboard
│   │   │   ├── HealthAnalyticsEngine.swift      # Health data analytics
│   │   │   ├── AdvancedHealthAnalytics.swift    # Advanced analytics
│   │   │   └── AdvancedHealthIntegration.swift  # Health data integration
│   │   │
│   │   └── AppleWatch/            # Apple Watch integration
│   │       ├── AppleWatchGaitMonitor.swift     # Watch-based gait monitoring
│   │       ├── iPhoneWatchBridge.swift         # iPhone-Watch communication
│   │       └── WatchApp.swift                  # Watch app main structure
│   │
│   ├── UI/                        # User interface components
│   │   ├── Views/                 # SwiftUI views
│   │   │   └── ContentView.swift               # Main app view
│   │   │
│   │   └── Components/            # Reusable UI components
│   │       ├── ModernDesignSystem.swift        # Design system components
│   │       ├── AppShortcuts.swift              # iOS app shortcuts
│   │       └── HealthKitBridgeWidget.swift     # iOS widget implementation
│   │
│   ├── Configuration/             # App configuration
│   │   ├── AppConfig.swift                     # Basic app configuration
│   │   └── EnhancedAppConfig.swift             # Advanced configuration
│   │
│   ├── Resources/                 # Resource files
│   │   ├── Config.plist                        # Basic configuration settings
│   │   ├── Config-Enhanced.plist               # Enhanced configuration
│   │   ├── HealthKitBridge.entitlements        # App capabilities and permissions
│   │   └── Assets.xcassets/                    # Images, colors, and visual assets
│   │
│   ├── scripts/                   # Build and development scripts
│   │   ├── Check-SwiftErrors.ps1               # PowerShell error checking
│   │   ├── create-xcode-project.sh             # Xcode project creation
│   │   ├── setup-xcode.sh                      # Xcode environment setup
│   │   ├── swift-error-check.sh                # Swift error validation
│   │   └── swift-lint.sh                       # Swift code linting
│   │
│   └── HealthKitBridgeApp.swift   # Main app entry point and dependency injection
│
├── HealthKitBridgeTests/          # Unit and integration tests
├── HealthKitBridgeUITests/        # UI automation tests
├── HealthKitBridgeWatch/          # Apple Watch app target (if created)
├── HealthKitBridge.xcodeproj/     # Xcode project configuration
│
├── Build/                         # Build configuration and tools
│   ├── BuildOptimizations.xcconfig             # Xcode build optimizations
│   └── Makefile                                # Build automation
│
├── Tools/                         # Development and utility tools
│   ├── generate_app_icons.py                   # App icon generation script
│   ├── test-websocket-server.js                # Node.js test server
│   ├── test-websocket-server.py                # Python test server
│   ├── deploy-to-device.sh                     # Device deployment automation
│   └── setup-enhanced-dev-env.sh               # Development environment setup
│
├── scripts/                       # Project-level scripts
│   ├── build-and-run.sh                        # Build and run automation
│   ├── build-cache-manager.sh                  # Build cache management
│   ├── fast-build.sh                           # Fast build configuration
│   ├── monitor-performance.sh                  # Performance monitoring
│   ├── optimize-xcode.sh                       # Xcode optimization
│   └── setup-dev-env.sh                        # Environment setup
│
├── Backup/                        # Backup files (excluded from builds)
│   ├── Info.plist.backup                       # Configuration backups
│   ├── Makefile.backup                         # Build file backups
│   ├── Info.plist.original.backup              # Original configuration
│   └── Info.plist.simple.backup                # Simple configuration backup
│
├── ProjectInfo/                   # Additional project metadata
├── .github/                       # GitHub configuration
├── .vscode/                       # VS Code configuration
├── README.md                      # Main project documentation
├── LICENSE                        # Project license
├── .gitignore                     # Git ignore rules
├── .swiftlint.yml                 # SwiftLint configuration
└── development.config             # Development settings
```

## 🏛️ Architecture Principles

### 1. **Feature-Based Organization**

- Each major feature (FallRisk, GaitAnalysis, HealthDashboard, AppleWatch) has its own directory
- Related models, views, and logic are co-located
- Promotes feature independence and team scalability

### 2. **Core Foundation**

- **Managers**: Singleton classes handling system-level concerns
- **Models**: Data structures shared across features
- **Extensions**: Framework enhancements and utilities

### 3. **Separation of Concerns**

- **UI Layer**: Views and components for user interaction
- **Business Logic**: Feature-specific logic and processing
- **Data Layer**: Models and persistence management
- **Configuration**: App settings and environment configuration

### 4. **Resource Management**

- **Assets**: Visual resources organized in Asset Catalogs
- **Configuration**: Plist files for different environments
- **Entitlements**: iOS capabilities and permissions

## 🔗 File Relationships and Dependencies

### Core Dependencies

```swift
HealthKitBridgeApp.swift
├── Imports Core/Managers/*
├── Imports Features/*/Manager.swift files
├── Uses Configuration/AppConfig.swift
└── Injects dependencies via SwiftUI environment
```

### Feature Dependencies

```swift
Features/GaitAnalysis/FallRiskGaitManager.swift
├── Uses Core/Managers/HealthKitManager.swift
├── Uses Core/Managers/WebSocketManager.swift
├── Uses Core/Models/GaitAnalysisModels.swift
└── Communicates with Features/AppleWatch/
```

### UI Dependencies

```swift
UI/Views/ContentView.swift
├── Uses Features/*/DashboardView.swift
├── Uses UI/Components/ModernDesignSystem.swift
└── Receives data via @EnvironmentObject managers
```

## 🧪 Testing Structure

### Test Organization

```text
HealthKitBridgeTests/
├── CoreTests/                     # Core functionality tests
├── FeatureTests/                  # Feature-specific tests
│   ├── FallRiskTests/
│   ├── GaitAnalysisTests/
│   └── HealthDashboardTests/
└── UITests/                       # UI component tests

HealthKitBridgeUITests/
├── End-to-end user workflow tests
└── Accessibility and usability tests
```

## 🚀 Build and Development

### Key Files for Development

- **HealthKitBridgeApp.swift**: Main entry point - modify for app-level changes
- **Build/BuildOptimizations.xcconfig**: Build settings and optimizations
- **Tools/**: Utility scripts for development workflow
- **Documentation/copilot-instructions.md**: Development guidelines for AI assistance

### Configuration Management

- **Resources/Config.plist**: Basic app configuration
- **Resources/Config-Enhanced.plist**: Advanced configuration options
- **Configuration/AppConfig.swift**: Swift configuration access layer

## 📱 Platform-Specific Considerations

### iOS App Structure

- Main app target contains all iPhone-specific functionality
- HealthKit integration requires proper entitlements and privacy descriptions
- Background processing configured through BackgroundTaskManager

### Apple Watch Integration

- Features/AppleWatch/ contains all watch-related code
- iPhoneWatchBridge handles communication between devices
- Separate watch app target can be created when needed

## 🔧 Maintenance Guidelines

### Adding New Features

1. Create new directory under `Features/`
2. Follow existing patterns: Manager + Models + Views
3. Update `HealthKitBridgeApp.swift` for dependency injection
4. Add appropriate tests in `HealthKitBridgeTests/`

### Modifying Core Functionality

1. Core changes affect multiple features - test thoroughly
2. Update relevant documentation when changing APIs
3. Consider backward compatibility for data models

### File Linking in Xcode

- Xcode project uses file system synchronization
- Moving files preserves Xcode references automatically
- Check build phases if files don't appear in Xcode

## 🔒 Security and Privacy

### Sensitive Files

- **Resources/HealthKitBridge.entitlements**: Defines app capabilities
- **Core/Managers/SecurityManager.swift**: Handles encryption and security
- **Configuration/**: Contains API keys and configuration (exclude from Git)

### Privacy Considerations

- HealthKit data access requires user consent
- Location and motion data handled with care
- WebSocket transmission uses encryption

---

This structure promotes maintainable, scalable iOS development while following Apple's best practices and Swift community conventions.
