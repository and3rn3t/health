//
//  AnalyticsManager.swift
//  VitalSense
//
//  Comprehensive analytics and performance monitoring
//

import Foundation
import SwiftUI
import OSLog

// MARK: - Analytics Manager

@MainActor
class AnalyticsManager: ObservableObject {
    static let shared = AnalyticsManager()

    @Published var performanceMetrics: [PerformanceMetric] = []
    @Published var sessionMetrics: SessionMetrics?
    @Published var memoryUsage: MemoryUsage?
    @Published var batteryUsage: BatteryUsage?

    private let logger = Logger(subsystem: "dev.andernet.VitalSense", category: "Analytics")
    private let maxMetricsHistory = 1000
    private var sessionStartTime: Date?

    // Analytics providers (can be extended with Firebase, Mixpanel, etc.)
    private var providers: [AnalyticsProvider] = []

    private init() {
        setupProviders()
        startSession()
    }

    // MARK: - Session Management

    func startSession() {
        sessionStartTime = Date()
        sessionMetrics = SessionMetrics(startTime: Date())
        logEvent("session_start", parameters: nil)
    }

    func endSession() {
        guard let startTime = sessionStartTime else { return }
        let duration = Date().timeIntervalSince(startTime)
        sessionMetrics?.duration = duration
        logEvent("session_end", parameters: ["duration": String(duration)])
        sessionMetrics = nil
        sessionStartTime = nil
    }

    // MARK: - Event Logging

    func logEvent(_ name: String, parameters: [String: String]? = nil) {
        let event = AnalyticsEvent(
            name: name,
            timestamp: Date(),
            parameters: parameters ?? [:]
        )

        // Log to providers
        for provider in providers {
            provider.logEvent(event)
        }

        // Store for local analytics
        storeEvent(event)
    }

    func logError(_ error: Error, context: String = "") {
        let errorEvent = AnalyticsEvent(
            name: "error",
            timestamp: Date(),
            parameters: [
                "error_description": error.localizedDescription,
                "context": context,
                "error_type": String(describing: type(of: error))
            ]
        )

        for provider in providers {
            provider.logError(errorEvent)
        }
    }

    func logPerformance(_ metric: PerformanceMetric) {
        performanceMetrics.append(metric)

        // Keep only recent metrics
        if performanceMetrics.count > maxMetricsHistory {
            performanceMetrics.removeFirst(performanceMetrics.count - maxMetricsHistory)
        }

        // Log to providers
        for provider in providers {
            provider.logPerformance(metric)
        }

        // Check for performance issues
        checkPerformanceThresholds(metric)
    }

    // MARK: - Performance Monitoring

    func startTiming(_ operation: String) -> PerformanceTimer {
        PerformanceTimer(operation: operation, analytics: self)
    }

    func recordTiming(_ operation: String, duration: TimeInterval) {
        let metric = PerformanceMetric(
            operation: operation,
            duration: duration,
            timestamp: Date()
        )
        logPerformance(metric)
    }

    func recordMemoryUsage() {
        let info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4

        let result: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        if result == KERN_SUCCESS {
            let usedBytes = info.resident_size
            let totalBytes = ProcessInfo.processInfo.physicalMemory

            memoryUsage = MemoryUsage(
                usedBytes: usedBytes,
                totalBytes: totalBytes,
                percentage: Double(usedBytes) / Double(totalBytes) * 100,
                timestamp: Date()
            )

            logEvent("memory_usage", parameters: [
                "used_mb": String(format: "%.2f", Double(usedBytes) / 1024 / 1024),
                "total_mb": String(format: "%.2f", Double(totalBytes) / 1024 / 1024),
                "percentage": String(format: "%.1f", memoryUsage?.percentage ?? 0)
            ])
        }
    }

    func recordBatteryUsage() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let batteryLevel = UIDevice.current.batteryLevel
        let batteryState = UIDevice.current.batteryState

        if batteryLevel >= 0 {
            batteryUsage = BatteryUsage(
                level: Double(batteryLevel),
                state: batteryState,
                timestamp: Date()
            )

            logEvent("battery_usage", parameters: [
                "level": String(format: "%.0f", batteryLevel * 100),
                "state": String(describing: batteryState)
            ])
        }
    }

    // MARK: - Analytics Queries

    func getAverageDuration(for operation: String) -> TimeInterval? {
        let relevantMetrics = performanceMetrics.filter { $0.operation == operation }
        guard !relevantMetrics.isEmpty else { return nil }

        let total = relevantMetrics.reduce(0.0) { $0 + $1.duration }
        return total / Double(relevantMetrics.count)
    }

    func getOperationCount(_ operation: String) -> Int {
        performanceMetrics.filter { $0.operation == operation }.count
    }

    func getRecentMetrics(limit: Int = 100) -> [PerformanceMetric] {
        Array(performanceMetrics.suffix(limit))
    }

    func getMetricsSummary() -> MetricsSummary {
        let totalOperations = performanceMetrics.count
        let avgDuration = performanceMetrics.isEmpty ? 0 :
            performanceMetrics.reduce(0.0) { $0 + $1.duration } / Double(totalOperations)
        let slowestOperation = performanceMetrics.max(by: { $0.duration < $1.duration })

        return MetricsSummary(
            totalOperations: totalOperations,
            averageDuration: avgDuration,
            slowestOperation: slowestOperation?.operation,
            slowestDuration: slowestOperation?.duration
        )
    }

    // MARK: - Private Methods

    private func setupProviders() {
        // Add console logger in DEBUG
        #if DEBUG
        providers.append(ConsoleAnalyticsProvider())
        #endif

        // Add remote analytics providers here
        // providers.append(FirebaseAnalyticsProvider())
        // providers.append(SentryAnalyticsProvider())
    }

    private func storeEvent(_ event: AnalyticsEvent) {
        // Store events for local analytics dashboard
        // Could be persisted to UserDefaults or Core Data
    }

    private func checkPerformanceThresholds(_ metric: PerformanceMetric) {
        // Alert if operation takes too long
        if metric.duration > 5.0 { // 5 seconds threshold
            logger.warning("Slow operation detected: \(metric.operation) took \(metric.duration)s")
            logEvent("performance_warning", parameters: [
                "operation": metric.operation,
                "duration": String(metric.duration)
            ])
        }
    }
}

