//
//  ProgressMetric.swift
//  Andernet Posture
//
//  Defines the catalogue of trackable metrics for the Progress History view,
//  organised by clinical category.
//

import Foundation

// MARK: - Metric Category

/// Top-level grouping shown as horizontally scrolling pills.
enum MetricCategory: String, CaseIterable, Identifiable {
    case posture    = "Posture"
    case gait       = "Gait"
    case rom        = "ROM"
    case balance    = "Balance"
    case risk       = "Risk"
    case clinical   = "Clinical"
    case ergonomic  = "Ergonomic"
    case smoothness = "Smoothness"
    case frailty    = "Frailty"

    var id: String { rawValue }

    /// SF Symbol for the category pill.
    var icon: String {
        switch self {
        case .posture:    return "figure.stand"
        case .gait:       return "figure.walk"
        case .rom:        return "arrow.up.and.down.and.arrow.left.and.right"
        case .balance:    return "gyroscope"
        case .risk:       return "exclamationmark.triangle.fill"
        case .clinical:   return "stethoscope"
        case .ergonomic:  return "desktopcomputer"
        case .smoothness: return "waveform.path.ecg"
        case .frailty:    return "heart.text.clipboard"
        }
    }
}

// MARK: - Progress Metric

/// A single metric that can be tracked across sessions over time.
struct ProgressMetric: Identifiable, Hashable {
    let id: String
    let displayName: String
    let unit: String
    let category: MetricCategory
    let icon: String
    /// When true, a higher value is treated as improvement (green delta).
    let higherIsBetter: Bool
    /// Extracts the metric value from a session. Returns nil when unavailable.
    let extractor: (GaitSession) -> Double?

    // Hashable / Equatable by id only (closures can't be compared)
    static func == (lhs: ProgressMetric, rhs: ProgressMetric) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

// MARK: - Full Catalogue

extension ProgressMetric {

    /// Every trackable numeric metric on `GaitSession`, organised by category.
    static let all: [ProgressMetric] =
        posture + gait + rom + balance
        + risk + clinical + ergonomic
        + smoothness + frailty

    // MARK: Posture

    static let posture: [ProgressMetric] = [
        .init(
            id: "postureScore", displayName: "Posture Score",
            unit: "", category: .posture, icon: "figure.stand",
            higherIsBetter: true
        ) { $0.postureScore },
        .init(
            id: "averageTrunkLeanDeg", displayName: "Trunk Lean",
            unit: "°", category: .posture, icon: "arrow.up.forward",
            higherIsBetter: false
        ) { $0.averageTrunkLeanDeg },
        .init(
            id: "peakTrunkLeanDeg", displayName: "Peak Trunk Lean",
            unit: "°", category: .posture,
            icon: "arrow.up.forward.circle",
            higherIsBetter: false
        ) { $0.peakTrunkLeanDeg },
        .init(
            id: "averageLateralLeanDeg", displayName: "Lateral Lean",
            unit: "°", category: .posture,
            icon: "arrow.left.arrow.right",
            higherIsBetter: false
        ) { $0.averageLateralLeanDeg },
        .init(
            id: "averageCVADeg", displayName: "CVA (Head Position)",
            unit: "°", category: .posture, icon: "angle",
            higherIsBetter: true
        ) { $0.averageCVADeg },
        .init(
            id: "averageSVACm",
            displayName: "SVA (Sagittal Balance)",
            unit: "cm", category: .posture, icon: "ruler",
            higherIsBetter: false
        ) { $0.averageSVACm },
        .init(
            id: "averageThoracicKyphosis",
            displayName: "Thoracic Kyphosis",
            unit: "°", category: .posture, icon: "person.bust",
            higherIsBetter: false
        ) { $0.averageThoracicKyphosisDeg },
        .init(
            id: "averageLumbarLordosis",
            displayName: "Lumbar Lordosis",
            unit: "°", category: .posture, icon: "person.bust",
            higherIsBetter: false
        ) { $0.averageLumbarLordosisDeg },
        .init(
            id: "shoulderAsymmetry",
            displayName: "Shoulder Asymmetry",
            unit: "cm", category: .posture,
            icon: "arrow.left.arrow.right",
            higherIsBetter: false
        ) { $0.averageShoulderAsymmetryCm },
        .init(
            id: "pelvicObliquity",
            displayName: "Pelvic Obliquity",
            unit: "°", category: .posture,
            icon: "arrow.up.and.down",
            higherIsBetter: false
        ) { $0.averagePelvicObliquityDeg },
        .init(
            id: "coronalDeviation",
            displayName: "Coronal Deviation",
            unit: "cm", category: .posture,
            icon: "arrow.left.and.right",
            higherIsBetter: false
        ) { $0.averageCoronalDeviationCm }
    ]

