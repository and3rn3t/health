import SwiftUI
import Foundation

// MARK: - Auto Gradient Contextual System (Protected Restoration)
/// Provides context-aware auto gradients that adapt to user patterns, environment, and health data
@available(iOS 16.0, *)
struct AutoGradientContextualSystem {
    
    // MARK: - Circadian Rhythm Auto Gradients
    
    static func circadianAutoGradient(for date: Date = Date()) -> LinearGradient {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)
        
        switch hour {
        case 5..<9: // Morning
            return LinearGradient(
                colors: [Color(red: 0.4, green: 0.7, blue: 0.9), Color(red: 0.6, green: 0.8, blue: 0.9)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 9..<16: // Daytime
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.8, blue: 0.3), Color(red: 0.8, green: 0.6, blue: 0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case 16..<20: // Evening
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.5, blue: 0.3), Color(red: 0.6, green: 0.3, blue: 0.5)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        default: // Night
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.2, blue: 0.4), Color(red: 0.1, green: 0.1, blue: 0.3)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Activity Level Auto Gradients
    
    static func activityIntensityGradient(intensity: ActivityIntensity) -> LinearGradient {
        switch intensity {
        case .resting:
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.3, blue: 0.6), Color(red: 0.1, green: 0.2, blue: 0.5)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .light:
            return LinearGradient(
                colors: [Color(red: 0.3, green: 0.6, blue: 0.4), Color(red: 0.2, green: 0.5, blue: 0.3)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .moderate:
            return LinearGradient(
                colors: [Color(red: 0.8, green: 0.6, blue: 0.2), Color(red: 0.7, green: 0.5, blue: 0.1)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .vigorous:
            return LinearGradient(
                colors: [Color(red: 0.9, green: 0.3, blue: 0.1), Color(red: 0.8, green: 0.2, blue: 0.0)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .peak:
            return LinearGradient(
                colors: [Color(red: 1.0, green: 0.1, blue: 0.1), Color(red: 0.9, green: 0.0, blue: 0.0)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Workout Phase Auto Gradients
    
    static func workoutPhaseGradient(phase: WorkoutPhase, intensity: Double = 0.5) -> LinearGradient {
        let intensityMultiplier = max(0.3, min(1.0, intensity))
        
        switch phase {
        case .warmUp:
            return LinearGradient(
                colors: [
                    Color(red: 0.3, green: 0.7 * intensityMultiplier, blue: 0.5),
                    Color(red: 0.2, green: 0.6 * intensityMultiplier, blue: 0.4)
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .active:
            return LinearGradient(
                colors: [
                    Color(red: 0.9 * intensityMultiplier, green: 0.5, blue: 0.1),
                    Color(red: 0.8 * intensityMultiplier, green: 0.3, blue: 0.0)
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .peak:
            return LinearGradient(
                colors: [
                    Color(red: 1.0 * intensityMultiplier, green: 0.2, blue: 0.1),
                    Color(red: 0.9 * intensityMultiplier, green: 0.1, blue: 0.0)
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .recovery:
            return LinearGradient(
                colors: [
                    Color(red: 0.4, green: 0.6, blue: 0.8 * intensityMultiplier),
                    Color(red: 0.3, green: 0.5, blue: 0.7 * intensityMultiplier)
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        case .coolDown:
            return LinearGradient(
                colors: [Color(red: 0.2, green: 0.4, blue: 0.6), Color(red: 0.1, green: 0.3, blue: 0.5)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Supporting Enums
enum ActivityIntensity: CaseIterable {
    case resting, light, moderate, vigorous, peak
    
    var description: String {
        switch self {
        case .resting: return "Resting"
        case .light: return "Light Activity"
        case .moderate: return "Moderate Activity" 
        case .vigorous: return "Vigorous Activity"
        case .peak: return "Peak Performance"
        }
    }
}

enum WorkoutPhase: CaseIterable {
    case warmUp, active, peak, recovery, coolDown
    
    var description: String {
        switch self {
        case .warmUp: return "Warm Up"
        case .active: return "Active"
        case .peak: return "Peak Intensity"
        case .recovery: return "Recovery"
        case .coolDown: return "Cool Down"
        }
    }
}
