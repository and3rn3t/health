//
//  PedometerService.swift
//  Andernet Posture
//
//  CMPedometer integration for hardware-fused step counting,
//  distance estimation, cadence, pace, and floor counting.
//  Runs alongside or independently of ARKit body tracking.
//
//  CMPedometer provides Apple's sensor-fusion pedometer which
//  combines accelerometer + barometer + GPS (when available)
//  for highly accurate step/distance data.
//
//  References:
//  - Apple CMPedometer documentation
//  - Fortune E et al., Gait & Posture, 2014 (smartphone pedometry validation)
//

import Foundation
import CoreMotion
import os.log

// MARK: - Pedometer Data Snapshot

/// Real-time pedometer data from CMPedometer.
struct PedometerSnapshot: Codable, Sendable {
    let timestamp: Date
    /// Total steps since pedometer started.
    let stepCount: Int
    /// Estimated distance in meters (sensor-fused).
    let distanceM: Double?
    /// Current pace in seconds per meter.
    let currentPaceSPM: Double?
    /// Current cadence in steps per minute.
    let currentCadenceSPM: Double?
    /// Floors ascended since start.
    let floorsAscended: Int?
    /// Floors descended since start.
    let floorsDescended: Int?
    /// Average active pace in seconds per meter.
    let averageActivePaceSPM: Double?
}

// MARK: - Protocol

/// Protocol for pedometer data access.
protocol PedometerService: AnyObject {
    /// Whether step counting is available on this device.
    var isStepCountingAvailable: Bool { get }
    /// Whether distance estimation is available.
    var isDistanceAvailable: Bool { get }
    /// Whether floor counting is available (barometer).
    var isFloorCountingAvailable: Bool { get }
    /// Whether cadence data is available.
    var isCadenceAvailable: Bool { get }
    /// Whether pace data is available.
    var isPaceAvailable: Bool { get }

    /// Callback for live pedometer updates.
    var onPedometerUpdate: ((PedometerSnapshot) -> Void)? { get set }

    /// Start live pedometer updates.
    func startLiveUpdates()

    /// Stop pedometer updates.
    func stop()

    /// Query historical step data for a date range.
    func querySteps(from start: Date, to end: Date) async throws -> PedometerSnapshot

    /// Latest snapshot (thread-safe).
    var latestSnapshot: PedometerSnapshot? { get }
}

// MARK: - CMPedometer Implementation

final class CorePedometerService: PedometerService {

    private let pedometer = CMPedometer()
    private let queue = DispatchQueue(label: "com.andernet.posture.pedometer", qos: .userInitiated)

    private var _latestSnapshot: PedometerSnapshot?
    private let lock = NSLock()

    var isStepCountingAvailable: Bool { CMPedometer.isStepCountingAvailable() }
    var isDistanceAvailable: Bool { CMPedometer.isDistanceAvailable() }
    var isFloorCountingAvailable: Bool { CMPedometer.isFloorCountingAvailable() }
    var isCadenceAvailable: Bool { CMPedometer.isCadenceAvailable() }
    var isPaceAvailable: Bool { CMPedometer.isPaceAvailable() }

    var onPedometerUpdate: ((PedometerSnapshot) -> Void)?

    var latestSnapshot: PedometerSnapshot? {
        lock.withLock { _latestSnapshot }
    }

    func startLiveUpdates() {
        guard CMPedometer.isStepCountingAvailable() else {
            AppLogger.motion.warning("CMPedometer step counting not available")
            return
        }

        let startDate = Date()
        AppLogger.motion.info("CMPedometer live updates started")

        pedometer.startUpdates(from: startDate) { [weak self] data, error in
            guard let self else { return }
            if let error {
                AppLogger.motion.error("CMPedometer update error: \(error.localizedDescription)")
                return
            }
            guard let data else { return }

            let snapshot = PedometerSnapshot(
                timestamp: data.endDate,
                stepCount: data.numberOfSteps.intValue,
                distanceM: data.distance?.doubleValue,
                currentPaceSPM: data.currentPace?.doubleValue,
                currentCadenceSPM: data.currentCadence.map { $0.doubleValue * 60.0 },  // steps/sec → steps/min
                floorsAscended: data.floorsAscended?.intValue,
                floorsDescended: data.floorsDescended?.intValue,
                averageActivePaceSPM: data.averageActivePace?.doubleValue
            )

            self.lock.withLock { self._latestSnapshot = snapshot }
            DispatchQueue.main.async {
                self.onPedometerUpdate?(snapshot)
            }
        }
    }

    func stop() {
        pedometer.stopUpdates()
        AppLogger.motion.info("CMPedometer stopped")
    }

    func querySteps(from start: Date, to end: Date) async throws -> PedometerSnapshot {
        try await withCheckedThrowingContinuation { continuation in
            pedometer.queryPedometerData(from: start, to: end) { data, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let data else {
                    continuation.resume(throwing: PedometerError.noData)
                    return
                }
                let snapshot = PedometerSnapshot(
                    timestamp: data.endDate,
                    stepCount: data.numberOfSteps.intValue,
                    distanceM: data.distance?.doubleValue,
                    currentPaceSPM: data.currentPace?.doubleValue,
                    currentCadenceSPM: data.currentCadence.map { $0.doubleValue * 60.0 },
                    floorsAscended: data.floorsAscended?.intValue,
                    floorsDescended: data.floorsDescended?.intValue,
                    averageActivePaceSPM: data.averageActivePace?.doubleValue
                )
                continuation.resume(returning: snapshot)
            }
        }
    }
}

enum PedometerError: Error, LocalizedError {
    case noData
    case notAvailable

    var errorDescription: String? {
        switch self {
        case .noData: return "No pedometer data available for the requested period."
        case .notAvailable: return "Pedometer hardware is not available on this device."
        }
    }
}
