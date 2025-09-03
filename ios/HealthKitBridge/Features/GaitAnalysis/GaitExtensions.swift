import SwiftUI

// MARK: - VitalSense Extensions for Gait Analysis

extension GaitMetricType {
    var displayName: String {
        switch self {
        case .walkingSpeed: return "Walking Speed"
        case .stepLength: return "Step Length"
        case .cadence: return "Cadence"
        case .symmetry: return "Symmetry"
        case .doubleSupportTime: return "Support Time"
        case .stepWidth: return "Step Width"
        }
    }

    var unit: String {
        switch self {
        case .walkingSpeed: return "m/s"
        case .stepLength: return "cm"
        case .cadence: return "steps/min"
        case .symmetry: return "%"
        case .doubleSupportTime: return "%"
        case .stepWidth: return "cm"
        }
    }

    var vitalSenseIcon: String {
        switch self {
        case .walkingSpeed: return "speedometer"
        case .stepLength: return "ruler"
        case .cadence: return "metronome"
        case .symmetry: return "scale.3d"
        case .doubleSupportTime: return "timer"
        case .stepWidth: return "arrow.left.and.right"
        }
    }

    var vitalSenseGradient: LinearGradient {
        switch self {
        case .walkingSpeed: return VitalSenseBrand.Colors.primaryGradient
        case .stepLength: return VitalSenseBrand.Colors.accentGradient
        case .cadence: return VitalSenseBrand.Colors.successGradient
        case .symmetry: return VitalSenseBrand.Colors.warningGradient
        case .doubleSupportTime: return VitalSenseBrand.Colors.infoGradient
        case .stepWidth: return VitalSenseBrand.Colors.neutralGradient
        }
    }

    var vitalSenseColor: Color {
        switch self {
        case .walkingSpeed: return VitalSenseBrand.Colors.primary
        case .stepLength: return VitalSenseBrand.Colors.accent
        case .cadence: return VitalSenseBrand.Colors.success
        case .symmetry: return VitalSenseBrand.Colors.warning
        case .doubleSupportTime: return VitalSenseBrand.Colors.info
        case .stepWidth: return VitalSenseBrand.Colors.textSecondary
        }
    }

    static var allCases: [GaitMetricType] {
        [.walkingSpeed, .stepLength, .cadence, .symmetry, .doubleSupportTime, .stepWidth]
    }
}

enum TrendDirection {
    case up, down, neutral

    var vitalSenseIcon: String {
        switch self {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .neutral: return "minus"
        }
    }

    var vitalSenseColor: Color {
        switch self {
        case .up: return VitalSenseBrand.Colors.success
        case .down: return VitalSenseBrand.Colors.error
        case .neutral: return VitalSenseBrand.Colors.textMuted
        }
    }
}

enum GaitMetricType {
    case walkingSpeed
    case stepLength
    case cadence
    case symmetry
    case doubleSupportTime
    case stepWidth
}
