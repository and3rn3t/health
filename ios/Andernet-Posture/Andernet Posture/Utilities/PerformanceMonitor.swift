//
//  PerformanceMonitor.swift
//  Andernet Posture
//
//  Lightweight performance instrumentation for optimization.
//  Uses os_signpost for zero-overhead profiling with Instruments,
//  and maintains rolling statistics for runtime monitoring.
//

import Foundation
import os.log
import os.signpost
import QuartzCore

// MARK: - PerformanceMonitor

/// Centralized performance monitoring with signpost integration and rolling statistics.
/// Uses `os_signpost` for Instruments profiling and maintains lightweight per-operation stats.
///
/// Usage:
/// ```
/// // Measure a synchronous block:
/// PerformanceMonitor.measure(.postureAnalysis) {
///     postureAnalyzer.analyze(joints: joints)
/// }
///
/// // Manual begin/end for spans crossing call boundaries:
/// let token = PerformanceMonitor.begin(.frameProcessing)
/// // ... work ...
/// PerformanceMonitor.end(token)
///
/// // Check stats:
/// if let stats = PerformanceMonitor.stats(for: .frameProcessing) {
///     print("Avg: \(stats.averageMs)ms, P95: \(stats.p95Ms)ms")
/// }
/// ```
enum PerformanceMonitor {

    // MARK: - Operation Identifiers

    /// Tracked operations across the app, grouped by subsystem.
    enum Operation: String, CaseIterable, Sendable {
        // Real-time hot path (per-frame, 30–60 Hz)
        case jointExtraction        = "Joint Extraction"
        case frameProcessing        = "Frame Processing"
        case postureAnalysis        = "Posture Analysis"
        case gaitAnalysis           = "Gait Analysis"
        case romAnalysis            = "ROM Analysis"
        case balanceAnalysis        = "Balance Analysis"
        case ergonomicScoring       = "Ergonomic Scoring"
        case fatigueTracking        = "Fatigue Tracking"
        case skeletonOverlay        = "Skeleton Overlay"
        case overlayRendering       = "Overlay Rendering"
        case frameRecording         = "Frame Recording"

        // Session lifecycle (one-shot)
        case sessionSave            = "Session Save"
        case sessionFinalization    = "Session Finalization"
        case healthKitSave          = "HealthKit Save"
        case healthKitFetch         = "HealthKit Fetch"

        // Export (user-triggered)
        case pdfGeneration          = "PDF Generation"
        case csvGeneration          = "CSV Generation"

        // Dashboard / UI (on-appear)
        case dashboardRefresh       = "Dashboard Refresh"
        case insightsGeneration     = "Insights Generation"
        case sessionDecode          = "Session Decode"
        case sessionAnalysis        = "Session Analysis"

        /// The subsystem category for grouping in logs and Instruments.
        var category: String {
            switch self {
            case .jointExtraction, .skeletonOverlay, .overlayRendering:
                return "ARTracking"
            case .frameProcessing, .frameRecording:
                return "Capture"
            case .postureAnalysis, .gaitAnalysis, .romAnalysis,
                 .balanceAnalysis, .ergonomicScoring, .fatigueTracking:
                return "Analysis"
            case .sessionSave, .sessionFinalization:
                return "Persistence"
            case .healthKitSave, .healthKitFetch:
                return "HealthKit"
            case .pdfGeneration, .csvGeneration:
                return "Export"
            case .dashboardRefresh, .insightsGeneration, .sessionDecode, .sessionAnalysis:
                return "UI"
            }
        }
    }

    // MARK: - Measurement Token

    /// Opaque token returned by `begin()` to pair with `end()`.
    struct Token: Sendable {
        let operation: Operation
        let startTime: UInt64
        let signpostID: OSSignpostID
    }

    // MARK: - Rolling Statistics

    /// Lightweight rolling statistics for a single operation.
    final class OperationStats: @unchecked Sendable {
        private let lock = NSLock()
        private var samples: [Double] = []
        private let maxSamples: Int

        /// Running totals for O(1) average.
        private var totalMs: Double = 0
        private var count: Int = 0
        private var peakMs: Double = 0

        /// Budget threshold in ms — exceeding this triggers a warning.
        let budgetMs: Double?

