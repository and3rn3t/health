import SwiftUI
import HealthKit

// MARK: - iOS26 Auto Gradient Integration Showcase (Protected Restoration)
/// Comprehensive integration of Auto Gradients throughout VitalSense app
@available(iOS 16.0, *)
struct iOS26AutoGradientIntegration {
    
    // MARK: - Auto Gradient Health Dashboard
    
    struct AutoGradientHealthDashboard: View {
        let healthScore: Double
        let heartRate: Int
        let stepCount: Int
        let sleepHours: Double
        
        var body: some View {
            VStack(spacing: 20) {
                // Main Health Score with Auto Gradient
                VStack {
                    Text("VitalSense Health Score")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("\(Int(healthScore))")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(height: 120)
                .frame(maxWidth: .infinity)
                .background(
                    AutoGradientHealthMetrics.vitalSenseHealthScoreGradient(score: healthScore)
                )
                .cornerRadius(16)
                
                HStack(spacing: 16) {
                    // Heart Rate Card with Auto Gradient
                    VStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.white)
                        Text("\(heartRate)")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                        Text("BPM")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .frame(height: 100)
                    .frame(maxWidth: .infinity)
                    .background(
                        AutoGradientHealthMetrics.heartRateZoneGradient(heartRate: heartRate)
                    )
                    .cornerRadius(12)
                    
                    // Steps Card with Auto Gradient
                    VStack {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.white)
                        Text("\(stepCount)")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                        Text("Steps")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .frame(height: 100)
                    .frame(maxWidth: .infinity)
                    .background(
                        AutoGradientHealthMetrics.stepProgressGradient(current: stepCount, goal: 10000)
                    )
                    .cornerRadius(12)
                }
                
                // Sleep Quality with Auto Gradient
                HStack {
                    Image(systemName: "bed.double.fill")
                        .foregroundColor(.white)
                        .font(.title2)
                    VStack(alignment: .leading) {
                        Text("Sleep Quality")
                            .font(.headline)
                            .foregroundColor(.white)
                        Text("\(sleepHours, specifier: "%.1f") hours")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    Spacer()
                    Text(sleepQualityText(hours: sleepHours))
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(8)
                }
                .padding()
                .background(
                    AutoGradientHealthMetrics.sleepQualityGradient(hours: sleepHours)
                )
                .cornerRadius(12)
            }
            .padding()
        }
        
        private func sleepQualityText(hours: Double) -> String {
            switch hours {
            case 0..<5: return "Poor"
            case 5..<6.5: return "Fair"
            case 6.5..<8.5: return "Good"
            default: return "Excellent"
            }
        }
    }
    
    // MARK: - Auto Gradient Watch Components
    
    struct AutoGradientWatchComponents: View {
        let activityIntensity: ActivityIntensity
        let workoutPhase: WorkoutPhase
        let connectionStrength: Double
        
        var body: some View {
            VStack(spacing: 12) {
                // Activity Ring with Auto Gradient
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: activityProgress)
                        .stroke(
                            AngularGradient(
                                gradient: gradientFromActivityIntensity(),
                                center: .center,
                                startAngle: .degrees(-90),
                                endAngle: .degrees(270)
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 80, height: 80)
                
                // Workout Phase Indicator
                Text(workoutPhase.description)
                    .font(.caption.bold())
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        AutoGradientContextualSystem.workoutPhaseGradient(phase: workoutPhase)
                    )
                    .cornerRadius(8)
                
                // Connection Status with Auto Gradient
                HStack {
                    Image(systemName: connectionIconName)
                        .foregroundColor(.white)
                    Text(connectionStatusText)
                        .font(.caption)
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(
                    AutoGradientHealthMetrics.deviceConnectionGradient(signalStrength: connectionStrength)
                )
                .cornerRadius(6)
            }
        }
        
