//
//  FeatureFlags.swift
//  Andernet Posture
//
//  Centralized feature flag system for gradual rollouts,
//  A/B testing, and safe feature toggling.
//
//  Usage:
//    if FeatureFlags.shared.isEnabled(.advancedGaitAnalysis) { ... }
//    FeatureFlags.shared.setOverride(.advancedGaitAnalysis, enabled: true)
//

import Foundation
import os.log

// MARK: - Feature Flag Definition

/// Registry of all feature flags in the app.
/// Add new flags here as static cases.
enum Feature: String, CaseIterable, Identifiable, Sendable {
    // ML & Analysis
    case useMLModels              = "feature.useMLModels"
    case advancedGaitAnalysis     = "feature.advancedGaitAnalysis"
    case realtimePainRiskAlerts   = "feature.realtimePainRiskAlerts"

    // Capture
    case sensorOnlyMode           = "feature.sensorOnlyMode"
    case hapticPostureFeedback    = "feature.hapticPostureFeedback"

    // Export & Sharing
    case pdfExport                = "feature.pdfExport"
    case multiSessionExport       = "feature.multiSessionExport"

    // Sync
    case cloudSync                = "feature.cloudSync"
    case healthKitSync            = "feature.healthKitSync"

    // Clinical
    case clinicalTests            = "feature.clinicalTests"
    case sixMinuteWalkTest        = "feature.sixMinuteWalkTest"

    // UI & Experience
    case arOverlay                = "feature.arOverlay"
    case exerciseRecommendations  = "feature.exerciseRecommendations"
    case progressInsights         = "feature.progressInsights"

    var id: String { rawValue }

    /// Human-readable name for the Settings UI.
    var displayName: String {
        switch self {
        case .useMLModels:            return String(localized: "ML Models")
        case .advancedGaitAnalysis:   return String(localized: "Advanced Gait Analysis")
        case .realtimePainRiskAlerts: return String(localized: "Real-time Pain Risk Alerts")
        case .sensorOnlyMode:        return String(localized: "Sensor-Only Mode")
        case .hapticPostureFeedback:  return String(localized: "Haptic Posture Feedback")
        case .pdfExport:              return String(localized: "PDF Reports")
        case .multiSessionExport:     return String(localized: "Multi-Session Export")
        case .cloudSync:              return String(localized: "iCloud Sync")
        case .healthKitSync:          return String(localized: "Apple Health Sync")
        case .clinicalTests:          return String(localized: "Clinical Tests")
        case .sixMinuteWalkTest:      return String(localized: "6-Minute Walk Test")
        case .arOverlay:              return String(localized: "AR Skeleton Overlay")
        case .exerciseRecommendations: return String(localized: "Exercise Recommendations")
        case .progressInsights:       return String(localized: "Progress Insights")
        }
    }

    /// Description for the Settings UI.
    var description: String {
        switch self {
        case .useMLModels:            return String(localized: "Use CoreML for enhanced analysis when models are available")
        case .advancedGaitAnalysis:   return String(localized: "Enable pattern classification and asymmetry detection")
        case .realtimePainRiskAlerts: return String(localized: "Show pain risk alerts during capture")
        case .sensorOnlyMode:        return String(localized: "Allow capture using phone sensors only (no ARKit)")
        case .hapticPostureFeedback:  return String(localized: "Vibrate when posture score drops below threshold")
        case .pdfExport:              return String(localized: "Generate clinical PDF reports")
        case .multiSessionExport:     return String(localized: "Export multiple sessions at once")
        case .cloudSync:              return String(localized: "Sync session data across devices via iCloud")
        case .healthKitSync:          return String(localized: "Auto-save session data to Apple Health")
        case .clinicalTests:          return String(localized: "Access guided clinical test protocols")
        case .sixMinuteWalkTest:      return String(localized: "Full 6MWT protocol with ATS/ERS guidelines")
        case .arOverlay:              return String(localized: "Show skeleton overlay during AR capture")
        case .exerciseRecommendations: return String(localized: "Get exercise suggestions based on analysis")
        case .progressInsights:       return String(localized: "AI-generated insights from session trends")
        }
    }

    /// Default enabled state for new installs.
    var defaultEnabled: Bool {
        switch self {
        case .useMLModels:            return false  // Opt-in until models are validated
        case .advancedGaitAnalysis:   return true
        case .realtimePainRiskAlerts: return false   // Opt-in — can be distracting
        case .sensorOnlyMode:        return true
        case .hapticPostureFeedback:  return true
        case .pdfExport:              return true
        case .multiSessionExport:     return true
        case .cloudSync:              return true
        case .healthKitSync:          return false   // Requires explicit consent
        case .clinicalTests:          return true
        case .sixMinuteWalkTest:      return true
        case .arOverlay:              return true
        case .exerciseRecommendations: return true
        case .progressInsights:       return true
        }
    }
}

// MARK: - Feature Flag Manager

/// Centralized feature flag manager.
/// Reads from UserDefaults with optional per-flag overrides.
@Observable
@MainActor
final class FeatureFlags {
    static let shared = FeatureFlags()

    private let defaults: UserDefaults
    private let logger = AppLogger.app

    /// In-memory overrides (e.g., from remote config or debug menu).
    private var overrides: [Feature: Bool] = [:]

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        registerDefaults()
    }

    // MARK: - Query

    /// Check if a feature is enabled.
    func isEnabled(_ feature: Feature) -> Bool {
        // 1. Check in-memory override first
        if let override = overrides[feature] {
            return override
        }

        // 2. Check UserDefaults
        if defaults.object(forKey: feature.rawValue) != nil {
            return defaults.bool(forKey: feature.rawValue)
        }

        // 3. Fall back to compile-time default
        return feature.defaultEnabled
    }

    // MARK: - Mutation

    /// Persistently set a feature flag.
    func setEnabled(_ feature: Feature, _ enabled: Bool) {
        defaults.set(enabled, forKey: feature.rawValue)
        logger.info("Feature '\(feature.rawValue)' set to \(enabled)")
    }

    /// Set a temporary in-memory override (not persisted across launches).
    func setOverride(_ feature: Feature, enabled: Bool) {
        overrides[feature] = enabled
        logger.debug("Feature override '\(feature.rawValue)' → \(enabled)")
    }

    /// Remove an in-memory override, reverting to persisted/default value.
    func removeOverride(_ feature: Feature) {
        overrides.removeValue(forKey: feature)
    }

    /// Remove all overrides.
    func clearAllOverrides() {
        overrides.removeAll()
    }

    // MARK: - Debug

    /// All flags with their current effective values.
    var allFlags: [(feature: Feature, isEnabled: Bool)] {
        Feature.allCases.map { ($0, isEnabled($0)) }
    }

    // MARK: - Private

    private func registerDefaults() {
        var defaultValues: [String: Any] = [:]
        for feature in Feature.allCases {
            defaultValues[feature.rawValue] = feature.defaultEnabled
        }
        defaults.register(defaults: defaultValues)
    }
}