        init(maxSamples: Int = 300, budgetMs: Double? = nil) {
            self.maxSamples = maxSamples
            self.budgetMs = budgetMs
            self.samples.reserveCapacity(maxSamples)
        }

        func record(_ durationMs: Double) {
            lock.lock()
            defer { lock.unlock() }

            count += 1
            totalMs += durationMs
            if durationMs > peakMs { peakMs = durationMs }

            if samples.count >= maxSamples {
                samples.removeFirst()
            }
            samples.append(durationMs)
        }

        var averageMs: Double {
            lock.lock()
            defer { lock.unlock() }
            return !samples.isEmpty ? totalMs / Double(count) : 0
        }

        var recentAverageMs: Double {
            lock.lock()
            defer { lock.unlock() }
            guard !samples.isEmpty else { return 0 }
            return samples.reduce(0, +) / Double(samples.count)
        }

        var peakDurationMs: Double {
            lock.lock()
            defer { lock.unlock() }
            return peakMs
        }

        var sampleCount: Int {
            lock.lock()
            defer { lock.unlock() }
            return count
        }

        /// 95th percentile of recent samples.
        var p95Ms: Double {
            lock.lock()
            defer { lock.unlock() }
            guard samples.count >= 5 else { return peakMs }
            let sorted = samples.sorted()
            let idx = Int(Double(sorted.count) * 0.95)
            return sorted[min(idx, sorted.count - 1)]
        }

        func reset() {
            lock.lock()
            defer { lock.unlock() }
            samples.removeAll(keepingCapacity: true)
            totalMs = 0
            count = 0
            peakMs = 0
        }
    }

    // MARK: - Private State

    /// Signpost log for Instruments integration.
    private static let signpostLog = OSLog(
        subsystem: Bundle.main.bundleIdentifier ?? "dev.andernet.posture",
        category: "Performance"
    )

