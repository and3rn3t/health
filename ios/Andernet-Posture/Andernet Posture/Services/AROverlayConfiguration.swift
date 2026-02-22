//
//  AROverlayConfiguration.swift
//  Andernet Posture
//
//  Configuration service for AR overlay rendering modes.
//  Drives visual style of the skeleton overlay in BodyARView.
//

import SwiftUI
import Observation

// MARK: - AR Overlay Mode

/// Visual overlay modes for the AR skeleton display.
enum AROverlayMode: String, CaseIterable, Sendable, Identifiable {
    case skeleton   // Default cyan skeleton
    case severity   // Joint-by-joint severity coloring
    case heatmap    // Full-body posture heatmap
    case angles     // Angle measurement labels at key joints
    case rom        // ROM arc indicators at hips/knees
    case minimal    // Key joints only, no bones

    var id: String { rawValue }

    /// Human-readable display name.
    var displayName: String {
        switch self {
        case .skeleton: return "Skeleton"
        case .severity: return "Severity"
        case .heatmap:  return "Heatmap"
        case .angles:   return "Angles"
        case .rom:      return "ROM"
        case .minimal:  return "Minimal"
        }
    }

    /// SF Symbol icon for the mode.
    var iconName: String {
        switch self {
        case .skeleton: return "figure.stand"
        case .severity: return "waveform.path.ecg"
        case .heatmap:  return "thermometer.medium"
        case .angles:   return "angle"
        case .rom:      return "arrow.triangle.2.circlepath"
        case .minimal:  return "circle.grid.cross"
        }
    }

    /// Short description of what this mode visualises.
    var descriptionText: String {
        switch self {
        case .skeleton:
            return "Standard skeleton with cyan joints and bone connections."
        case .severity:
            return "Each joint colored by clinical severity — green (normal) to red (severe)."
        case .heatmap:
            return "Entire body colored by overall posture score — green (good) to red (poor)."
        case .angles:
            return "Floating angle labels at key joints showing real-time measurements."
        case .rom:
            return "Arc indicators at hips and knees showing range-of-motion."
        case .minimal:
            return "Only key landmarks — head, shoulders, hips, and feet."
        }
    }
}

// MARK: - AR Overlay Configuration

/// Observable configuration controlling AR overlay appearance.
/// Persists user preferences via @AppStorage-backed properties.
@MainActor
@Observable
final class AROverlayConfig {

    // MARK: Persisted preferences

    /// The active overlay rendering mode.
    var mode: AROverlayMode {
        get {
            let raw = UserDefaults.standard.string(forKey: "arOverlayMode") ?? AROverlayMode.skeleton.rawValue
            return AROverlayMode(rawValue: raw) ?? .skeleton
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: "arOverlayMode")
        }
    }

    /// Whether to show floating angle labels (applies to angles mode).
    var showAngleLabels: Bool {
        get { UserDefaults.standard.bool(forKey: "showAngleLabels") }
        set { UserDefaults.standard.set(newValue, forKey: "showAngleLabels") }
    }

    /// Whether to draw a vertical plumb line showing ideal alignment.
    var showPostureGuidelines: Bool {
        get { UserDefaults.standard.bool(forKey: "showPostureGuidelines") }
        set { UserDefaults.standard.set(newValue, forKey: "showPostureGuidelines") }
    }

    // MARK: Derived state

    /// Joints to emphasise in the current mode.
    var jointHighlightJoints: Set<JointName> {
        switch mode {
        case .minimal:
            return [.root, .head, .leftShoulder, .rightShoulder,
                    .leftUpLeg, .rightUpLeg, .leftFoot, .rightFoot]
        case .angles:
            return [.head, .spine4, .leftUpLeg, .rightUpLeg,
                    .leftLeg, .rightLeg]
        case .rom:
            return [.leftUpLeg, .rightUpLeg, .leftLeg, .rightLeg,
                    .leftFoot, .rightFoot, .root]
        default:
            return Set(JointName.allCases)
        }
    }

    /// Whether bones should be visible in the current mode.
    var showBones: Bool {
        switch mode {
        case .minimal: return false
        default:       return true
        }
    }

    // MARK: Color helpers

    /// Platform color for a given clinical severity.
    static func color(for severity: ClinicalSeverity) -> UIColor {
        AppColors.severityUIColor(for: severity)
    }

    /// SwiftUI color for a given clinical severity.
    static func swiftUIColor(for severity: ClinicalSeverity) -> Color {
        AppColors.severityColor(for: severity)
    }

    /// Platform color for a posture score (0–100).
    static func heatmapColor(for score: Double) -> UIColor {
        AppColors.scoreUIColor(for: score)
    }
}
