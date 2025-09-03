# VitalSense Monitor - Advanced Fall Risk & Gait Analysis

A comprehensive Swift iOS application that specializes in fall risk assessment, gait analysis, and walking behavior monitoring for medical data collection and analysis. VitalSense Monitor extends the VitalSense platform to mobile devices, providing real-time health monitoring capabilities.

## 🎯 Core Features

### Fall Risk Assessment

- **Comprehensive Risk Scoring**: Multi-factor analysis using walking speed, gait asymmetry, balance metrics
- **Real-time Risk Monitoring**: Continuous assessment with threshold-based alerts
- **Medical-Grade Analysis**: Clinical-standard fall risk categorization (Low/Moderate/High/Critical)
- **Risk Factor Identification**: Detailed analysis of contributing factors with recommendations

### Gait Analysis & Walking Behavior

- **Advanced Gait Metrics**: Walking speed, step length, asymmetry, double support time
- **Stair Navigation Analysis**: Ascent/descent speed assessment for mobility evaluation
- **Walking Pattern Recognition**: Normal, irregular, asymmetric, and unstable pattern detection
- **Balance Assessment**: Dynamic stability scoring with 0-10 scale evaluation

### Apple Watch Integration

- **Real-time Gait Monitoring**: CoreMotion integration for step detection and stability analysis
- **Watch-to-iPhone Data Sync**: Seamless data transmission via WatchConnectivity
- **Background Monitoring**: Continuous gait tracking during daily activities
- **Workout Session Integration**: HealthKit workout sessions for accurate data collection

### Data Transmission & Analysis

- **Medical Data Streaming**: Real-time transmission of gait analysis to external systems
- **WebSocket Architecture**: Robust connection management with fallback modes
- **Structured Data Payloads**: Comprehensive JSON format for medical analysis systems
- **Privacy-Compliant**: Full HealthKit privacy compliance and user consent management

## 🏥 Medical Applications

This application is designed for:

- **Fall Prevention Programs**: Early identification of mobility decline
- **Physical Therapy Monitoring**: Progress tracking during rehabilitation
- **Elderly Care Management**: Continuous mobility assessment for aging populations
- **Clinical Research**: Data collection for gait and mobility studies
- **Remote Patient Monitoring**: Healthcare provider access to mobility trends

## � Project Structure

This project follows Swift best practices with a feature-based architecture. For detailed information about the project organization, see [Documentation/PROJECT_STRUCTURE.md](Documentation/PROJECT_STRUCTURE.md).

### Key Directories

- `HealthKitBridge/Core/` - Core managers, models, and extensions
- `HealthKitBridge/Features/` - Feature-based modules (FallRisk, GaitAnalysis, HealthDashboard, AppleWatch)
- `HealthKitBridge/UI/` - User interface components and views
- `Documentation/` - All project documentation and guides
- `Build/` - Build configurations and automation
- `Tools/` - Development utilities and test servers

## �📱 User Interface

### Main Dashboard

- Fall risk overview with risk level indicators
- Real-time gait metrics display
- Daily mobility trends visualization
- Data transmission status monitoring

### Fall Risk Dashboard (`FallRiskGaitDashboardView`)

- Comprehensive fall risk assessment display
- Detailed gait analysis metrics
- Balance assessment visualization
- Daily mobility activity tracking
- Medical-grade risk factor analysis

### Apple Watch App

- Real-time gait monitoring interface
- Step count and cadence tracking
- Stability score visualization
- Quick stats and settings management

## 🔧 Technical Architecture

### Core Components

#### `FallRiskGaitManager`

- **Purpose**: Central manager for fall risk and gait analysis
- **Key Features**:
  - HealthKit gait data collection
  - Fall risk score calculation
  - Balance assessment algorithms
  - Daily mobility trend analysis

#### `GaitAnalysisModels`

- **Purpose**: Comprehensive data models for medical analysis
- **Components**:
  - `GaitMetrics`: Walking speed, step length, asymmetry metrics
  - `FallRiskScore`: Risk assessment with contributing factors
  - `BalanceAssessment`: Dynamic balance evaluation
  - `DailyMobilityTrends`: Activity level and mobility patterns

