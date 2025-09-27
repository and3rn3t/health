import SwiftUI
import Foundation

// MARK: - Auto Gradient Generator (Emergency Restoration)
/// Core auto-gradient generation engine for iOS 26 features
@available(iOS 16.0, *)
struct AutoGradientGenerator {
    
    // MARK: - Health Metric Gradients
    
    /// Generates gradient based on health metric value and type
    static func healthMetricGradient(value: Double, type: HealthMetricType) -> LinearGradient {
        switch type {
        case .heartRate:
            return heartRateGradient(heartRate: Int(value))
        case .bloodPressure:
            return bloodPressureGradient(systolic: Int(value))
        case .oxygenSaturation:
            return oxygenSaturationGradient(percentage: value)
        case .sleepScore:
            return sleepScoreGradient(score: value)
        case .stepsCount:
            return stepsGradient(steps: Int(value))
        }
    }
    
    // MARK: - Specialized Health Gradients
    
    static func heartRateGradient(heartRate: Int) -> LinearGradient {
        switch heartRate {
        case 0..<50:
            return LinearGradient(colors: [Color.blue.opacity(0.6), Color.cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 50..<60:
            return LinearGradient(colors: [Color.green.opacity(0.7), Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 60..<100:
            return LinearGradient(colors: [Color.green, Color.yellow], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 100..<150:
            return LinearGradient(colors: [Color.orange, Color.red.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color.red, Color.pink], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    static func bloodPressureGradient(systolic: Int) -> LinearGradient {
        switch systolic {
        case 0..<90:
            return LinearGradient(colors: [Color.blue, Color.cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 90..<120:
            return LinearGradient(colors: [Color.green, Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 120..<140:
            return LinearGradient(colors: [Color.yellow, Color.orange], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color.red, Color.pink], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    static func oxygenSaturationGradient(percentage: Double) -> LinearGradient {
        switch percentage {
        case 0..<95:
            return LinearGradient(colors: [Color.red, Color.orange], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 95..<98:
            return LinearGradient(colors: [Color.yellow, Color.green], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color.green, Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    static func sleepScoreGradient(score: Double) -> LinearGradient {
        switch score {
        case 0..<5:
            return LinearGradient(colors: [Color.red.opacity(0.7), Color.orange], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 5..<7:
            return LinearGradient(colors: [Color.orange, Color.yellow], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 7..<8.5:
            return LinearGradient(colors: [Color.green, Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color.mint, Color.cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    static func stepsGradient(steps: Int) -> LinearGradient {
        let progress = Double(steps) / 10000.0
        switch progress {
        case 0..<0.25:
            return LinearGradient(colors: [Color.red.opacity(0.6), Color.orange.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 0.25..<0.5:
            return LinearGradient(colors: [Color.orange, Color.yellow], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 0.5..<0.75:
            return LinearGradient(colors: [Color.yellow, Color.green], startPoint: .topLeading, endPoint: .bottomTrailing)
        case 0.75..<1.0:
            return LinearGradient(colors: [Color.green, Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color.mint, Color.cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
}

// MARK: - Supporting Types
enum HealthMetricType {
    case heartRate, bloodPressure, oxygenSaturation, sleepScore, stepsCount
}
