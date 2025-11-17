//
//  CrashReportingManager.swift
//  VitalSense
//
//  Crash reporting integration with support for Sentry and Firebase Crashlytics
//

import Foundation
import OSLog

// MARK: - Crash Reporting Manager

@MainActor
class CrashReportingManager {
    static let shared = CrashReportingManager()

    private let logger = Logger(subsystem: "dev.andernet.VitalSense", category: "CrashReporting")
    private var providers: [CrashReportingProvider] = []
    private var isInitialized = false

    private init() {}

    // MARK: - Initialization

    func initialize() {
        guard !isInitialized else { return }

        // Check build configuration to determine which providers to use
        #if FIREBASE_CRASHLYTICS_ENABLED
        setupFirebaseCrashlytics()
        #endif

        #if SENTRY_ENABLED
        setupSentry()
        #endif

        // Always add local crash logger
        providers.append(LocalCrashLogger())

        // Set up uncaught exception handlers
        setupUncaughtExceptionHandlers()

        isInitialized = true
        logger.info("Crash reporting initialized with \(providers.count) providers")
    }

    // MARK: - Crash Reporting

    func reportError(_ error: Error, context: String = "", level: CrashLevel = .error) {
        let crashReport = CrashReport(
            error: error,
            context: context,
            level: level,
            timestamp: Date()
        )

        for provider in providers {
            provider.report(crashReport)
        }

        logger.error("Crash reported: \(error.localizedDescription, privacy: .public) - Context: \(context, privacy: .public)")
    }

    func reportMessage(_ message: String, level: CrashLevel = .info) {
        let crashReport = CrashReport(
            message: message,
            level: level,
            timestamp: Date()
        )

        for provider in providers {
            provider.report(crashReport)
        }
    }

    func setUser(_ userId: String, email: String? = nil, username: String? = nil) {
        for provider in providers {
            provider.setUser(userId: userId, email: email, username: username)
        }
    }

    func addBreadcrumb(_ message: String, category: String = "default", level: CrashLevel = .info) {
        let breadcrumb = Breadcrumb(
            message: message,
            category: category,
            level: level,
            timestamp: Date()
        )

        for provider in providers {
            provider.addBreadcrumb(breadcrumb)
        }
    }

    func setContext(_ key: String, value: Any) {
        for provider in providers {
            provider.setContext(key: key, value: value)
        }
    }

    func setTag(_ key: String, value: String) {
        for provider in providers {
            provider.setTag(key: key, value: value)
        }
    }

    // MARK: - Private Setup

    #if FIREBASE_CRASHLYTICS_ENABLED
    private func setupFirebaseCrashlytics() {
        // Firebase Crashlytics setup would go here
        // Uncomment when Firebase SDK is added:
        /*
        FirebaseApp.configure()
        providers.append(FirebaseCrashlyticsProvider())
        logger.info("Firebase Crashlytics initialized")
        */
        logger.info("Firebase Crashlytics provider placeholder initialized")
    }
    #endif

    #if SENTRY_ENABLED
    private func setupSentry() {
        // Sentry setup would go here
        // Uncomment when Sentry SDK is added:
        /*
        SentrySDK.start { options in
            options.dsn = "YOUR_SENTRY_DSN"
            options.debug = false
            options.environment = Bundle.main.object(forInfoDictionaryKey: "Environment") as? String ?? "production"
            options.tracesSampleRate = 0.1
        }
        providers.append(SentryProvider())
        logger.info("Sentry initialized")
        */
        logger.info("Sentry provider placeholder initialized")
    }
    #endif

    private func setupUncaughtExceptionHandlers() {
        // Set up NSError exception handler
        NSSetUncaughtExceptionHandler { exception in
            CrashReportingManager.shared.handleUncaughtException(exception)
        }

        // Set up signal handlers for crashes
        signal(SIGABRT, signalHandler)
        signal(SIGILL, signalHandler)
        signal(SIGSEGV, signalHandler)
        signal(SIGFPE, signalHandler)
        signal(SIGBUS, signalHandler)
        signal(SIGPIPE, signalHandler)
    }