#### `AppleWatchGaitMonitor`

- **Purpose**: Real-time gait monitoring on Apple Watch
- **Features**:
  - CoreMotion integration for device motion analysis
  - Step detection algorithms
  - Stability assessment
  - Watch-to-iPhone data synchronization

#### `WebSocketManager` (Enhanced)

- **Purpose**: Medical data transmission to analysis systems
- **New Methods**:
  - `sendGaitAnalysis()`: Comprehensive gait analysis transmission
  - `sendRealtimeGaitData()`: Real-time streaming for monitoring
  - `sendFallRiskAssessment()`: Fall risk evaluation results

### Data Flow

1. **Collection**: Apple Watch collects motion data via CoreMotion
2. **Analysis**: `FallRiskGaitManager` processes data for medical insights
3. **Assessment**: Fall risk algorithms evaluate mobility patterns
4. **Transmission**: WebSocket manager sends structured data to analysis systems
5. **Visualization**: SwiftUI interfaces display medical-grade assessments

## ⚕️ Medical Metrics

### Gait Analysis Parameters

- **Walking Speed**: Normal range 1.2-1.4 m/s, clinical significance for mobility assessment
- **Step Length**: Average stride measurement for gait symmetry evaluation
- **Walking Asymmetry**: Percentage deviation (<3% normal) for balance assessment
- **Double Support Time**: Ground contact phase (20-25% normal) for stability evaluation
- **Stair Navigation**: Ascent/descent speeds for functional mobility assessment

### Fall Risk Factors

- **Gait Speed Decline**: Primary indicator of fall risk in older adults
- **Balance Impairment**: Dynamic stability during walking activities
- **Mobility Limitations**: Reduced daily activity and movement patterns
- **Gait Asymmetry**: Uneven walking patterns indicating instability

### Assessment Scales

- **Fall Risk Score**: 1.0-4.0 scale (Low → Critical risk levels)
- **Balance Assessment**: 0-10 point clinical assessment scale
- **Mobility Status**: Excellent → Impaired classification system

## 🚀 Getting Started

### Prerequisites

- iOS 16.0+ (for advanced HealthKit gait metrics)
- watchOS 9.0+ (for Apple Watch gait monitoring)
- Xcode 15.0+
- Swift 5.9+
- HealthKit-enabled device with motion sensors

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd HealthKitBridge
   ```

2. **Setup development environment:**

   ```bash
   ./setup-enhanced-dev-env.sh
   ```

3. **Configure medical data endpoints:**

   ```bash
   # Edit HealthKitBridge/Config.plist
   vim HealthKitBridge/Config.plist
   ```

4. **Build and run:**

   ```bash
   # For iOS Simulator
   make build-ios
   
   # For Apple Watch Simulator
   make build-watch
   
   # For device deployment
   make deploy-device
   ```

## 📊 Data Transmission Format

### Gait Analysis Payload

```json
{
  "type": "gait_analysis",
  "data": {
    "userId": "user-identifier",
    "deviceId": "device-identifier", 
    "timestamp": "2024-01-15T10:30:00Z",
    "gaitMetrics": {
      "averageWalkingSpeed": 1.25,
      "averageStepLength": 0.65,
      "walkingAsymmetry": 2.1,
      "doubleSupportTime": 22.5,
      "stairAscentSpeed": 0.8,
      "stairDescentSpeed": 0.7,
      "mobilityStatus": "good"
    },
    "fallRiskAssessment": {
      "overallScore": 1.8,
      "riskLevel": "Low Risk",
      "riskFactors": [
        {
          "name": "Walking Speed",
          "score": 1.2,
          "severity": "low",
          "description": "Walking speed within normal range"
        }
      ],
      "recommendations": [
        "Continue current activity level",
        "Regular walking for maintenance"
      ]
    },
    "balanceAssessment": {
      "score": 8.5,
      "maxScore": 10.0,
      "balanceLevel": "good",
      "indicators": []
    }
  }
}
```

### Real-time Gait Data

```json
{
  "type": "realtime_gait",
  "data": {
    "userId": "user-identifier",
    "timestamp": "2024-01-15T10:30:15Z",
    "stepCount": 1247,
    "stepCadence": 118.5,
    "stabilityScore": 8.2,
    "walkingPattern": "normal",
    "sessionDuration": 600.0
  }
}
```

## 🏗️ Development

### Build Targets

- **iOS App**: Main application with fall risk dashboard
- **Apple Watch App**: Real-time gait monitoring companion
- **HealthKit Extension**: Background health data collection

### Testing

```bash
# Run all tests
make test

