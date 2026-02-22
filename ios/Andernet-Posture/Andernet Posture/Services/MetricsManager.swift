//
//  MetricsManager.swift
//  Andernet Posture
//
//  Production performance monitoring using MetricKit.
//  Collects daily metric payloads and diagnostic reports
//  (crashes, hangs, CPU/disk-write exceptions) automatically
//  delivered by the system in TestFlight and App Store builds.
//

import Foundation
import MetricKit
import os.log

/// Collects and reports app performance metrics in production using MetricKit.
/// This helps identify performance issues, crashes, and battery usage in the wild.
///
/// MetricKit delivers payloads at most once per day. Diagnostic payloads
/// (crashes, hangs) are delivered on the next launch after the event.
///
/// Usage: initialized once at app startup via `_ = MetricsManager.shared`
/// (guarded by `#if !DEBUG` in `Andernet_PostureApp.init`).
@MainActor
final class MetricsManager: NSObject, MXMetricManagerSubscriber {

    static let shared = MetricsManager()

    private override init() {
        super.init()
        MXMetricManager.shared.add(self)
        AppLogger.performance.info("MetricsManager subscribed to MetricKit")
    }

    deinit {
        MXMetricManager.shared.remove(self)
    }

    // MARK: - MXMetricManagerSubscriber

    /// Called when new metric payloads are available (typically once daily).
    nonisolated func didReceive(_ payloads: [MXMetricPayload]) {
        Task { @MainActor in
            for payload in payloads {
                processMetricPayload(payload)
            }
        }
    }

    /// Called when diagnostic payloads are available (crashes, hangs, etc.).
    nonisolated func didReceive(_ payloads: [MXDiagnosticPayload]) {
        Task { @MainActor in
            for payload in payloads {
                processDiagnosticPayload(payload)
            }
        }
    }

    // MARK: - Metric Processing

    private func processMetricPayload(_ payload: MXMetricPayload) {
        AppLogger.performance.info("MetricKit payload: \(payload.timeStampBegin) – \(payload.timeStampEnd)")

        // CPU
        if let cpu = payload.cpuMetrics {
            let seconds = cpu.cumulativeCPUTime.converted(to: .seconds).value
            AppLogger.performance.info("CPU cumulative: \(seconds, format: .fixed(precision: 2))s")
        }

        // Memory
        if let mem = payload.memoryMetrics {
            let peakMB = mem.peakMemoryUsage.converted(to: .megabytes).value
            let avgSuspendedMB = mem.averageSuspendedMemory.averageMeasurement.converted(to: .megabytes).value
            AppLogger.performance.info("Memory — peak: \(peakMB, format: .fixed(precision: 1))MB, avg suspended: \(avgSuspendedMB, format: .fixed(precision: 1))MB")
        }

        // Animation / scroll hitches
        if let anim = payload.animationMetrics {
            let hitchRatio = anim.scrollHitchTimeRatio
            AppLogger.performance.info("Scroll hitch ratio: \(hitchRatio)")
        }

        // Launch
        if let launch = payload.applicationLaunchMetrics {
            if let resumeMs = approximateAverage(from: launch.histogrammedApplicationResumeTime)?
                .converted(to: .milliseconds).value {
                AppLogger.performance.info("Average resume time: \(resumeMs, format: .fixed(precision: 1))ms")
            }
        }

        // Responsiveness (main-thread hangs)
        if let resp = payload.applicationResponsivenessMetrics {
            if let hangMs = approximateAverage(from: resp.histogrammedApplicationHangTime)?
                .converted(to: .milliseconds).value {
                if hangMs > 250 {
                    AppLogger.performance.warning("Average hang time elevated: \(hangMs, format: .fixed(precision: 1))ms")
                } else {
                    AppLogger.performance.info("Average hang time: \(hangMs, format: .fixed(precision: 1))ms")
                }
            }
        }

        // Network transfer
        if let net = payload.networkTransferMetrics {
            let cellMB = net.cumulativeCellularDownload.converted(to: .megabytes).value
            let wifiMB = net.cumulativeWifiDownload.converted(to: .megabytes).value
            AppLogger.performance.info("Network — cellular: \(cellMB, format: .fixed(precision: 2))MB, WiFi: \(wifiMB, format: .fixed(precision: 2))MB")
        }
    }

    // MARK: - Histogram Helpers

    /// Computes a weighted-midpoint average from an MXHistogram's buckets.
    private func approximateAverage<U: Unit>(from histogram: MXHistogram<U>) -> Measurement<U>? {
        var totalCount = 0
        var weightedSum = 0.0
        var bucketUnit: U?
        let enumerator = histogram.bucketEnumerator
        while let bucket = enumerator.nextObject() as? MXHistogramBucket<U> {
            bucketUnit = bucket.bucketStart.unit
            let midpoint = (bucket.bucketStart.value + bucket.bucketEnd.value) / 2.0
            weightedSum += midpoint * Double(bucket.bucketCount)
            totalCount += bucket.bucketCount
        }
        guard totalCount > 0, let unit = bucketUnit else { return nil }
        return Measurement(value: weightedSum / Double(totalCount), unit: unit)
    }

    // MARK: - Diagnostic Processing

    private func processDiagnosticPayload(_ payload: MXDiagnosticPayload) {
        AppLogger.performance.error("Diagnostic payload: \(payload.timeStampBegin) – \(payload.timeStampEnd)")

        // Crashes
        if let crashes = payload.crashDiagnostics {
            for crash in crashes {
                let signal = crash.signal?.intValue ?? 0
                let exception = crash.exceptionType?.intValue ?? 0
                AppLogger.performance.error("Crash — signal: \(signal), exception type: \(exception)")

                let bytes = crash.callStackTree.jsonRepresentation().count
                AppLogger.performance.error("Call stack: \(bytes) bytes")
            }
        }

        // Hangs
        if let hangs = payload.hangDiagnostics {
            for hang in hangs {
                let seconds = hang.hangDuration.converted(to: .seconds).value
                AppLogger.performance.warning("Hang — duration: \(seconds, format: .fixed(precision: 2))s")
            }
        }

        // CPU exceptions (sustained high CPU)
        if let cpuExceptions = payload.cpuExceptionDiagnostics {
            for exc in cpuExceptions {
                let totalSec = exc.totalCPUTime.converted(to: .seconds).value
                AppLogger.performance.warning("CPU exception — total: \(totalSec, format: .fixed(precision: 2))s")
            }
        }

        // Disk write exceptions
        if let diskExceptions = payload.diskWriteExceptionDiagnostics {
            for exc in diskExceptions {
                let totalMB = exc.totalWritesCaused.converted(to: .megabytes).value
                AppLogger.performance.warning("Disk write exception — total: \(totalMB, format: .fixed(precision: 2))MB")
            }
        }
    }
}
