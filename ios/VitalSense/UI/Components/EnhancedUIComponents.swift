import SwiftUI
import Foundation

// MARK: - Enhanced UI Components with Auto Gradient Integration (Protected Restoration)
/// Enhanced UI components with Auto Gradient integration support
@available(iOS 16.0, *)
struct EnhancedUIComponents {
    
    // MARK: - Enhanced Metric Card with Auto Gradients
    
    struct EnhancedMetricCard: View {
        let title: String
        let value: String
        let subtitle: String?
        let icon: String
        let healthMetric: HealthMetricType?
        let metricValue: Double?
        let traditionalGradient: LinearGradient?
        let useAutoGradient: Bool
        
        // Auto-gradient enabled initializer
        init(
            title: String,
            value: String,
            subtitle: String? = nil,
            icon: String,
            healthMetric: HealthMetricType,
            metricValue: Double,
            useAutoGradient: Bool = true
        ) {
            self.title = title
            self.value = value
            self.subtitle = subtitle
            self.icon = icon
            self.healthMetric = healthMetric
            self.metricValue = metricValue
            self.traditionalGradient = nil
            self.useAutoGradient = useAutoGradient
        }
        
        // Traditional gradient initializer
        init(
            title: String,
            value: String,
            subtitle: String? = nil,
            icon: String,
            gradient: LinearGradient
        ) {
            self.title = title
            self.value = value
            self.subtitle = subtitle
            self.icon = icon
            self.healthMetric = nil
            self.metricValue = nil
            self.traditionalGradient = gradient
            self.useAutoGradient = false
        }
        
        var body: some View {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(.white)
                    Spacer()
                }
                
                Text(value)
                    .font(.title.bold())
                    .foregroundColor(.white)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(autoGradientBackground)
            .cornerRadius(12)
            .shadow(radius: 4)
        }
        
