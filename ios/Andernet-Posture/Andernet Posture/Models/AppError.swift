//
//  AppError.swift
//  Andernet Posture
//
//  Unified error domain for the entire application.
//  Every service and ViewModel maps errors into this type
//  for consistent presentation and logging.
//

import Foundation

// MARK: - AppError

/// Centralized error type for the application. Maps domain-specific errors
/// into user-presentable categories with optional recovery actions.
enum AppError: LocalizedError, Sendable, Identifiable {
    var id: String { localizedDescription }

    // Persistence
    case sessionSaveFailed(underlying: String)
    case sessionLoadFailed(underlying: String)
    case dataMigrationFailed(underlying: String)
    case dataCorrupted(detail: String)

    // Sync
    case cloudSyncFailed(underlying: String)
    case iCloudAccountUnavailable
    case iCloudQuotaExceeded

    // Sensors & Capture
    case arSessionFailed(underlying: String)
    case bodyTrackingUnavailable
    case motionSensorUnavailable
    case cameraPermissionDenied
    case pedometerUnavailable

    // HealthKit
    case healthKitAuthorizationDenied
    case healthKitWriteFailed(underlying: String)

    // ML
    case mlModelLoadFailed(model: String, underlying: String)
    case mlPredictionFailed(model: String, underlying: String)

    // Export
    case exportFailed(format: String, underlying: String)

    // General
    case unknown(underlying: String)

    // MARK: - LocalizedError

    var errorDescription: String? {
        switch self {
        case .sessionSaveFailed:
            return String(localized: "Your session could not be saved.")
        case .sessionLoadFailed:
            return String(localized: "Session data could not be loaded.")
        case .dataMigrationFailed:
            return String(localized: "Data migration failed.")
        case .dataCorrupted:
            return String(localized: "Some data appears to be corrupted.")
        case .cloudSyncFailed:
            return String(localized: "iCloud sync encountered an error.")
        case .iCloudAccountUnavailable:
            return String(localized: "Sign in to iCloud in Settings to sync data.")
        case .iCloudQuotaExceeded:
            return String(localized: "iCloud storage is full.")
        case .arSessionFailed:
            return String(localized: "AR session failed to start.")
        case .bodyTrackingUnavailable:
            return String(localized: "Body tracking is not available on this device.")
        case .motionSensorUnavailable:
            return String(localized: "Motion sensors are not available.")
        case .cameraPermissionDenied:
            return String(localized: "Camera access is required for body tracking.")
        case .pedometerUnavailable:
            return String(localized: "Step counting is not available on this device.")
        case .healthKitAuthorizationDenied:
            return String(localized: "HealthKit access was denied. Enable it in Settings.")
        case .healthKitWriteFailed:
            return String(localized: "Failed to save data to Apple Health.")
        case .mlModelLoadFailed(let model, _):
            return String(localized: "ML model '\(model)' could not be loaded.")
        case .mlPredictionFailed(let model, _):
            return String(localized: "ML prediction failed for '\(model)'.")
        case .exportFailed(let format, _):
            return String(localized: "Failed to export \(format) file.")
        case .unknown:
            return String(localized: "An unexpected error occurred.")
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .sessionSaveFailed:
            return String(localized: "Please try saving again. If the problem persists, restart the app.")
        case .sessionLoadFailed, .dataCorrupted:
            return String(localized: "Try closing and reopening the session.")
        case .dataMigrationFailed:
            return String(localized: "Restart the app to retry migration.")
        case .cloudSyncFailed:
            return String(localized: "Check your network connection and try again.")
        case .iCloudAccountUnavailable:
            return String(localized: "Open Settings → Apple Account → iCloud.")
        case .iCloudQuotaExceeded:
            return String(localized: "Free up iCloud storage or upgrade your plan.")
        case .arSessionFailed:
            return String(localized: "Make sure you're in a well-lit environment and try again.")
        case .bodyTrackingUnavailable:
            return String(localized: "Body tracking requires a device with an A14 chip or later.")
        case .motionSensorUnavailable:
            return String(localized: "Ensure the device has motion sensors and permissions are enabled.")
        case .cameraPermissionDenied:
            return String(localized: "Open Settings → Andernet Posture → Camera.")
        case .pedometerUnavailable:
            return nil
        case .healthKitAuthorizationDenied:
            return String(localized: "Open Settings → Privacy & Security → Health → Andernet Posture.")
        case .healthKitWriteFailed:
            return String(localized: "Check HealthKit permissions in Settings.")
        case .mlModelLoadFailed:
            return String(localized: "The app will use rule-based analysis instead.")
        case .mlPredictionFailed:
            return String(localized: "The app will fall back to rule-based analysis.")
        case .exportFailed:
            return String(localized: "Try exporting again. Ensure you have sufficient storage.")
        case .unknown:
            return String(localized: "Please try again or restart the app.")
        }
    }

    /// The underlying technical error message for logging (not shown to user).
    var technicalDetail: String {
        switch self {
        case .sessionSaveFailed(let u),
             .sessionLoadFailed(let u),
             .dataMigrationFailed(let u),
             .dataCorrupted(let u),
             .cloudSyncFailed(let u),
             .arSessionFailed(let u),
             .healthKitWriteFailed(let u),
             .exportFailed(_, let u),
             .unknown(let u):
            return u
        case .mlModelLoadFailed(_, let u),
             .mlPredictionFailed(_, let u):
            return u
        case .iCloudAccountUnavailable,
             .iCloudQuotaExceeded,
             .bodyTrackingUnavailable,
             .motionSensorUnavailable,
             .cameraPermissionDenied,
             .pedometerUnavailable,
             .healthKitAuthorizationDenied:
            return errorDescription ?? "No detail"
        }
    }

    /// Whether the user can retry the operation.
    var isRetryable: Bool {
        switch self {
        case .sessionSaveFailed, .cloudSyncFailed, .arSessionFailed,
             .healthKitWriteFailed, .exportFailed:
            return true
        default:
            return false
        }
    }
}
