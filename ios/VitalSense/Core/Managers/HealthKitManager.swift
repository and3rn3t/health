//
// HealthKitManager.swift
// VitalSense
//
// Created by [Your Name] on [Date].
//
// This file is responsible for managing HealthKit data, including authorization,
// data retrieval, and data sending to the server. It acts as an intermediary
// between the HealthKit framework and the VitalSense app, ensuring that health
// data is handled securely and efficiently.
//

import Foundation
import HealthKit
import UIKit

// See docs/FIXES_SUMMARY.md ("iOS VitalSense App – Refactor & Build Plan") for the current refactor plan.

final class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    // Core HealthKit objects
    let healthStore = HKHealthStore()

    // Basic state used across extensions
    @Published var lastHeartRate: Double?
    @Published var lastStepCount: Double?
    @Published var lastDistance: Double?
    @Published var lastError: String?
    @Published var isAuthorized: Bool = false

    /// Tracks freshness of the last value we saw for a given metric key (e.g. "heart_rate", "step_count", "distance")
    @Published var healthDataFreshness: [String: Date] = [:]

    /// Active observer queries so we can keep them alive and cancel if needed
    var activeQueries: [HKQuery] = []

    private override init() {
        super.init()
    }

    // MARK: - Authorization

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            await MainActor.run {
                self.lastError = "HealthKit not available on this device"
                self.isAuthorized = false
            }
            return
        }

        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate),
            HKObjectType.quantityType(forIdentifier: .stepCount),
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)
        ].compactMap { $0 }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
            await MainActor.run {
                self.isAuthorized = true
                self.lastError = nil
            }
        } catch {
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "Authorization failed: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - Sending Data (used by extensions)

    func sendHealthData(type: String, value: Double, unit: String, timestamp: Date) async {
        print("[HealthKitManager] sendHealthData type=\(type) value=\(value) unit=\(unit) at=\(timestamp)")
        await MainActor.run {
            self.healthDataFreshness[type] = timestamp
        }
    }
}
