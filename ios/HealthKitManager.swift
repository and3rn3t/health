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
        startStepCountMonitoring()
        startFallDetectionMonitoring()

        // Schedule background data sync every 15 minutes
        scheduleBackgroundDataSync()
    }

    // MARK: - Heart Rate Monitoring
    private func startHeartRateMonitoring() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }

        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processHeartRateSamples(samples)
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processHeartRateSamples(samples)
        }

        healthStore.execute(query)
    }

    private func processHeartRateSamples(_ samples: [HKSample]?) {
        guard let samples = samples as? [HKQuantitySample] else { return }

        for sample in samples {
            let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            let timestamp = sample.startDate.timeIntervalSince1970

            let healthData = [
                "type": "heart_rate",
                "value": heartRate,
                "unit": "bpm",
                "timestamp": timestamp,
                "source": sample.sourceRevision.source.name
            ] as [String: Any]

            // Send real-time update via WebSocket
            Task {
                await self.sendLiveHealthUpdate(healthData)
            }

            // Check for heart rate alerts
            if let alert = HealthAnalytics.checkHeartRateAlerts(heartRate) {
                Task {
                    await self.sendEmergencyAlert(type: "heart_rate", alert: alert, value: heartRate)
                }
            }
        }
    }

    // MARK: - Walking Steadiness Monitoring
    private func startWalkingSteadinessMonitoring() {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else { return }

        let query = HKAnchoredObjectQuery(
            type: steadinessType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processWalkingSteadinessSamples(samples)
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processWalkingSteadinessSamples(samples)
        }

        healthStore.execute(query)
    }

    private func processWalkingSteadinessSamples(_ samples: [HKSample]?) {
        guard let samples = samples as? [HKQuantitySample] else { return }

        for sample in samples {
            let steadiness = sample.quantity.doubleValue(for: HKUnit.percent()) * 100
            let timestamp = sample.startDate.timeIntervalSince1970

            let healthData = [
                "type": "walking_steadiness",
                "value": steadiness,
                "unit": "percent",
                "timestamp": timestamp,
                "source": sample.sourceRevision.source.name
            ] as [String: Any]

            // Send real-time update via WebSocket
            Task {
                await self.sendLiveHealthUpdate(healthData)
            }

            // Check for fall risk alerts
            if let alert = HealthAnalytics.checkFallRiskAlerts(steadiness) {
                Task {
                    await self.sendEmergencyAlert(type: "fall_risk", alert: alert, value: steadiness)
                }
            }
        }
    }

    // MARK: - Step Count Monitoring
    private func startStepCountMonitoring() {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }

        let query = HKAnchoredObjectQuery(
            type: stepType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processStepCountSamples(samples)
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processStepCountSamples(samples)
        }

        healthStore.execute(query)
    }

    private func processStepCountSamples(_ samples: [HKSample]?) {
        guard let samples = samples as? [HKQuantitySample] else { return }

        for sample in samples {
            let stepCount = sample.quantity.doubleValue(for: HKUnit.count())
            let timestamp = sample.startDate.timeIntervalSince1970

            let healthData = [
                "type": "step_count",
                "value": stepCount,
                "unit": "steps",
                "timestamp": timestamp,
                "source": sample.sourceRevision.source.name
            ] as [String: Any]

            // Send real-time update via WebSocket
            Task {
                await self.sendLiveHealthUpdate(healthData)
            }
        }
    }

    // MARK: - Fall Detection Monitoring (Apple Watch)
    private func startFallDetectionMonitoring() {
        // Note: Fall detection events are available through HealthKit
        // but actual fall detection is handled by watchOS automatically
        guard let fallType = HKCategoryType.categoryType(forIdentifier: .appleFallsDetection) else { return }

        let query = HKAnchoredObjectQuery(
            type: fallType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processFallDetectionSamples(samples)
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processFallDetectionSamples(samples)
        }

        healthStore.execute(query)
    }

    private func processFallDetectionSamples(_ samples: [HKSample]?) {
        guard let samples = samples as? [HKCategorySample] else { return }

        for sample in samples {
            if sample.value == HKCategoryValueAppleFallsDetection.fallDetected.rawValue {
                let timestamp = sample.startDate.timeIntervalSince1970

                let healthData = [
                    "type": "fall_detected",
                    "value": 1,
                    "unit": "event",
                    "timestamp": timestamp,
                    "source": sample.sourceRevision.source.name
                ] as [String: Any]

                // Send immediate emergency alert for fall detection
                Task {
                    await self.sendEmergencyAlert(
                        type: "fall_detected",
                        alert: ["level": "critical", "message": "Fall detected by Apple Watch"],
                        value: 1
                    )
                    await self.sendLiveHealthUpdate(healthData)
                }
            }
        }
    }

    // MARK: - Background Data Sync
    private func scheduleBackgroundDataSync() {
        Timer.scheduledTimer(withTimeInterval: 900, repeats: true) { [weak self] _ in
            Task {
                await self?.syncHistoricalData()
            }
        }
    }

    private func syncHistoricalData() async {
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .hour, value: -1, to: endDate) ?? Date()

        await syncHeartRateHistory(from: startDate, to: endDate)
        await syncWalkingSteadinessHistory(from: startDate, to: endDate)
        await syncStepCountHistory(from: startDate, to: endDate)
    }

    private func syncHeartRateHistory(from startDate: Date, to endDate: Date) async {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            let heartRateData = samples.map { sample in
                [
                    "timestamp": sample.startDate.timeIntervalSince1970,
                    "value": sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())),
                    "unit": "bpm"
                ]
            }

            let historicalData = [
                "type": "heart_rate",
                "samples": heartRateData
            ] as [String: Any]

            Task {
                await self?.sendHistoricalDataUpdate(historicalData)
            }
        }

        healthStore.execute(query)
    }

    private func syncWalkingSteadinessHistory(from startDate: Date, to endDate: Date) async {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else { return }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKSampleQuery(
            sampleType: steadinessType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            let steadinessData = samples.map { sample in
                [
                    "timestamp": sample.startDate.timeIntervalSince1970,
                    "value": sample.quantity.doubleValue(for: HKUnit.percent()) * 100,
                    "unit": "percent"
                ]
            }

            let historicalData = [
                "type": "walking_steadiness",
                "samples": steadinessData
            ] as [String: Any]

            Task {
                await self?.sendHistoricalDataUpdate(historicalData)
            }
        }

        healthStore.execute(query)
    }

    private func syncStepCountHistory(from startDate: Date, to endDate: Date) async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKSampleQuery(
            sampleType: stepType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            let stepData = samples.map { sample in
                [
                    "timestamp": sample.startDate.timeIntervalSince1970,
                    "value": sample.quantity.doubleValue(for: HKUnit.count()),
                    "unit": "steps"
                ]
            }

            let historicalData = [
                "type": "step_count",
                "samples": stepData
            ] as [String: Any]

            Task {
                await self?.sendHistoricalDataUpdate(historicalData)
            }
        }

        healthStore.execute(query)
    }
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

    // MARK: - WebSocket Messaging
    private func sendLiveHealthUpdate(_ healthData: [String: Any]) async {
        await ensureConnected()

        let message = [
            "type": "live_health_update",
            "data": healthData,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ] as [String: Any]

        ws.send(message)

        // Also send to WebView if available
        sendMessageToWebApp(type: "live_health_update", data: healthData)
    }

    private func sendHistoricalDataUpdate(_ historicalData: [String: Any]) async {
        await ensureConnected()

        let message = [
            "type": "historical_data_update",
            "data": historicalData,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ] as [String: Any]

        ws.send(message)

        // Also send to WebView if available
        sendMessageToWebApp(type: "historical_data_update", data: historicalData)
    }

    private func sendEmergencyAlert(type: String, alert: [String: Any], value: Double) async {
        await ensureConnected()

        let alertData = [
            "metric_type": type,
            "alert_level": alert["level"] as? String ?? "warning",
            "message": alert["message"] as? String ?? "Health alert",
            "value": value,
            "timestamp": Date().timeIntervalSince1970,
            "user_id": userId
        ] as [String: Any]

        let message = [
            "type": "emergency_alert",
            "data": alertData,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ] as [String: Any]

        ws.send(message)

        // Also send to WebView if available
        sendMessageToWebApp(type: "emergency_alert", data: alertData)
    }

    private func sendMessageToWebApp(type: String, data: [String: Any]) {
        guard let webView = webView else { return }

        let message = [
            "type": type,
            "data": data
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: message, options: [])
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                let script = "window.dispatchEvent(new CustomEvent('healthkit_message', { detail: \(jsonString) }));"

                DispatchQueue.main.async {
                    webView.evaluateJavaScript(script) { result, error in
                        if let error = error {
                            print("Error sending message to WebView: \(error.localizedDescription)")
                        }
                    }
                }
            }
        } catch {
            print("Error serializing message for WebView: \(error.localizedDescription)")
        }
    }
}
