import Foundation
import HealthKit
import WebKit

class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    private let healthStore = HKHealthStore()
    private var webView: WKWebView?
    private var webSocketManager: WebSocketManager?
    private var deviceToken: String?
    private let userId: String

    // Health data types we want to read
    private let healthDataTypes: Set<HKObjectType> = [
        HKQuantityType.quantityType(forIdentifier: .heartRate)!,
        HKQuantityType.quantityType(forIdentifier: .stepCount)!,
        HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!,
        HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)!,
        HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness)!,
        HKCategoryType.categoryType(forIdentifier: .appleStandHour)!,
        HKWorkoutType.workoutType()
    ]

    @Published var authorizationStatus: HKAuthorizationStatus = .notDetermined
    @Published var isAuthorized = false
    @Published var lastHeartRate: Double?
    @Published var lastStepCount: Double?
    @Published var lastWalkingSteadiness: Double?

    private override init() {
        // Load config using singleton
        let config = AppConfig.shared
        self.userId = config.userId
        super.init()
        checkAuthorizationStatus()
    }

    func setWebView(_ webView: WKWebView) {
        self.webView = webView
    }

    // Request HealthKit permissions
    func requestAuthorization() async {
        print("📋 Requesting HealthKit authorization...")

        guard HKHealthStore.isHealthDataAvailable() else {
            print("❌ HealthKit not available on this device")
            return
        }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: healthDataTypes)

            await MainActor.run {
                self.checkAuthorizationStatus()
                print("✅ HealthKit authorization completed")
            }
        } catch {
            print("❌ HealthKit authorization failed: \(error)")
        }
    }

    private func checkAuthorizationStatus() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        authorizationStatus = healthStore.authorizationStatus(for: heartRateType)
        isAuthorized = authorizationStatus == .sharingAuthorized
        print("📊 HealthKit authorization status: \(authorizationStatus.rawValue)")
    }

    // Start live data streaming with WebSocket manager
    func startLiveDataStreaming(webSocketManager: WebSocketManager) async {
        print("📊 Starting live health data streaming...")
        self.webSocketManager = webSocketManager

        // Start observing health data changes
        startObservingHealthData()

        // Send initial data snapshot
        await sendCurrentHealthData()
    }

    private func startObservingHealthData() {
        // Set up background health data observers
        observeHeartRate()
        observeStepCount()
        observeWalkingSteadiness()
    }

    private func observeHeartRate() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!

        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Heart rate observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestHeartRate()
            }

            completionHandler()
        }

        healthStore.execute(query)
        healthStore.enableBackgroundDelivery(for: heartRateType, frequency: .immediate) { success, error in
            if let error = error {
                print("❌ Background delivery setup failed: \(error)")
            } else {
                print("✅ Heart rate background delivery enabled")
            }
        }
    }

    private func observeStepCount() {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!

        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Step count observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestStepCount()
            }

            completionHandler()
        }

        healthStore.execute(query)
    }

    private func observeWalkingSteadiness() {
        let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness)!

        let query = HKObserverQuery(sampleType: steadinessType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Walking steadiness observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestWalkingSteadiness()
            }

            completionHandler()
        }

        healthStore.execute(query)
    }

    private func fetchLatestHeartRate() async {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in

            if let error = error {
                print("❌ Heart rate fetch error: \(error)")
                return
            }

            guard let sample = samples?.first as? HKQuantitySample else { return }

            let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))

            Task { @MainActor in
                self?.lastHeartRate = heartRate
                await self?.sendHealthData(type: "heart_rate", value: heartRate, unit: "bpm", timestamp: sample.endDate)
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestStepCount() async {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

            if let error = error {
                print("❌ Step count fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let steps = sum.doubleValue(for: HKUnit.count())

            Task { @MainActor in
                self?.lastStepCount = steps
                await self?.sendHealthData(type: "step_count", value: steps, unit: "steps", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestWalkingSteadiness() async {
        let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness)!

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: steadinessType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in

            if let error = error {
                print("❌ Walking steadiness fetch error: \(error)")
                return
            }

            guard let sample = samples?.first as? HKQuantitySample else { return }

            let steadiness = sample.quantity.doubleValue(for: HKUnit.percent())

            Task { @MainActor in
                self?.lastWalkingSteadiness = steadiness
                await self?.sendHealthData(type: "walking_steadiness", value: steadiness, unit: "percent", timestamp: sample.endDate)
            }
        }

        healthStore.execute(query)
    }

    private func sendCurrentHealthData() async {
        // Fetch and send current health data snapshot
        await fetchLatestHeartRate()
        await fetchLatestStepCount()
        await fetchLatestWalkingSteadiness()
    }

    private func sendHealthData(type: String, value: Double, unit: String, timestamp: Date) async {
        guard let webSocketManager = self.webSocketManager else {
            print("❌ WebSocket manager not available")
            return
        }

        let healthData: [String: Any] = [
            "type": "live_health_update",
            "data": [
                "userId": userId,
                "metricType": type,
                "value": value,
                "unit": unit,
                "timestamp": ISO8601DateFormatter().string(from: timestamp),
                "deviceType": "ios_app"
            ]
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: healthData)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                await webSocketManager.send(message: jsonString)
                print("📤 Sent \(type): \(value) \(unit)")
            }
        } catch {
            print("❌ Failed to serialize health data: \(error)")
        }
    }
}