# Run specific test suites
make test-gait-analysis
make test-fall-risk
make test-watch-connectivity
```

### Performance Monitoring

- **Battery Optimization**: Adaptive sampling rates based on device state
- **Data Efficiency**: Compressed transmission for bandwidth optimization  
- **Background Processing**: Efficient HealthKit background app refresh

## 🔒 Privacy & Compliance

### HealthKit Permissions

- Precise gait metrics require explicit user consent
- Granular permission control for each health data type
- Optional data sharing with clear user understanding

### Data Handling

- **Local Processing**: All analysis performed on-device when possible
- **Minimal Transmission**: Only essential medical data transmitted
- **Encryption**: End-to-end encryption for all data transmission
- **User Control**: Full user control over data sharing preferences

## 📋 Medical Disclaimer

This application is designed for research and monitoring purposes. All medical assessments and fall risk evaluations should be reviewed by qualified healthcare professionals. The app does not replace professional medical evaluation or clinical assessment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/medical-enhancement`)
3. Commit changes (`git commit -am 'Add medical feature'`)
4. Push to branch (`git push origin feature/medical-enhancement`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For medical application support or integration questions:

- Open an issue on GitHub
- Contact: [medical-support@healthkitbridge.dev]
- Documentation: [https://docs.healthkitbridge.dev]

---

**Built for medical professionals, researchers, and healthcare organizations focused on fall prevention and mobility assessment.**
    <string>https://your-api-server.com</string>
    <key>WS_URL</key>
    <string>wss://your-websocket-server.com/ws</string>
</dict>

```

## Health Data Types

The app requests permission for:
- Heart Rate
- Step Count
- Walking/Running Distance
- Active Energy Burned
- Basal Energy Burned

## Architecture

- **HealthKitManager**: Handles HealthKit authorization and data queries
- **WebSocketManager**: Manages WebSocket connections with automatic reconnection
- **AppConfig**: Centralized configuration management
- **ConnectionQualityMonitor**: Tracks connection performance metrics

## Building and Running

### Using Xcode
1. Open `HealthKitBridge.xcodeproj`
2. Select your target device
3. Build and run (⌘+R)

### Using Scripts
```bash
# Build and run on device
./scripts/build-and-run.sh

# Deploy to specific device
./deploy-to-device.sh
```

## Testing

The app includes comprehensive test coverage:

```bash
# Run unit tests
xcodebuild test -scheme HealthKitBridge -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild test -scheme HealthKitBridgeUITests -destination 'platform=iOS Simulator,name=iPhone 15'
```

## WebSocket Protocol

The app communicates using JSON messages:

```json
{
  "type": "health_data",
  "data": {
    "type": "heart_rate",
    "value": 72.0,
    "unit": "count/min",
    "timestamp": "2025-08-31T12:00:00Z",
    "deviceId": "device-uuid",
    "userId": "user-id"
  }
}
```

## Privacy & Permissions

This app:

- Requests minimal necessary HealthKit permissions
- Only accesses data when actively monitoring
- Respects user privacy settings
- Provides clear permission dialogs

## Development Tools

- **SwiftLint**: Code style and quality enforcement
- **Build Scripts**: Automated building and deployment
- **Xcode Optimizations**: Performance tuning for faster builds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and SwiftLint
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the code comments for implementation details
