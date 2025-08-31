import Foundation
import HealthKit
import WebKit

class HealthKitManager: NSObject, ObservableObject {
    private let healthStore = HKHealthStore()
    private var webView: WKWebView?
    private let ws: WebSocketManager
    private let api: ApiClient
    private var deviceToken: String?
    private var userId: String

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

    override init() {
        // Load config (throws fatalError if missing required values)
        let cfg = AppConfig.load()
        self.ws = WebSocketManager(baseURL: cfg.wsURL)
        self.api = ApiClient(baseURL: cfg.apiBaseURL)
        self.userId = cfg.userId
        super.init()
        checkAuthorizationStatus()
        // Proactively prepare WS connection after token minting
        Task { await self.ensureConnected() }
    }

    func setWebView(_ webView: WKWebView) {
        self.webView = webView
    }

    // Request HealthKit permissions
    func requestAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("HealthKit not available on this device")
            return
        }

        healthStore.requestAuthorization(toShare: nil, read: healthDataTypes) { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    self?.isAuthorized = true
                    self?.enableBackgroundDelivery()
                    self?.startRealTimeMonitoring()
                    self?.sendMessageToWebApp(type: "healthkit_authorized", data: ["status": "success"])
                } else {
                    print("HealthKit authorization failed: \(error?.localizedDescription ?? "Unknown error")")
                    self?.sendMessageToWebApp(type: "healthkit_error", data: ["error": error?.localizedDescription ?? "Authorization failed"])
                }
            }
        }
    }

    private func checkAuthorizationStatus() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        let status = healthStore.authorizationStatus(for: heartRateType)

        DispatchQueue.main.async {
            self.authorizationStatus = status
            self.isAuthorized = status == .sharingAuthorized

            if self.isAuthorized {
                self.enableBackgroundDelivery()
                self.startRealTimeMonitoring()
            }
        }
    }

    // Establish WS connection using a short-lived device token from the Worker
    @MainActor
    private func ensureConnected() async {
        do {
            // Reuse token if valid for >60s
            if let token = deviceToken, ws.isConnected {
                return
            }
            let token = try await api.issueDeviceToken(userId: userId)
            self.deviceToken = token
            ws.connect(token: token, clientType: "ios_app", userId: userId)
        } catch {
            print("WS connect failed: \(error.localizedDescription)")
        }
    }

    // Start real-time health data monitoring
    private func startRealTimeMonitoring() {
        startHeartRateMonitoring()
        startWalkingSteadinessMonitoring()
        startActivityMonitoring()
    }

    private func enableBackgroundDelivery() {
        // Best-effort background delivery for key metrics
        let types: [HKSampleType?] = [
            HKObjectType.quantityType(forIdentifier: .heartRate),
            HKObjectType.quantityType(forIdentifier: .appleWalkingSteadiness),
            HKObjectType.quantityType(forIdentifier: .stepCount)
        ]
        for t in types.compactMap({ $0 }) {
            healthStore.enableBackgroundDelivery(for: t, frequency: .immediate) { success, error in
                if !success { print("enableBackgroundDelivery failed for \(t): \(error?.localizedDescription ?? "")") }
            }
        }
    }

    private func startHeartRateMonitoring() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }

        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, newAnchor, error in

            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                let payload: [String: Any] = [
                    "type": "heart_rate",
                    "value": heartRate,
                    "unit": "bpm"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, newAnchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                let payload: [String: Any] = [
                    "type": "heart_rate",
                    "value": heartRate,
                    "unit": "bpm"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        healthStore.execute(query)
    }

    private func startWalkingSteadinessMonitoring() {
        guard let walkingSteadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else { return }

    let query = HKAnchoredObjectQuery(
            type: walkingSteadinessType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, newAnchor, error in

            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let steadiness = sample.quantity.doubleValue(for: HKUnit.percent())
                let payload: [String: Any] = [
                    "type": "walking_steadiness",
                    "value": steadiness,
                    "unit": "%"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, newAnchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let steadiness = sample.quantity.doubleValue(for: HKUnit.percent())
                let payload: [String: Any] = [
                    "type": "walking_steadiness",
                    "value": steadiness,
                    "unit": "%"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        healthStore.execute(query)
    }

    private func startActivityMonitoring() {
        guard let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }

    let query = HKAnchoredObjectQuery(
            type: stepCountType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, newAnchor, error in

            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let steps = sample.quantity.doubleValue(for: HKUnit.count())
                let payload: [String: Any] = [
                    "type": "steps",
                    "value": steps,
                    "unit": "count"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, newAnchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let steps = sample.quantity.doubleValue(for: HKUnit.count())
                let payload: [String: Any] = [
                    "type": "steps",
                    "value": steps,
                    "unit": "count"
                ]
                DispatchQueue.main.async { [weak self] in
                    self?.streamLiveMetric(payload)
                }
            }
        }

        healthStore.execute(query)
    }

    // Send data to React web application (legacy bridge; optional)
    private func sendMessageToWebApp(type: String, data: [String: Any]) {
        let message: [String: Any] = [
            "type": type,
            "data": data,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("Failed to serialize message to JSON")
            return
        }

        let script = "window.dispatchEvent(new CustomEvent('healthkit-data', { detail: \(jsonString) }));"

        webView?.evaluateJavaScript(script) { result, error in
            if let error = error {
                print("Error sending message to web app: \(error)")
            }
        }
    }

    // Send live metric to WebSocket
    private func streamLiveMetric(_ metric: [String: Any]) {
        // Ensure connection
        Task { await self.ensureConnected() }
        ws.send(["type": "live_health_data", "data": metric])
    }

    // Fetch historical data
    func fetchHistoricalData(for type: HKQuantityTypeIdentifier, days: Int = 30) {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: type) else { return }

        let calendar = Calendar.current
        let endDate = Date()
        let startDate = calendar.date(byAdding: .day, value: -days, to: endDate)!

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

        let query = HKSampleQuery(
            sampleType: quantityType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
        ) { [weak self] query, samples, error in

            guard let samples = samples as? [HKQuantitySample] else { return }

            let historicalData = samples.map { sample in
                [
                    "value": sample.quantity.doubleValue(for: self?.getUnit(for: type) ?? HKUnit.count()),
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate)
                ]
            }

            let mappedType: String
            switch type {
            case .heartRate: mappedType = "heart_rate"
            case .stepCount: mappedType = "steps"
            case .appleWalkingSteadiness: mappedType = "walking_steadiness"
            default: mappedType = type.rawValue
            }

            let data: [String: Any] = [
                "type": mappedType,
                "samples": historicalData,
                "startDate": ISO8601DateFormatter().string(from: startDate),
                "endDate": ISO8601DateFormatter().string(from: endDate)
            ]

            DispatchQueue.main.async { [weak self] in
                // Stream as historical_data to the WS bridge
                self?.ws.send(["type": "historical_data", "data": data])
            }
        }

        healthStore.execute(query)
    }

    private func getUnit(for type: HKQuantityTypeIdentifier) -> HKUnit {
        switch type {
        case .heartRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .stepCount:
            return HKUnit.count()
        case .walkingSpeed:
            return HKUnit.meter().unitDivided(by: .second())
        case .appleWalkingSteadiness:
            return HKUnit.percent()
        default:
            return HKUnit.count()
        }
    }
}