    /// Logger for performance warnings.
    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "dev.andernet.posture",
        category: "Performance"
    )

    /// Per-operation rolling statistics with frame budgets.
    private static let operationStats: [Operation: OperationStats] = {
        var stats: [Operation: OperationStats] = [:]
        for op in Operation.allCases {
            let budget: Double? = {
                switch op {
                // Per-frame operations must complete within frame budget.
                // At 60 fps, total frame budget is ~16.6ms.
                case .frameProcessing:    return 12.0  // entire frame pipeline
                case .postureAnalysis:    return 3.0
                case .gaitAnalysis:       return 2.0
                case .jointExtraction:    return 2.0
                case .skeletonOverlay:    return 3.0
                case .overlayRendering:   return 3.0
                case .romAnalysis:        return 1.5
                case .balanceAnalysis:    return 1.0
                case .ergonomicScoring:   return 1.0
                case .fatigueTracking:    return 0.5
                case .frameRecording:     return 1.0

                // One-shot operations — generous budgets
                case .sessionSave:        return 2000.0
                case .sessionFinalization: return 500.0
                case .healthKitSave:      return 3000.0
                case .healthKitFetch:     return 5000.0

                // Export
                case .pdfGeneration:      return 5000.0
                case .csvGeneration:      return 3000.0

                // UI
                case .dashboardRefresh:   return 500.0
                case .insightsGeneration: return 200.0
                case .sessionDecode:      return 1000.0
                case .sessionAnalysis:    return 500.0
                }
            }()
            stats[op] = OperationStats(
                maxSamples: op.category == "ARTracking" || op.category == "Analysis" ? 600 : 100,
                budgetMs: budget
            )
        }
        return stats
    }()

    /// Throttle budget-exceeded warnings to avoid log spam (per-operation).
    private static var lastWarningTime: [Operation: TimeInterval] = [:]
    private static let warningLock = NSLock()
    private static let warningThrottleInterval: TimeInterval = 5.0 // seconds

    /// Master switch — disable all monitoring for release builds if desired.
    static var isEnabled: Bool = true

    // MARK: - Public API

    /// Begin a measured span. Returns a `Token` to pass to `end()`.
    @inline(__always)
    static func begin(_ operation: Operation) -> Token {
        let id = OSSignpostID(log: signpostLog)
        if isEnabled {
            os_signpost(.begin, log: signpostLog, name: "Operation", signpostID: id, "%{public}s", operation.rawValue)
        }
        return Token(
            operation: operation,
            startTime: mach_absolute_time(),
            signpostID: id
        )
    }

    /// End a measured span started by `begin()`. Records duration and checks budget.
    @inline(__always)
    static func end(_ token: Token) {
        let endTime = mach_absolute_time()
        if isEnabled {
            os_signpost(.end, log: signpostLog, name: "Operation", signpostID: token.signpostID, "%{public}s", token.operation.rawValue)
        }

        let durationMs = machToMilliseconds(endTime - token.startTime)
        record(token.operation, durationMs: durationMs)
    }

    /// Measure a synchronous block and return its result.
    @inline(__always)
    @discardableResult
    static func measure<T>(_ operation: Operation, body: () throws -> T) rethrows -> T {
        let token = begin(operation)
        defer { end(token) }
        return try body()
    }

    /// Measure an async operation.
    @discardableResult
    static func measureAsync<T>(_ operation: Operation, body: () async throws -> T) async rethrows -> T {
        let token = begin(operation)
        defer { end(token) }
        return try await body()
    }

    /// Retrieve statistics for a specific operation.
    static func stats(for operation: Operation) -> OperationStats? {
        operationStats[operation]
    }

    /// Generate a summary report of all tracked operations.
    static func report() -> String {
        var lines: [String] = ["=== Performance Report ==="]
        let grouped = Dictionary(grouping: Operation.allCases, by: \.category)

        for category in grouped.keys.sorted() {
            lines.append("\n[\(category)]")
            for op in grouped[category] ?? [] {
                guard let s = operationStats[op], s.sampleCount > 0 else { continue }
                let budgetStr: String
                if let budget = s.budgetMs {
                    let status = s.recentAverageMs > budget ? "⚠️ OVER" : "✅"
                    budgetStr = " budget: \(String(format: "%.1f", budget))ms \(status)"
                } else {
                    budgetStr = ""
                }
                lines.append(
                    "  \(op.rawValue): avg=\(String(format: "%.2f", s.recentAverageMs))ms " +
                    "p95=\(String(format: "%.2f", s.p95Ms))ms " +
                    "peak=\(String(format: "%.2f", s.peakDurationMs))ms " +
                    "n=\(s.sampleCount)\(budgetStr)"
                )
            }
        }
        return lines.joined(separator: "\n")
    }

    /// Log the current report via os_log.
    static func logReport() {
        logger.info("\(report())")
    }

    /// Reset all collected statistics.
    static func resetAll() {
        for (_, stats) in operationStats {
            stats.reset()
        }
        warningLock.lock()
        lastWarningTime.removeAll()
        warningLock.unlock()
    }

    // MARK: - Private

    private static func record(_ operation: Operation, durationMs: Double) {
        guard let stats = operationStats[operation] else { return }
        stats.record(durationMs)

        // Check budget and warn (throttled)
        if let budget = stats.budgetMs, durationMs > budget {
            warningLock.lock()
            let now = CACurrentMediaTime()
            let lastWarning = lastWarningTime[operation] ?? 0
            let shouldWarn = now - lastWarning > warningThrottleInterval
            if shouldWarn {
                lastWarningTime[operation] = now
            }
            warningLock.unlock()

            if shouldWarn {
                let dur = String(format: "%.2f", durationMs)
                let bud = String(format: "%.1f", budget)
                let avg = String(format: "%.2f", stats.recentAverageMs)
                let p95 = String(format: "%.2f", stats.p95Ms)
                // swiftlint:disable:next line_length
                logger.warning("⚠️ \(operation.rawValue, privacy: .public) exceeded budget: \(dur, privacy: .public)ms > \(bud, privacy: .public)ms (avg: \(avg, privacy: .public)ms, p95: \(p95, privacy: .public)ms)")
            }
        }
    }

    /// Convert mach_absolute_time ticks to milliseconds.
    private static func machToMilliseconds(_ ticks: UInt64) -> Double {
        var info = mach_timebase_info_data_t()
        mach_timebase_info(&info)
        let nanoseconds = Double(ticks) * Double(info.numer) / Double(info.denom)
        return nanoseconds / 1_000_000.0
    }
}


