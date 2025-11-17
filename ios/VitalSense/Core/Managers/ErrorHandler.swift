//
//  ErrorHandler.swift
//  VitalSense
//
//  Comprehensive error handling and reporting framework
//

import Foundation
import SwiftUI
import OSLog

// MARK: - Error Handler

@MainActor
class ErrorHandler: ObservableObject {
    static let shared = ErrorHandler()

    @Published var lastError: AppError?
    @Published var errorHistory: [AppError] = []
    @Published var showingError: Bool = false

    private let logger = Logger(subsystem: "dev.andernet.VitalSense", category: "ErrorHandler")
    private let maxHistoryCount = 100

    private init() {
        loadErrorHistory()
    }

    // MARK: - Error Handling

    func handle(_ error: Error, context: String = "", recovery: RecoveryStrategy = .none) {
        let appError = AppError(
            error: error,
            context: context,
            timestamp: Date(),
            recovery: recovery
        )

        logError(appError)
        recordError(appError)

        // Determine if error should be shown to user
        if shouldShowToUser(appError) {
            lastError = appError
            showingError = true
        }

        // Attempt recovery if strategy provided
        if recovery != .none {
            attemptRecovery(for: appError, strategy: recovery)
        }
    }

    func handle(_ appError: AppError) {
        logError(appError)
        recordError(appError)

        if shouldShowToUser(appError) {
            lastError = appError
            showingError = true
        }

        if appError.recovery != .none {
            attemptRecovery(for: appError, strategy: appError.recovery)
        }
    }

    func clearError() {
        lastError = nil
        showingError = false
    }

    // MARK: - Error Logging

    private func logError(_ error: AppError) {
        logger.error("Error: \(error.localizedDescription, privacy: .public) - Context: \(error.context, privacy: .public)")

        // Log to console in DEBUG
        #if DEBUG
        print("❌ [ERROR] \(error.localizedDescription)")
        print("   Context: \(error.context)")
        print("   Category: \(error.category.rawValue)")
        if let underlying = error.underlyingError {
            print("   Underlying: \(underlying.localizedDescription)")
        }
        #endif

        // Log to file
        Log.error(
            "\(error.localizedDescription) | Context: \(error.context) | Category: \(error.category.rawValue)",
            category: error.category.rawValue
        )
    }

    private func recordError(_ error: AppError) {
        errorHistory.append(error)

        // Keep only recent errors
        if errorHistory.count > maxHistoryCount {
            errorHistory.removeFirst(errorHistory.count - maxHistoryCount)
        }

        saveErrorHistory()

        // Send to analytics/reporting service if critical
        if error.severity == .critical {
            reportCriticalError(error)
        }
    }

    private func reportCriticalError(_ error: AppError) {
        // In a production app, this would send to crash reporting service
        // For now, just log it
        logger.critical("Critical error reported: \(error.localizedDescription, privacy: .public)")

        // TODO: Integrate with crash reporting service (Sentry, Firebase, etc.)
        // CrashReporting.report(error)
    }

    // MARK: - Recovery Strategies

    private func attemptRecovery(for error: AppError, strategy: RecoveryStrategy) {
        switch strategy {
        case .none:
            break

        case .retry(let maxAttempts):
            // Retry logic would be implemented by caller
            logger.info("Retry strategy for error: \(error.localizedDescription, privacy: .public)")

        case .reconnect:
            // Attempt to reconnect
            Task {
                await WebSocketManager.shared.initialize()
            }

        case .fallback:
            // Use fallback mechanism
            logger.info("Fallback strategy for error: \(error.localizedDescription, privacy: .public)")

        case .userAction:
            // Requires user action - already shown via UI
            break
        }
    }

    // MARK: - Error Filtering

    private func shouldShowToUser(_ error: AppError) -> Bool {
        // Only show user-facing errors
        switch error.severity {
        case .critical, .high:
            return true
        case .medium:
            // Show if it affects user experience
            return error.category == .network || error.category == .permission
        case .low:
            return false
        }
    }

    // MARK: - Error History

    private func loadErrorHistory() {
        if let data = UserDefaults.standard.data(forKey: "ErrorHistory"),
           let history = try? JSONDecoder().decode([AppError].self, from: data) {
            errorHistory = history.suffix(maxHistoryCount)
        }
    }

    private func saveErrorHistory() {
        if let data = try? JSONEncoder().encode(errorHistory) {
            UserDefaults.standard.set(data, forKey: "ErrorHistory")
        }
    }

    func clearErrorHistory() {
        errorHistory.removeAll()
        UserDefaults.standard.removeObject(forKey: "ErrorHistory")
    }

    // MARK: - Analytics

    func getErrorCount(by category: ErrorCategory) -> Int {
        errorHistory.filter { $0.category == category }.count
    }

    func getErrorRate() -> Double {
        guard !errorHistory.isEmpty else { return 0.0 }
        let oneHourAgo = Date().addingTimeInterval(-3600)
        let recentErrors = errorHistory.filter { $0.timestamp > oneHourAgo }
        return Double(recentErrors.count)
    }
}

// MARK: - App Error Model

struct AppError: Identifiable, Codable, Error {
    let id = UUID()
    let underlyingError: AppError.UnderlyingError?
    let context: String
    let timestamp: Date
    let category: ErrorCategory
    let severity: ErrorSeverity
    let recovery: RecoveryStrategy

    init(
        error: Error,
        context: String = "",
        timestamp: Date = Date(),
        category: ErrorCategory? = nil,
        severity: ErrorSeverity? = nil,
        recovery: RecoveryStrategy = .none
    ) {
        self.underlyingError = UnderlyingError(from: error)
        self.context = context
        self.timestamp = timestamp
        self.category = category ?? ErrorCategory.from(error)
        self.severity = severity ?? ErrorSeverity.from(error)
        self.recovery = recovery
    }

