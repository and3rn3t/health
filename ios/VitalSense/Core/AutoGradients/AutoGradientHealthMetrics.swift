import SwiftUI
import Foundation

// MARK: - Auto Gradient Health Metrics (Emergency Restoration)
/// Health-specific auto-gradient implementations for medical monitoring scenarios
@available(iOS 16.0, *)
struct AutoGradientHealthMetrics {
    
    // MARK: - Heart Rate Zone Gradients
    
    static func heartRateZoneGradient(heartRate: Int) -> LinearGradient {
        switch heartRate {
        case 0..<50: // Bradycardia
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.4, blue: 0.8), Color(red: 0.3, green: 0.6, blue: 0.9)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 50..<60: // Below normal
            return LinearGradient(
                colors: [Color(red: 0.3, green: 0.6, blue: 0.7), Color(red: 0.4, green: 0.7, blue: 0.8)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 60..<100: // Normal range
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.7, blue: 0.3), Color(red: 0.3, green: 0.8, blue: 0.4)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 100..<150: // Elevated
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.6, blue: 0.2), Color(red: 0.8, green: 0.5, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Tachycardia
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.2, blue: 0.2), Color(red: 0.8, green: 0.1, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Step Progress Gradients
    
    static func stepProgressGradient(current: Int, goal: Int = 10000) -> LinearGradient {
        let progress = Double(current) / Double(goal)
        
        switch progress {
        case 0..<0.25:
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.3, blue: 0.3), Color(red: 0.7, green: 0.2, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 0.25..<0.5:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.6, blue: 0.2), Color(red: 0.8, green: 0.5, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 0.5..<0.75:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.8, blue: 0.2), Color(red: 0.8, green: 0.7, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 0.75..<1.0:
            return LinearGradient(
                colors: [Color(red: 0.4, green: 0.8, blue: 0.3), Color(red: 0.3, green: 0.7, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Over goal
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.8, blue: 0.6), Color(red: 0.1, green: 0.7, blue: 0.5)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Sleep Quality Gradients
    
    static func sleepQualityGradient(hours: Double) -> LinearGradient {
        switch hours {
        case 0..<5: // Poor sleep
            return LinearGradient(
                colors: [Color(red: 0.6, green: 0.2, blue: 0.4), Color(red: 0.5, green: 0.1, blue: 0.3)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 5..<6.5: // Fair sleep
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.5, blue: 0.3), Color(red: 0.7, green: 0.4, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 6.5..<8.5: // Good sleep
            return LinearGradient(
                colors: [Color(red: 0.3, green: 0.6, blue: 0.8), Color(red: 0.2, green: 0.5, blue: 0.7)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Excellent sleep
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.7, blue: 0.9), Color(red: 0.1, green: 0.6, blue: 0.8)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - VitalSense Health Score Gradients
    
    static func vitalSenseHealthScoreGradient(score: Double) -> LinearGradient {
        switch score {
        case 0..<30: // Critical
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.1, blue: 0.1), Color(red: 0.8, green: 0.0, blue: 0.0)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 30..<50: // Poor
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.4, blue: 0.2), Color(red: 0.8, green: 0.3, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 50..<70: // Fair
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.7, blue: 0.2), Color(red: 0.8, green: 0.6, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 70..<85: // Good
            return LinearGradient(
                colors: [Color(red: 0.4, green: 0.8, blue: 0.3), Color(red: 0.3, green: 0.7, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 85..<95: // Very Good
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.8, blue: 0.5), Color(red: 0.1, green: 0.7, blue: 0.4)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Excellent (95+)
            return LinearGradient(
                colors: [Color(red: 0.1, green: 0.8, blue: 0.8), Color(red: 0.0, green: 0.7, blue: 0.7)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Alert Severity Gradients
    
    static func alertSeverityGradient(severity: AlertSeverity) -> LinearGradient {
        switch severity {
        case .info:
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.6, blue: 0.9), Color(red: 0.1, green: 0.5, blue: 0.8)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .warning:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.7, blue: 0.2), Color(red: 0.8, green: 0.6, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .critical:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.2, blue: 0.2), Color(red: 0.8, green: 0.1, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .success:
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.8, blue: 0.4), Color(red: 0.1, green: 0.7, blue: 0.3)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Device Connection Gradients
    
    static func deviceConnectionGradient(signalStrength: Double) -> LinearGradient {
        switch signalStrength {
        case 0..<0.3: // Poor connection
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.3, blue: 0.3), Color(red: 0.7, green: 0.2, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 0.3..<0.7: // Fair connection
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.6, blue: 0.2), Color(red: 0.8, green: 0.5, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Strong connection
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.8, blue: 0.4), Color(red: 0.1, green: 0.7, blue: 0.3)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Supporting Alert Severity Enum
enum AlertSeverity: CaseIterable {
    case info, warning, critical, success
    
    var description: String {
        switch self {
        case .info: return "Info"
        case .warning: return "Warning"
        case .critical: return "Critical"
        case .success: return "Success"
        }
    }
}
