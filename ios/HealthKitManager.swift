import WebKit

class HealthKitManager: NSObject, ObservableObject {
    private let healthStore = HKHealthStore()
    private var webView: WKWebView?

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
        super.init()
        checkAuthorizationStatus()
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
                self.startRealTimeMonitoring()
            }
        }
    }

    // Start real-time health data monitoring
    private func startRealTimeMonitoring() {
        startHeartRateMonitoring()
        startWalkingSteadinessMonitoring()
        startActivityMonitoring()
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

                let data: [String: Any] = [
                    "type": "heart_rate",
                    "value": heartRate,
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate),
                    "device": sample.device?.name ?? "Unknown",
                    "source": sample.sourceRevision.source.name
                ]

                DispatchQueue.main.async {
                    self?.sendMessageToWebApp(type: "live_health_data", data: data)
                }
            }
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, newAnchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))

                let data: [String: Any] = [
                    "type": "heart_rate",
                    "value": heartRate,
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate),
                    "device": sample.device?.name ?? "Unknown",
                    "source": sample.sourceRevision.source.name
                ]

                DispatchQueue.main.async {
                    self?.sendMessageToWebApp(type: "live_health_data", data: data)
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

                let data: [String: Any] = [
                    "type": "walking_steadiness",
                    "value": steadiness,
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate),
                    "device": sample.device?.name ?? "Unknown",
                    "source": sample.sourceRevision.source.name
                ]

                DispatchQueue.main.async {
                    self?.sendMessageToWebApp(type: "live_health_data", data: data)
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

                let data: [String: Any] = [
                    "type": "step_count",
                    "value": steps,
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate),
                    "device": sample.device?.name ?? "Unknown",
                    "source": sample.sourceRevision.source.name
                ]

                DispatchQueue.main.async {
                    self?.sendMessageToWebApp(type: "live_health_data", data: data)
                }
            }
        }

        healthStore.execute(query)
    }

    // Send data to React web application
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
                    "timestamp": ISO8601DateFormatter().string(from: sample.startDate),
                    "device": sample.device?.name ?? "Unknown",
                    "source": sample.sourceRevision.source.name
                ]
            }

            let data: [String: Any] = [
                "type": type.rawValue,
                "samples": historicalData,
                "startDate": ISO8601DateFormatter().string(from: startDate),
                "endDate": ISO8601DateFormatter().string(from: endDate)
            ]

            DispatchQueue.main.async {
                self?.sendMessageToWebApp(type: "historical_data", data: data)
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