    // MARK: Gait

    static let gait: [ProgressMetric] = [
        .init(
            id: "cadence", displayName: "Cadence",
            unit: "SPM", category: .gait, icon: "metronome.fill",
            higherIsBetter: true
        ) { $0.averageCadenceSPM },
        .init(
            id: "strideLength", displayName: "Stride Length",
            unit: "m", category: .gait, icon: "ruler.fill",
            higherIsBetter: true
        ) { $0.averageStrideLengthM },
        .init(
            id: "walkingSpeed", displayName: "Walking Speed",
            unit: "m/s", category: .gait, icon: "speedometer",
            higherIsBetter: true
        ) { $0.averageWalkingSpeedMPS },
        .init(
            id: "stepWidth", displayName: "Step Width",
            unit: "cm", category: .gait,
            icon: "arrow.left.and.right",
            higherIsBetter: false
        ) { $0.averageStepWidthCm },
        .init(
            id: "gaitAsymmetry", displayName: "Gait Asymmetry",
            unit: "%", category: .gait,
            icon: "arrow.left.arrow.right",
            higherIsBetter: false
        ) { $0.gaitAsymmetryPercent },
        .init(
            id: "stanceTime", displayName: "Stance Time",
            unit: "%", category: .gait, icon: "figure.stand",
            higherIsBetter: false
        ) { $0.averageStanceTimePercent },
        .init(
            id: "swingTime", displayName: "Swing Time",
            unit: "%", category: .gait, icon: "figure.walk",
            higherIsBetter: true
        ) { $0.averageSwingTimePercent },
        .init(
            id: "doubleSupport", displayName: "Double Support",
            unit: "%", category: .gait, icon: "shoeprints.fill",
            higherIsBetter: false
        ) { $0.averageDoubleSupportPercent },
        .init(
            id: "strideTimeVariability",
            displayName: "Stride Variability",
            unit: "CV", category: .gait, icon: "waveform.path",
            higherIsBetter: false
        ) { $0.strideTimeVariabilityCV }
    ]

    // MARK: ROM

    static let rom: [ProgressMetric] = [
        .init(
            id: "hipROM", displayName: "Hip ROM",
            unit: "°", category: .rom, icon: "figure.walk",
            higherIsBetter: true
        ) { $0.averageHipROMDeg },
        .init(
            id: "kneeROM", displayName: "Knee ROM",
            unit: "°", category: .rom, icon: "figure.walk",
            higherIsBetter: true
        ) { $0.averageKneeROMDeg },
        .init(
            id: "trunkRotation", displayName: "Trunk Rotation",
            unit: "°", category: .rom,
            icon: "arrow.triangle.2.circlepath",
            higherIsBetter: true
        ) { $0.trunkRotationRangeDeg },
        .init(
            id: "armSwingAsymmetry",
            displayName: "Arm Swing Asymmetry",
            unit: "%", category: .rom,
            icon: "arrow.left.arrow.right",
            higherIsBetter: false
        ) { $0.armSwingAsymmetryPercent }
    ]

    // MARK: Balance