        private var activityProgress: Double {
            switch activityIntensity {
            case .resting: return 0.1
            case .light: return 0.3
            case .moderate: return 0.6
            case .vigorous: return 0.8
            case .peak: return 1.0
            }
        }
        
        private func gradientFromActivityIntensity() -> Gradient {
            return Gradient(colors: [Color.blue, Color.green, Color.yellow, Color.red])
        }
        
        private var connectionIconName: String {
            connectionStrength > 0.7 ? "wifi" : connectionStrength > 0.3 ? "wifi.slash" : "wifi.exclamationmark"
        }
        
        private var connectionStatusText: String {
            connectionStrength > 0.7 ? "Strong" : connectionStrength > 0.3 ? "Weak" : "Poor"
        }
    }
    
    // MARK: - Auto Gradient Notification Banner
    
    struct AutoGradientNotificationBanner: View {
        let alertSeverity: AlertSeverity
        let title: String
        let message: String
        
        var body: some View {
            HStack {
                VStack(alignment: .leading) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(message)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.leading)
                }
                Spacer()
                Button(action: {}) {
                    Image(systemName: "xmark")
                        .foregroundColor(.white)
                        .font(.caption)
                }
            }
            .padding()
            .background(
                AutoGradientHealthMetrics.alertSeverityGradient(severity: alertSeverity)
            )
            .cornerRadius(12)
            .shadow(radius: 4)
        }
    }
}

// MARK: - Auto Gradient Preview Examples

@available(iOS 16.0, *)
struct iOS26AutoGradientIntegration_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Health Dashboard Preview
            iOS26AutoGradientIntegration.AutoGradientHealthDashboard(
                healthScore: 85,
                heartRate: 72,
                stepCount: 8543,
                sleepHours: 7.5
            )
            .previewDisplayName("Auto Gradient Health Dashboard")
            
            // Watch Components Preview
            VStack(spacing: 20) {
                iOS26AutoGradientIntegration.AutoGradientWatchComponents(
                    activityIntensity: .moderate,
                    workoutPhase: .active,
                    connectionStrength: 0.8
                )
                iOS26AutoGradientIntegration.AutoGradientWatchComponents(
                    activityIntensity: .vigorous,
                    workoutPhase: .peak,
                    connectionStrength: 0.4
                )
            }
            .padding()
            .previewDisplayName("Auto Gradient Watch Components")
            
            // Notification Banner Previews
            VStack(spacing: 12) {
                iOS26AutoGradientIntegration.AutoGradientNotificationBanner(
                    alertSeverity: .info,
                    title: "Health Update",
                    message: "Your daily health summary is ready"
                )
                iOS26AutoGradientIntegration.AutoGradientNotificationBanner(
                    alertSeverity: .warning,
                    title: "Low Activity",
                    message: "You've been sitting for 2 hours. Time to move!"
                )
                iOS26AutoGradientIntegration.AutoGradientNotificationBanner(
                    alertSeverity: .critical,
                    title: "Heart Rate Alert",
                    message: "Unusually high heart rate detected (150 BPM)"
                )
            }
            .padding()
            .previewDisplayName("Auto Gradient Notification Banners")
        }
    }
}

// MARK: - Auto Gradient Integration Extensions

@available(iOS 16.0, *)
extension View {
    /// Applies comprehensive auto gradient based on health context
    func autoHealthContextGradient(
        score: Double,
        activity: ActivityIntensity = .light,
        time: Date = Date()
    ) -> some View {
        self.background(
            ZStack {
                // Base circadian gradient
                AutoGradientContextualSystem.circadianAutoGradient(for: time)
                    .opacity(0.3)
                
                // Health score overlay
                AutoGradientHealthMetrics.vitalSenseHealthScoreGradient(score: score)
                    .opacity(0.7)
                
                // Activity overlay
                AutoGradientContextualSystem.activityIntensityGradient(intensity: activity)
                    .opacity(0.4)
            }
        )
    }
}