// MARK: - Data Models

struct PerformanceMetric: Identifiable, Codable {
    let id = UUID()
    let operation: String
    let duration: TimeInterval
    let timestamp: Date
}

struct SessionMetrics: Codable {
    let startTime: Date
    var duration: TimeInterval?
    var eventsCount: Int = 0
    var errorsCount: Int = 0
}

struct MemoryUsage: Codable {
    let usedBytes: UInt64
    let totalBytes: UInt64
    let percentage: Double
    let timestamp: Date

    var usedMB: Double {
        Double(usedBytes) / 1024 / 1024
    }

    var totalMB: Double {
        Double(totalBytes) / 1024 / 1024
    }
}

struct BatteryUsage: Codable {
    let level: Double
    let state: UIDevice.BatteryState
    let timestamp: Date

    var levelPercent: Int {
        Int(level * 100)
    }
}

struct MetricsSummary {
    let totalOperations: Int
    let averageDuration: TimeInterval
    let slowestOperation: String?
    let slowestDuration: TimeInterval?
}

struct AnalyticsEvent: Codable {
    let name: String
    let timestamp: Date
    let parameters: [String: String]
}

// MARK: - Performance Timer

class PerformanceTimer {
    private let operation: String
    private let analytics: AnalyticsManager
    private let startTime: Date

    init(operation: String, analytics: AnalyticsManager) {
        self.operation = operation
        self.analytics = analytics
        self.startTime = Date()
    }

    deinit {
        let duration = Date().timeIntervalSince(startTime)
        Task { @MainActor in
            analytics.recordTiming(operation, duration: duration)
        }
    }

    func stop() -> TimeInterval {
        let duration = Date().timeIntervalSince(startTime)
        Task { @MainActor in
            analytics.recordTiming(operation, duration: duration)
        }
        return duration
    }
}

// MARK: - Analytics Provider Protocol

protocol AnalyticsProvider {
    func logEvent(_ event: AnalyticsEvent)
    func logError(_ event: AnalyticsEvent)
    func logPerformance(_ metric: PerformanceMetric)
}

// MARK: - Console Analytics Provider

class ConsoleAnalyticsProvider: AnalyticsProvider {
    func logEvent(_ event: AnalyticsEvent) {
        #if DEBUG
        print("📊 Analytics: \(event.name) - \(event.parameters)")
        #endif
    }

    func logError(_ event: AnalyticsEvent) {
        #if DEBUG
        print("❌ Error: \(event.parameters["error_description"] ?? "Unknown")")
        #endif
    }

    func logPerformance(_ metric: PerformanceMetric) {
        #if DEBUG
        print("⏱️ Performance: \(metric.operation) - \(String(format: "%.3f", metric.duration))s")
        #endif
    }
}

// MARK: - Firebase Analytics Provider (Stub - requires Firebase SDK)

/*
class FirebaseAnalyticsProvider: AnalyticsProvider {
    func logEvent(_ event: AnalyticsEvent) {
        // FirebaseAnalytics.Analytics.logEvent(event.name, parameters: convertParameters(event.parameters))
    }

    func logError(_ event: AnalyticsEvent) {
        // FirebaseCrashlytics.crashlytics().record(error: error)
    }

    func logPerformance(_ metric: PerformanceMetric) {
        // FirebasePerformance.startTrace(metric.operation)
    }

    private func convertParameters(_ params: [String: String]) -> [String: Any] {
        return params.mapValues { $0 }
    }
}
*/

// MARK: - Sentry Analytics Provider (Stub - requires Sentry SDK)

/*
import Sentry

class SentryAnalyticsProvider: AnalyticsProvider {
    func logEvent(_ event: AnalyticsEvent) {
        SentrySDK.capture(message: "\(event.name): \(event.parameters)")
    }

    func logError(_ event: AnalyticsEvent) {
        let error = NSError(
            domain: "VitalSense",
            code: -1,
            userInfo: [
                NSLocalizedDescriptionKey: event.parameters["error_description"] ?? "Unknown error",
                "context": event.parameters["context"] ?? ""
            ]
        )
        SentrySDK.capture(error: error)
    }

    func logPerformance(_ metric: PerformanceMetric) {
        let span = SentrySDK.startTransaction(name: metric.operation, operation: "performance")
        span.setMeasurement(name: "duration", value: NSNumber(value: metric.duration))
        span.finish()
    }
}
*/