    static let balance: [ProgressMetric] = [
        .init(
            id: "swayVelocity", displayName: "Sway Velocity",
            unit: "mm/s", category: .balance, icon: "gyroscope",
            higherIsBetter: false
        ) { $0.averageSwayVelocityMMS },
        .init(
            id: "swayArea", displayName: "Sway Area",
            unit: "cm²", category: .balance,
            icon: "circle.dashed",
            higherIsBetter: false
        ) { $0.swayAreaCm2 }
    ]

    // MARK: Risk

    static let risk: [ProgressMetric] = [
        .init(
            id: "fallRisk", displayName: "Fall Risk Score",
            unit: "", category: .risk,
            icon: "exclamationmark.triangle.fill",
            higherIsBetter: false
        ) { $0.fallRiskScore },
        .init(
            id: "upperCrossed", displayName: "Upper Crossed",
            unit: "", category: .risk,
            icon: "person.crop.circle.badge.exclamationmark",
            higherIsBetter: false
        ) { $0.upperCrossedScore },
        .init(
            id: "lowerCrossed", displayName: "Lower Crossed",
            unit: "", category: .risk,
            icon: "person.crop.circle.badge.exclamationmark",
            higherIsBetter: false
        ) { $0.lowerCrossedScore },
        .init(
            id: "fatigueIndex", displayName: "Fatigue Index",
            unit: "", category: .risk,
            icon: "battery.25percent",
            higherIsBetter: false
        ) { $0.fatigueIndex },
        .init(
            id: "postureVarSD",
            displayName: "Posture Variability",
            unit: "SD", category: .risk, icon: "waveform.path",
            higherIsBetter: false
        ) { $0.postureVariabilitySD }
    ]

    // MARK: Clinical

    static let clinical: [ProgressMetric] = [
        .init(
            id: "sixMinuteWalk",
            displayName: "6-Min Walk Distance",
            unit: "m", category: .clinical,
            icon: "figure.walk.circle",
            higherIsBetter: true
        ) { $0.sixMinuteWalkDistanceM },
        .init(
            id: "tugTime", displayName: "TUG Time",
            unit: "s", category: .clinical, icon: "timer",
            higherIsBetter: false
        ) { $0.tugTimeSec },
        .init(
            id: "rombergRatio", displayName: "Romberg Ratio",
            unit: "", category: .clinical, icon: "figure.stand",
            higherIsBetter: false
        ) { $0.rombergRatio },
        .init(
            id: "walkRatio", displayName: "Walk Ratio",
            unit: "", category: .clinical, icon: "figure.walk",
            higherIsBetter: true
        ) { $0.walkRatio },
        .init(
            id: "estimatedMET", displayName: "Estimated MET",
            unit: "", category: .clinical, icon: "flame.fill",
            higherIsBetter: true
        ) { $0.estimatedMET }
    ]

    // MARK: Ergonomic

    static let ergonomic: [ProgressMetric] = [
        .init(
            id: "rebaScore", displayName: "REBA Score",
            unit: "", category: .ergonomic,
            icon: "desktopcomputer",
            higherIsBetter: false
        ) { s in s.rebaScore.map(Double.init) }
    ]

    // MARK: Smoothness

    static let smoothness: [ProgressMetric] = [
        .init(
            id: "sparcScore", displayName: "SPARC Score",
            unit: "", category: .smoothness,
            icon: "waveform.path.ecg",
            higherIsBetter: true
        ) { $0.sparcScore },
        .init(
            id: "harmonicRatio", displayName: "Harmonic Ratio",
            unit: "", category: .smoothness,
            icon: "waveform.path.ecg.rectangle",
            higherIsBetter: true
        ) { $0.harmonicRatio }
    ]

    // MARK: Frailty

    static let frailty: [ProgressMetric] = [
        .init(
            id: "frailtyScore",
            displayName: "Fried Frailty Score",
            unit: "", category: .frailty,
            icon: "heart.text.clipboard",
            higherIsBetter: false
        ) { s in s.frailtyScore.map(Double.init) }
    ]
}