        @ViewBuilder
        private var autoGradientBackground: some View {
            if useAutoGradient, let healthMetric = healthMetric, let metricValue = metricValue {
                AutoGradientGenerator.healthMetricGradient(value: metricValue, type: healthMetric)
            } else if let traditionalGradient = traditionalGradient {
                traditionalGradient
            } else {
                // Fallback gradient
                LinearGradient(
                    colors: [Color.blue, Color.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
    }
    
    // MARK: - Enhanced Connection Status with Auto Gradients
    
    struct EnhancedConnectionStatus: View {
        let deviceName: String
        let connectionStrength: Double
        let isConnected: Bool
        let useAutoGradient: Bool
        
        init(deviceName: String, connectionStrength: Double, isConnected: Bool = true, useAutoGradient: Bool = true) {
            self.deviceName = deviceName
            self.connectionStrength = connectionStrength
            self.isConnected = isConnected
            self.useAutoGradient = useAutoGradient
        }
        
        var body: some View {
            HStack {
                Image(systemName: connectionIcon)
                    .font(.title3)
                    .foregroundColor(.white)
                
                VStack(alignment: .leading) {
                    Text(deviceName)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(connectionStatusText)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                // Connection strength bars
                HStack(spacing: 2) {
                    ForEach(0..<4) { index in
                        Rectangle()
                            .frame(width: 3, height: CGFloat(8 + index * 3))
                            .foregroundColor(
                                connectionStrength > Double(index) * 0.25 
                                    ? .white 
                                    : .white.opacity(0.3)
                            )
                    }
                }
            }
            .padding()
            .background(connectionAutoGradient)
            .cornerRadius(10)
        }
        
        @ViewBuilder
        private var connectionAutoGradient: some View {
            if useAutoGradient {
                AutoGradientHealthMetrics.deviceConnectionGradient(signalStrength: connectionStrength)
            } else {
                LinearGradient(
                    colors: [Color.gray, Color.gray.opacity(0.7)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
        
        private var connectionIcon: String {
            if !isConnected { return "wifi.slash" }
            return connectionStrength > 0.7 ? "wifi" : connectionStrength > 0.3 ? "wifi.slash" : "wifi.exclamationmark"
        }
        
        private var connectionStatusText: String {
            if !isConnected { return "Disconnected" }
            switch connectionStrength {
            case 0.8...1.0: return "Excellent"
            case 0.6..<0.8: return "Good"
            case 0.4..<0.6: return "Fair"
            case 0.2..<0.4: return "Poor"
            default: return "Very Poor"
            }
        }
    }
    
    // MARK: - Alert Card with Auto Gradients
    
    struct AlertCard: View {
        let title: String
        let message: String
        let severity: AlertSeverity
        let useAutoGradient: Bool
        let onDismiss: (() -> Void)?
        
        // Auto-gradient enabled initializer
        init(
            title: String,
            message: String,
            severity: AlertSeverity,
            useAutoGradient: Bool = true,
            onDismiss: (() -> Void)? = nil
        ) {
            self.title = title
            self.message = message
            self.severity = severity
            self.useAutoGradient = useAutoGradient
            self.onDismiss = onDismiss
        }
        
        var body: some View {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: alertIcon)
                            .font(.title3)
                            .foregroundColor(.white)
                        Text(title)
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    Text(message)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                Spacer()
                
                if let onDismiss = onDismiss {
                    Button(action: onDismiss) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
            .padding()
            .background(alertAutoGradientBackground)
            .cornerRadius(12)
            .shadow(radius: 3)
        }
        
        @ViewBuilder
        private var alertAutoGradientBackground: some View {
            if useAutoGradient {
                AutoGradientHealthMetrics.alertSeverityGradient(severity: severity)
            } else {
                LinearGradient(
                    colors: [Color.gray, Color.gray.opacity(0.8)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
        
        private var alertIcon: String {
            switch severity {
            case .info: return "info.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .critical: return "exclamationmark.octagon.fill"
            case .success: return "checkmark.circle.fill"
            }
        }
    }
}

// MARK: - Auto Gradient View Modifiers

@available(iOS 16.0, *)
extension View {
    /// Applies health metric auto gradient background
    func autoHealthGradient(metric: HealthMetricType, value: Double) -> some View {
        self.background(
            AutoGradientGenerator.healthMetricGradient(value: value, type: metric)
        )
    }
    
    /// Applies connection status auto gradient background
    func autoConnectionGradient(signalStrength: Double) -> some View {
        self.background(
            AutoGradientHealthMetrics.deviceConnectionGradient(signalStrength: signalStrength)
        )
    }
    
    /// Applies alert severity auto gradient background
    func autoAlertGradient(severity: AlertSeverity) -> some View {
        self.background(
            AutoGradientHealthMetrics.alertSeverityGradient(severity: severity)
        )
    }
    
    /// Applies VitalSense health score auto gradient background
    func autoVitalSenseGradient(score: Double) -> some View {
        self.background(
            AutoGradientHealthMetrics.vitalSenseHealthScoreGradient(score: score)
        )
    }
}

// MARK: - Preview Examples

@available(iOS 16.0, *)
struct EnhancedUIComponents_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            // Enhanced Metric Cards with Auto Gradients
            HStack(spacing: 12) {
                EnhancedUIComponents.EnhancedMetricCard(
                    title: "Heart Rate",
                    value: "72",
                    subtitle: "BPM",
                    icon: "heart.fill",
                    healthMetric: .heartRate,
                    metricValue: 72
                )
                
                EnhancedUIComponents.EnhancedMetricCard(
                    title: "Steps",
                    value: "8,543",
                    subtitle: "Today",
                    icon: "figure.walk",
                    healthMetric: .stepsCount,
                    metricValue: 8543
                )
            }
            
            // Enhanced Connection Status
            EnhancedUIComponents.EnhancedConnectionStatus(
                deviceName: "Apple Watch",
                connectionStrength: 0.85,
                isConnected: true
            )
            
            // Alert Cards with Auto Gradients
            VStack(spacing: 8) {
                EnhancedUIComponents.AlertCard(
                    title: "Health Update",
                    message: "Your daily health summary is ready to view",
                    severity: .info
                )
                
                EnhancedUIComponents.AlertCard(
                    title: "Low Activity Alert",
                    message: "You've been sitting for 2 hours. Time to move!",
                    severity: .warning,
                    onDismiss: {}
                )
                
                EnhancedUIComponents.AlertCard(
                    title: "Heart Rate Alert",
                    message: "Unusually high heart rate detected (150 BPM)",
                    severity: .critical,
                    onDismiss: {}
                )
            }
        }
        .padding()
        .previewDisplayName("Enhanced UI Components with Auto Gradients")
    }
}
