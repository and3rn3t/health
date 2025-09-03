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
        case .low: return "Excellent Safety"
        case .medium: return "Moderate Risk"
        case .high: return "High Risk Alert"
        case .unknown: return "Assessment Needed"
        }
    }

    var vitalSenseSubtitle: String {
        switch self {
        case .low: return "Your mobility and balance indicators look great"
        case .medium: return "Some areas for improvement identified"
        case .high: return "Immediate attention recommended"
        case .unknown: return "Complete an assessment to get insights"
        }
    }

    var vitalSenseDescription: String {
        switch self {
        case .low: return "Low Risk"
        case .medium: return "Moderate Risk"
        case .high: return "High Risk"
        case .unknown: return "Unknown"
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
        case .exerciseProgram: return "Exercise Program"
        case .balanceTraining: return "Balance Training"
        case .homeModification: return "Home Safety"
        case .medicationReview: return "Medication Review"
        case .medicalConsultation: return "Medical Consultation"
        case .visionCheck: return "Vision Check"
        }
    }
}
