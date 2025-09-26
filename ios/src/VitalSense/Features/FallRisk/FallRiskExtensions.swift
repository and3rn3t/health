import SwiftUI

// MARK: - Extensions for VitalSense Branding

extension FallRiskLevel {
    var vitalSenseColor: Color {
        switch self {
        case .low: return VitalSenseBrand.Colors.success
        case .medium: return VitalSenseBrand.Colors.warning
        case .high: return VitalSenseBrand.Colors.error
        case .unknown: return VitalSenseBrand.Colors.textMuted
        }
    }

    var vitalSenseGradient: LinearGradient {
        switch self {
        case .low: return VitalSenseBrand.Colors.successGradient
        case .medium: return VitalSenseBrand.Colors.warningGradient
        case .high: return VitalSenseBrand.Colors.errorGradient
        case .unknown: return LinearGradient(colors: [VitalSenseBrand.Colors.textMuted], startPoint: .top, endPoint: .bottom)
        }
    }

    var vitalSenseTitle: String {
        switch self {
        case .low: return loc("fall_level_title_low")
        case .medium: return loc("fall_level_title_medium")
        case .high: return loc("fall_level_title_high")
        case .unknown: return loc("fall_level_title_unknown")
        }
    }

    var vitalSenseSubtitle: String {
        switch self {
        case .low: return loc("fall_level_subtitle_low")
        case .medium: return loc("fall_level_subtitle_medium")
        case .high: return loc("fall_level_subtitle_high")
        case .unknown: return loc("fall_level_subtitle_unknown")
        }
    }

    var vitalSenseDescription: String {
        switch self {
        case .low: return loc("fall_level_desc_low")
        case .medium: return loc("fall_level_desc_medium")
        case .high: return loc("fall_level_desc_high")
        case .unknown: return loc("fall_level_desc_unknown")
        }
    }

    var progressValue: Double {
        switch self {
        case .low: return 0.9
        case .medium: return 0.6
        case .high: return 0.3
        case .unknown: return 0.0
        }
    }

    var chartValue: Double {
        switch self {
        case .low: return 1.0
        case .medium: return 2.0
        case .high: return 3.0
        case .unknown: return 0.5
        }
    }
}

extension RecommendationPriority {
    var vitalSenseColor: Color {
        switch self {
        case .low: return VitalSenseBrand.Colors.success
        case .medium: return VitalSenseBrand.Colors.warning
        case .high: return VitalSenseBrand.Colors.error
        }
    }

    var vitalSenseIcon: String {
        switch self {
        case .low: return "checkmark.circle.fill"
        case .medium: return "exclamationmark.triangle.fill"
        case .high: return "exclamationmark.octagon.fill"
        }
    }

    static var allCases: [RecommendationPriority] {
        [.high, .medium, .low]
    }
}

extension FallRiskRecommendationType {
    var vitalSenseIcon: String {
        switch self {
        case .exerciseProgram: return "figure.strengthtraining.traditional"
        case .balanceTraining: return "figure.yoga"
        case .homeModification: return "house.fill"
        case .medicationReview: return "pills.fill"
        case .medicalConsultation: return "stethoscope"
        case .visionCheck: return "eye.fill"
        }
    }

    var displayName: String {
        switch self {
        case .exerciseProgram: return loc("fall_reco_exercise")
        case .balanceTraining: return loc("fall_reco_balance")
        case .homeModification: return loc("fall_reco_home")
        case .medicationReview: return loc("fall_reco_medication")
        case .medicalConsultation: return loc("fall_reco_medical")
        case .visionCheck: return loc("fall_reco_vision")
        }
    }
}