    private func handleUncaughtException(_ exception: NSException) {
        let message = "Uncaught exception: \(exception.name.rawValue) - \(exception.reason ?? "Unknown")"
        reportMessage(message, level: .fatal)

        // Re-raise exception to allow normal crash reporting
        exception.raise()
    }
}

// Signal handler for crashes
private func signalHandler(_ signal: Int32) {
    let signalName: String
    switch signal {
    case SIGABRT: signalName = "SIGABRT"
    case SIGILL: signalName = "SIGILL"
    case SIGSEGV: signalName = "SIGSEGV"
    case SIGFPE: signalName = "SIGFPE"
    case SIGBUS: signalName = "SIGBUS"
    case SIGPIPE: signalName = "SIGPIPE"
    default: signalName = "UNKNOWN"
    }

    CrashReportingManager.shared.reportMessage("Crash signal received: \(signalName)", level: .fatal)
}

// MARK: - Data Models

struct CrashReport {
    let id = UUID()
    let error: Error?
    let message: String?
    let context: String
    let level: CrashLevel
    let timestamp: Date
    var userInfo: [String: Any] = [:]
    var breadcrumbs: [Breadcrumb] = []

    init(error: Error, context: String = "", level: CrashLevel = .error, timestamp: Date = Date()) {
        self.error = error
        self.message = nil
        self.context = context
        self.level = level
        self.timestamp = timestamp
    }

    init(message: String, level: CrashLevel = .info, timestamp: Date = Date()) {
        self.error = nil
        self.message = message
        self.context = ""
        self.level = level
        self.timestamp = timestamp
    }
}

struct Breadcrumb {
    let message: String
    let category: String
    let level: CrashLevel
    let timestamp: Date
    var data: [String: String] = [:]
}

enum CrashLevel: String, Codable {
    case debug
    case info
    case warning
    case error
    case fatal
}

// MARK: - Crash Reporting Provider Protocol

protocol CrashReportingProvider {
    func report(_ report: CrashReport)
    func setUser(userId: String, email: String?, username: String?)
    func addBreadcrumb(_ breadcrumb: Breadcrumb)
    func setContext(_ key: String, value: Any)
    func setTag(_ key: String, value: String)
}

// MARK: - Local Crash Logger

class LocalCrashLogger: CrashReportingProvider {
    private var logs: [CrashReport] = []
    private let maxLogs = 100
    private let logger = Logger(subsystem: "dev.andernet.VitalSense", category: "LocalCrashLogger")

    func report(_ report: CrashReport) {
        logs.append(report)

        // Keep only recent logs
        if logs.count > maxLogs {
            logs.removeFirst(logs.count - maxLogs)
        }

        // Log to console in DEBUG
        #if DEBUG
        let message = report.message ?? (report.error?.localizedDescription ?? "Unknown error")
        switch report.level {
        case .fatal, .error:
            logger.error("\(message, privacy: .public)")
        case .warning:
            logger.warning("\(message, privacy: .public)")
        case .info:
            logger.info("\(message, privacy: .public)")
        case .debug:
            logger.debug("\(message, privacy: .public)")
        }
        #endif

        // Persist critical errors
        if report.level == .fatal || report.level == .error {
            persistReport(report)
        }
    }

    func setUser(userId: String, email: String?, username: String?) {
        // Store user info for local reporting
        UserDefaults.standard.set(userId, forKey: "crash_reporting_user_id")
        if let email = email {
            UserDefaults.standard.set(email, forKey: "crash_reporting_user_email")
        }
        if let username = username {
            UserDefaults.standard.set(username, forKey: "crash_reporting_username")
        }
    }

    func addBreadcrumb(_ breadcrumb: Breadcrumb) {
        // Store breadcrumbs with recent reports
        if var lastReport = logs.last {
            lastReport.breadcrumbs.append(breadcrumb)
            logs[logs.count - 1] = lastReport
        }
    }