    var localizedDescription: String {
        underlyingError?.message ?? "An unknown error occurred"
    }

    struct UnderlyingError: Codable {
        let domain: String
        let code: Int
        let message: String
        let userInfo: [String: String]

        init?(from error: Error) {
            let nsError = error as NSError
            self.domain = nsError.domain
            self.code = nsError.code
            self.message = error.localizedDescription

            var userInfoDict: [String: String] = [:]
            for (key, value) in nsError.userInfo {
                if let stringValue = value as? String {
                    userInfoDict[key as? String ?? "\(key)"] = stringValue
                }
            }
            self.userInfo = userInfoDict
        }
    }
}

// MARK: - Error Categories

enum ErrorCategory: String, Codable {
    case network
    case healthKit
    case permission
    case data
    case ui
    case background
    case websocket
    case lidar
    case arkit
    case ml
    case unknown

    static func from(_ error: Error) -> ErrorCategory {
        let nsError = error as NSError

        if nsError.domain.contains("NSURLError") || nsError.domain.contains("network") {
            return .network
        } else if nsError.domain.contains("HKError") || nsError.domain.contains("HealthKit") {
            return .healthKit
        } else if nsError.domain.contains("permission") || nsError.domain.contains("authorization") {
            return .permission
        } else if nsError.domain.contains("WebSocket") || nsError.domain.contains("ws") {
            return .websocket
        } else if nsError.domain.contains("ARKit") || nsError.domain.contains("AR") {
            return .arkit
        } else if nsError.domain.contains("LiDAR") || nsError.domain.contains("lidar") {
            return .lidar
        } else if nsError.domain.contains("ML") || nsError.domain.contains("CoreML") {
            return .ml
        }

        return .unknown
    }
}

// MARK: - Error Severity

enum ErrorSeverity: String, Codable {
    case critical  // App cannot function
    case high      // Major feature broken
    case medium    // Feature degraded
    case low       // Minor issue, non-blocking

    static func from(_ error: Error) -> ErrorSeverity {
        let nsError = error as NSError

        // Critical errors
        if nsError.code == -1009 || nsError.code == -1001 { // No internet, timeout
            return .critical
        }

        // High severity
        if nsError.domain.contains("HealthKit") && nsError.code == 4 { // Not authorized
            return .high
        }

        // Medium severity
        if nsError.domain.contains("network") {
            return .medium
        }

        return .low
    }
}

// MARK: - Recovery Strategies

enum RecoveryStrategy: Codable {
    case none
    case retry(maxAttempts: Int)
    case reconnect
    case fallback
    case userAction

    enum CodingKeys: String, CodingKey {
        case type
        case maxAttempts
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "none":
            self = .none
        case "retry":
            let attempts = try container.decode(Int.self, forKey: .maxAttempts)
            self = .retry(maxAttempts: attempts)
        case "reconnect":
            self = .reconnect
        case "fallback":
            self = .fallback
        case "userAction":
            self = .userAction
        default:
            self = .none
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .none:
            try container.encode("none", forKey: .type)
        case .retry(let maxAttempts):
            try container.encode("retry", forKey: .type)
            try container.encode(maxAttempts, forKey: .maxAttempts)
        case .reconnect:
            try container.encode("reconnect", forKey: .type)
        case .fallback:
            try container.encode("fallback", forKey: .type)
        case .userAction:
            try container.encode("userAction", forKey: .type)
        }
    }
}

// MARK: - Error View

struct ErrorView: View {
    let error: AppError
    let onDismiss: () -> Void
    let onRetry: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: errorIcon)
                .font(.system(size: 60))
                .foregroundColor(errorColor)

            Text(errorTitle)
                .font(.title2)
                .fontWeight(.bold)

            Text(error.localizedDescription)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            if !error.context.isEmpty {
                Text("Context: \(error.context)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            }

            HStack(spacing: 16) {
                if let retry = onRetry {
                    Button("Retry", action: retry)
                        .buttonStyle(.borderedProminent)
                }

                Button("Dismiss", action: onDismiss)
                    .buttonStyle(.bordered)
            }
            .padding(.top)
        }
        .padding()
    }

    private var errorIcon: String {
        switch error.severity {
        case .critical: return "exclamationmark.triangle.fill"
        case .high: return "exclamationmark.circle.fill"
        case .medium: return "info.circle.fill"
        case .low: return "info.circle"
        }
    }

    private var errorColor: Color {
        switch error.severity {
        case .critical: return .red
        case .high: return .orange
        case .medium: return .yellow
        case .low: return .blue
        }
    }

    private var errorTitle: String {
        switch error.severity {
        case .critical: return "Critical Error"
        case .high: return "Error"
        case .medium: return "Warning"
        case .low: return "Notice"
        }
    }
}

// MARK: - Error Alert Modifier

struct ErrorAlertModifier: ViewModifier {
    @ObservedObject var errorHandler: ErrorHandler

    func body(content: Content) -> some View {
        content
            .alert(
                errorHandler.lastError?.localizedDescription ?? "Error",
                isPresented: $errorHandler.showingError,
                presenting: errorHandler.lastError
            ) { error in
                Button("OK") {
                    errorHandler.clearError()
                }

                if error.recovery != .none {
                    Button("Retry") {
                        // Retry logic would be handled by the error handler
                        errorHandler.clearError()
                    }
                }
            } message: { error in
                Text("\(error.context.isEmpty ? "" : "\(error.context)\n\n")Please try again or contact support if the problem persists.")
            }
    }
}

extension View {
    func errorAlert(errorHandler: ErrorHandler) -> some View {
        modifier(ErrorAlertModifier(errorHandler: errorHandler))
    }
}