    func setContext(_ key: String, value: Any) {
        // Store context with UserDefaults
        UserDefaults.standard.set(String(describing: value), forKey: "crash_context_\(key)")
    }

    func setTag(_ key: String, value: String) {
        // Store tags with UserDefaults
        UserDefaults.standard.set(value, forKey: "crash_tag_\(key)")
    }

    private func persistReport(_ report: CrashReport) {
        // Persist to UserDefaults for debugging
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(report),
           let jsonString = String(data: data, encoding: .utf8) {
            var persistedReports = UserDefaults.standard.stringArray(forKey: "persisted_crash_reports") ?? []
            persistedReports.append(jsonString)

            // Keep only last 20 reports
            if persistedReports.count > 20 {
                persistedReports.removeFirst(persistedReports.count - 20)
            }

            UserDefaults.standard.set(persistedReports, forKey: "persisted_crash_reports")
        }
    }
}

// MARK: - Firebase Crashlytics Provider (Stub)

/*
import FirebaseCrashlytics

class FirebaseCrashlyticsProvider: CrashReportingProvider {
    func report(_ report: CrashReport) {
        if let error = report.error {
            Crashlytics.crashlytics().record(error: error)
        } else if let message = report.message {
            Crashlytics.crashlytics().log(message)
        }

        // Add context
        for (key, value) in report.userInfo {
            Crashlytics.crashlytics().setCustomValue(value, forKey: key)
        }
    }

    func setUser(userId: String, email: String?, username: String?) {
        Crashlytics.crashlytics().setUserID(userId)
        if let email = email {
            Crashlytics.crashlytics().setCustomValue(email, forKey: "email")
        }
        if let username = username {
            Crashlytics.crashlytics().setCustomValue(username, forKey: "username")
        }
    }

    func addBreadcrumb(_ breadcrumb: Breadcrumb) {
        Crashlytics.crashlytics().log("\(breadcrumb.category): \(breadcrumb.message)")
    }

    func setContext(_ key: String, value: Any) {
        Crashlytics.crashlytics().setCustomValue(value, forKey: key)
    }

    func setTag(_ key: String, value: String) {
        Crashlytics.crashlytics().setCustomValue(value, forKey: key)
    }
}
*/

// MARK: - Sentry Provider (Stub)

/*
import Sentry

class SentryProvider: CrashReportingProvider {
    func report(_ report: CrashReport) {
        if let error = report.error {
            SentrySDK.capture(error: error)
        } else if let message = report.message {
            let sentryEvent = Event(level: convertLevel(report.level))
            sentryEvent.message = SentryMessage(formatted: message)
            SentrySDK.capture(event: sentryEvent)
        }

        // Add context
        SentrySDK.configureScope { scope in
            for (key, value) in report.userInfo {
                scope.setContext(value: ["value": value], key: key)
            }
        }
    }

    func setUser(userId: String, email: String?, username: String?) {
        let user = User(userId: userId)
        user.email = email
        user.username = username
        SentrySDK.setUser(user)
    }

    func addBreadcrumb(_ breadcrumb: Breadcrumb) {
        let sentryBreadcrumb = Breadcrumb(level: convertLevel(breadcrumb.level), category: breadcrumb.category)
        sentryBreadcrumb.message = breadcrumb.message
        SentrySDK.addBreadcrumb(sentryBreadcrumb)
    }

    func setContext(_ key: String, value: Any) {
        SentrySDK.configureScope { scope in
            scope.setContext(value: ["value": value], key: key)
        }
    }

    func setTag(_ key: String, value: String) {
        SentrySDK.setTag(value: value, key: key)
    }

    private func convertLevel(_ level: CrashLevel) -> SentryLevel {
        switch level {
        case .debug: return .debug
        case .info: return .info
        case .warning: return .warning
        case .error: return .error
        case .fatal: return .fatal
        }
    }
}
*/
