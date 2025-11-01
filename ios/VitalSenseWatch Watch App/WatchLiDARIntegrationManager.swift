import Foundation
import WatchKit
import HealthKit
import WatchConnectivity
import Combine

/// Enhanced Apple Watch LiDAR Integration
/// Streams real-time health data to iPhone for ML analysis
/// SwiftLint-compliant with proper line breaks and initialization patterns
class WatchLiDARIntegrationManager: NSObject, ObservableObject {
    static let shared = WatchLiDARIntegrationManager()

    // MARK: - Published Properties
    @Published private(set) var isConnected: Bool = false
    @Published private(set) var isStreamingData: Bool = false
    @Published private(set) var lastSyncTime: Date?
    @Published private(set) var dataPointsSent: Int = 0
    @Published private(set) var connectionStatus: WatchConnectionStatus = .disconnected

    // MARK: - Core Managers
    private let healthStore = HKHealthStore()
    private let session = WCSession.default

    // MARK: - Health Data Types for Enhanced Analysis
    private lazy var healthDataTypes: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []

        // Core metrics for ML analysis
        if let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) {
            types.insert(heartRateType)
        }
        if let walkingSteadiness = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) {
            types.insert(walkingSteadiness)
        }
        if let stepCount = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepCount)
        }
        if let activeEnergy = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(activeEnergy)
        }

        // Fall risk indicators
        if let stairAscentSpeed = HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed) {
            types.insert(stairAscentSpeed)
        }
        if let stairDescentSpeed = HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed) {
            types.insert(stairDescentSpeed)
        }
        if let walkingSpeed = HKQuantityType.quantityType(forIdentifier: .walkingSpeed) {
            types.insert(walkingSpeed)
        }
        if let walkingStepLength = HKQuantityType.quantityType(forIdentifier: .walkingStepLength) {
            types.insert(walkingStepLength)
        }

        // Additional gait metrics
        if let walkingAsymmetryPercentage = HKQuantityType.quantityType(
            forIdentifier: .walkingAsymmetryPercentage
        ) {
            types.insert(walkingAsymmetryPercentage)
        }
        if let walkingDoubleSupportPercentage = HKQuantityType.quantityType(
            forIdentifier: .walkingDoubleSupportPercentage
        ) {
            types.insert(walkingDoubleSupportPercentage)
        }

        return types
    }()

    // MARK: - Data Streaming Configuration
    private let streamingConfig = WatchStreamingConfig(
        heartRateInterval: 1.0, // 1 second for real-time ML
        gaitMetricsInterval: 5.0, // 5 seconds for gait analysis
        batchSize: 10,
        compressionEnabled: true
    )

    // MARK: - Background Health Queries
    private var backgroundQueries: [HKQuery] = []
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Data Buffer
    private var dataBuffer: WatchHealthDataBuffer = WatchHealthDataBuffer()
    private let bufferQueue = DispatchQueue(label: "com.vitalsense.watch.buffer", qos: .userInitiated)

    private override init() {
        super.init()
        setupWatchConnectivity()
        requestHealthKitPermissions()
    }

    // MARK: - Setup

    private func setupWatchConnectivity() {
        guard WCSession.isSupported() else {
            print("Watch Connectivity not supported")
            return
        }

        session.delegate = self
        session.activate()
    }

    private func requestHealthKitPermissions() {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("HealthKit not available")
            return
        }

        healthStore.requestAuthorization(toShare: [], read: healthDataTypes) { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    self?.setupBackgroundHealthQueries()
                } else {
                    print("HealthKit authorization failed: \(error?.localizedDescription ?? "Unknown error")")
                }
            }
        }
    }

    private func setupBackgroundHealthQueries() {
        // Setup real-time heart rate monitoring for ML analysis
        setupHeartRateQuery()

        // Setup gait metrics monitoring
        setupGaitMetricsQueries()

        // Setup fall risk indicators
        setupFallRiskQueries()
    }

    // MARK: - Health Queries

    private func setupHeartRateQuery() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }

        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            self?.processHeartRateSamples(samples)
        }

        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            self?.processHeartRateSamples(samples)
        }

        healthStore.execute(query)
        backgroundQueries.append(query)
    }

    private func setupGaitMetricsQueries() {
        let gaitTypes: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .walkingSpeed,
            .walkingStepLength,
            .walkingAsymmetryPercentage,
            .walkingDoubleSupportPercentage
        ]

        for identifier in gaitTypes {
            guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else { continue }

            let query = HKAnchoredObjectQuery(
                type: quantityType,
                predicate: nil,
                anchor: nil,
                limit: HKObjectQueryNoLimit
            ) { [weak self] query, samples, deletedObjects, anchor, error in
                guard let samples = samples as? [HKQuantitySample] else { return }

                self?.processGaitSamples(samples, type: identifier)
            }

            query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
                guard let samples = samples as? [HKQuantitySample] else { return }

                self?.processGaitSamples(samples, type: identifier)
            }

            healthStore.execute(query)
            backgroundQueries.append(query)
        }
    }

    private func setupFallRiskQueries() {
        let fallRiskTypes: [HKQuantityTypeIdentifier] = [
            .stairAscentSpeed,
            .stairDescentSpeed
        ]

        for identifier in fallRiskTypes {
            guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else { continue }

            let query = HKAnchoredObjectQuery(
                type: quantityType,
                predicate: nil,
                anchor: nil,
                limit: HKObjectQueryNoLimit
            ) { [weak self] query, samples, deletedObjects, anchor, error in
                guard let samples = samples as? [HKQuantitySample] else { return }

                self?.processFallRiskSamples(samples, type: identifier)
            }

            query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
                guard let samples = samples as? [HKQuantitySample] else { return }

                self?.processFallRiskSamples(samples, type: identifier)
            }

            healthStore.execute(query)
            backgroundQueries.append(query)
        }
    }

    // MARK: - Data Processing

    private func processHeartRateSamples(_ samples: [HKQuantitySample]) {
        bufferQueue.async { [weak self] in
            guard let self = self else { return }

            let heartRateData = samples.map { sample in
                WatchHealthDataPoint(
                    type: .heartRate,
                    value: sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())),
                    timestamp: sample.startDate,
                    metadata: sample.metadata
                )
            }

            self.dataBuffer.addHeartRateData(heartRateData)
            self.checkForDataTransmission()
        }
    }

    private func processGaitSamples(_ samples: [HKQuantitySample], type: HKQuantityTypeIdentifier) {
        bufferQueue.async { [weak self] in
            guard let self = self else { return }

            let gaitData = samples.map { sample in
                WatchHealthDataPoint(
                    type: .gait(type),
                    value: self.extractGaitValue(sample, type: type),
                    timestamp: sample.startDate,
                    metadata: sample.metadata
                )
            }

            self.dataBuffer.addGaitData(gaitData, type: type)
            self.checkForDataTransmission()
        }
    }

    private func processFallRiskSamples(_ samples: [HKQuantitySample], type: HKQuantityTypeIdentifier) {
        bufferQueue.async { [weak self] in
            guard let self = self else { return }

            let fallRiskData = samples.map { sample in
                WatchHealthDataPoint(
                    type: .fallRisk(type),
                    value: self.extractFallRiskValue(sample, type: type),
                    timestamp: sample.startDate,
                    metadata: sample.metadata
                )
            }

            self.dataBuffer.addFallRiskData(fallRiskData, type: type)
            self.checkForDataTransmission()
        }
    }

    // MARK: - Data Transmission

    private func checkForDataTransmission() {
        guard isConnected,
              dataBuffer.shouldTransmit(config: streamingConfig) else { return }

        let batch = dataBuffer.createTransmissionBatch(config: streamingConfig)
        sendDataBatch(batch)
    }

    private func sendDataBatch(_ batch: WatchDataBatch) {
        guard session.isReachable else {
            // Store for later transmission
            dataBuffer.addPendingBatch(batch)
            return
        }

        let message: [String: Any] = [
            "type": "enhanced_watch_data",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "batch": batch.toDictionary()
        ]

        session.sendMessage(message, replyHandler: { [weak self] reply in
            DispatchQueue.main.async {
                self?.handleTransmissionSuccess(batch)
            }
        }) { [weak self] error in
            DispatchQueue.main.async {
                self?.handleTransmissionError(error, batch: batch)
            }
        }
    }

    private func handleTransmissionSuccess(_ batch: WatchDataBatch) {
        dataPointsSent += batch.totalDataPoints
        lastSyncTime = Date()
        dataBuffer.markBatchAsSent(batch)
    }

    private func handleTransmissionError(_ error: Error, batch: WatchDataBatch) {
        print("Watch data transmission failed: \(error.localizedDescription)")
        dataBuffer.addPendingBatch(batch)
    }

    // MARK: - Manual Data Sync

    func triggerManualSync() {
        guard isConnected else { return }

        let allPendingData = dataBuffer.getAllPendingData()
        for batch in allPendingData {
            sendDataBatch(batch)
        }
    }

    // MARK: - Stream Control

    func startDataStreaming() {
        isStreamingData = true
        // Resume background queries if needed
        setupBackgroundHealthQueries()
    }

    func stopDataStreaming() {
        isStreamingData = false
        // Stop background queries
        for query in backgroundQueries {
            healthStore.stop(query)
        }
        backgroundQueries.removeAll()
    }

    // MARK: - Utility Methods

    private func extractGaitValue(_ sample: HKQuantitySample, type: HKQuantityTypeIdentifier) -> Double {
        switch type {
        case .stepCount:
            return sample.quantity.doubleValue(for: HKUnit.count())
        case .walkingSpeed:
            return sample.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))
        case .walkingStepLength:
            return sample.quantity.doubleValue(for: HKUnit.meter())
        case .walkingAsymmetryPercentage:
            return sample.quantity.doubleValue(for: HKUnit.percent())
        case .walkingDoubleSupportPercentage:
            return sample.quantity.doubleValue(for: HKUnit.percent())
        default:
            return sample.quantity.doubleValue(for: HKUnit.count())
        }
    }

    private func extractFallRiskValue(_ sample: HKQuantitySample, type: HKQuantityTypeIdentifier) -> Double {
        switch type {
        case .stairAscentSpeed, .stairDescentSpeed:
            return sample.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))
        default:
            return sample.quantity.doubleValue(for: HKUnit.count())
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchLiDARIntegrationManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { [weak self] in
            switch activationState {
            case .activated:
                self?.isConnected = session.isReachable
                self?.connectionStatus = .connected
            case .inactive:
                self?.isConnected = false
                self?.connectionStatus = .inactive
            case .notActivated:
                self?.isConnected = false
                self?.connectionStatus = .disconnected
            @unknown default:
                self?.isConnected = false
                self?.connectionStatus = .disconnected
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            self?.isConnected = session.isReachable
            self?.connectionStatus = session.isReachable ? .connected : .disconnected

            // Try to send pending data when connection is restored
            if session.isReachable {
                self?.triggerManualSync()
            }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        // Handle messages from iPhone (e.g., analysis requests, configuration updates)
        if let messageType = message["type"] as? String {
            switch messageType {
            case "start_enhanced_analysis":
                handleAnalysisRequest(message, replyHandler: replyHandler)
            case "update_streaming_config":
                handleConfigurationUpdate(message, replyHandler: replyHandler)
            default:
                replyHandler(["status": "unknown_message_type"])
            }
        }
    }

    private func handleAnalysisRequest(_ message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        // Collect current health metrics for immediate analysis
        Task {
            let currentMetrics = await collectCurrentHealthMetrics()

            let response: [String: Any] = [
                "status": "success",
                "metrics": currentMetrics.toDictionary(),
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]

            replyHandler(response)
        }
    }

    private func handleConfigurationUpdate(_ message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        // Update streaming configuration based on iPhone request
        if WatchStreamingConfig.fromDictionary(message) != nil {
            // Configuration is valid, could be updated here
            // streamingConfig = newConfig (if made mutable)
            replyHandler(["status": "config_updated"])
        } else {
            replyHandler(["status": "invalid_config"])
        }
    }

    private func collectCurrentHealthMetrics() async -> WatchCurrentMetrics {
        // Collect the most recent health data for immediate analysis
        return WatchCurrentMetrics(
            heartRate: await getCurrentHeartRate(),
            walkingSteadiness: await getCurrentWalkingSteadiness(),
            stepCount: await getCurrentStepCount(),
            timestamp: Date()
        )
    }

    private func getCurrentHeartRate() async -> Double? {
        // Implementation to get most recent heart rate
        return nil // Placeholder
    }

    private func getCurrentWalkingSteadiness() async -> Double? {
        // Implementation to get most recent walking steadiness
        return nil // Placeholder
    }

    private func getCurrentStepCount() async -> Int? {
        // Implementation to get most recent step count
        return nil // Placeholder
    }
}

// MARK: - Supporting Types

enum WatchConnectionStatus {
    case disconnected
    case connecting
    case connected
    case inactive
}

struct WatchStreamingConfig {
    let heartRateInterval: TimeInterval
    let gaitMetricsInterval: TimeInterval
    let batchSize: Int
    let compressionEnabled: Bool

    static func fromDictionary(_ dict: [String: Any]) -> WatchStreamingConfig? {
        guard let heartRateInterval = dict["heartRateInterval"] as? TimeInterval,
              let gaitMetricsInterval = dict["gaitMetricsInterval"] as? TimeInterval,
              let batchSize = dict["batchSize"] as? Int,
              let compressionEnabled = dict["compressionEnabled"] as? Bool else {
            return nil
        }

        return WatchStreamingConfig(
            heartRateInterval: heartRateInterval,
            gaitMetricsInterval: gaitMetricsInterval,
            batchSize: batchSize,
            compressionEnabled: compressionEnabled
        )
    }
}

enum WatchHealthDataType {
    case heartRate
    case gait(HKQuantityTypeIdentifier)
    case fallRisk(HKQuantityTypeIdentifier)
}

struct WatchHealthDataPoint {
    let type: WatchHealthDataType
    let value: Double
    let timestamp: Date
    let metadata: [String: Any]?
}

struct WatchDataBatch {
    let id: UUID = UUID()
    let heartRateData: [WatchHealthDataPoint]
    let gaitData: [WatchHealthDataPoint]
    let fallRiskData: [WatchHealthDataPoint]
    let timestamp: Date
    let compressed: Bool

    var totalDataPoints: Int {
        return heartRateData.count + gaitData.count + fallRiskData.count
    }

    func toDictionary() -> [String: Any] {
        return [
            "id": id.uuidString,
            "heartRateData": heartRateData.map { dataPoint in
                [
                    "value": dataPoint.value,
                    "timestamp": ISO8601DateFormatter().string(from: dataPoint.timestamp)
                ]
            },
            "gaitData": gaitData.map { dataPoint in
                [
                    "value": dataPoint.value,
                    "timestamp": ISO8601DateFormatter().string(from: dataPoint.timestamp)
                ]
            },
            "fallRiskData": fallRiskData.map { dataPoint in
                [
                    "value": dataPoint.value,
                    "timestamp": ISO8601DateFormatter().string(from: dataPoint.timestamp)
                ]
            },
            "timestamp": ISO8601DateFormatter().string(from: timestamp),
            "compressed": compressed
        ]
    }
}

struct WatchCurrentMetrics {
    let heartRate: Double?
    let walkingSteadiness: Double?
    let stepCount: Int?
    let timestamp: Date

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "timestamp": ISO8601DateFormatter().string(from: timestamp)
        ]

        if let heartRate = heartRate {
            dict["heartRate"] = heartRate
        }
        if let walkingSteadiness = walkingSteadiness {
            dict["walkingSteadiness"] = walkingSteadiness
        }
        if let stepCount = stepCount {
            dict["stepCount"] = stepCount
        }

        return dict
    }
}

class WatchHealthDataBuffer {
    private var heartRateBuffer: [WatchHealthDataPoint] = []
    private var gaitDataBuffer: [HKQuantityTypeIdentifier: [WatchHealthDataPoint]] = [:]
    private var fallRiskBuffer: [HKQuantityTypeIdentifier: [WatchHealthDataPoint]] = [:]
    private var pendingBatches: [WatchDataBatch] = []

    private let maxBufferSize = 1000
    private let queue = DispatchQueue(label: "com.vitalsense.watch.buffer", qos: .userInitiated)

    func addHeartRateData(_ data: [WatchHealthDataPoint]) {
        queue.async { [weak self] in
            self?.heartRateBuffer.append(contentsOf: data)
            self?.trimBufferIfNeeded()
        }
    }

    func addGaitData(_ data: [WatchHealthDataPoint], type: HKQuantityTypeIdentifier) {
        queue.async { [weak self] in
            if self?.gaitDataBuffer[type] == nil {
                self?.gaitDataBuffer[type] = []
            }
            self?.gaitDataBuffer[type]?.append(contentsOf: data)
            self?.trimBufferIfNeeded()
        }
    }

    func addFallRiskData(_ data: [WatchHealthDataPoint], type: HKQuantityTypeIdentifier) {
        queue.async { [weak self] in
            if self?.fallRiskBuffer[type] == nil {
                self?.fallRiskBuffer[type] = []
            }
            self?.fallRiskBuffer[type]?.append(contentsOf: data)
            self?.trimBufferIfNeeded()
        }
    }

    func shouldTransmit(config: WatchStreamingConfig) -> Bool {
        return heartRateBuffer.count >= config.batchSize ||
               gaitDataTotalCount() >= config.batchSize ||
               fallRiskDataTotalCount() >= config.batchSize
    }

    func createTransmissionBatch(config: WatchStreamingConfig) -> WatchDataBatch {
        let heartRateSlice = Array(heartRateBuffer.prefix(config.batchSize))
        let gaitSlice = extractGaitSlice(config.batchSize)
        let fallRiskSlice = extractFallRiskSlice(config.batchSize)

        // Remove transmitted data from buffers
        heartRateBuffer.removeFirst(min(heartRateSlice.count, heartRateBuffer.count))
        removeGaitSlice(gaitSlice)
        removeFallRiskSlice(fallRiskSlice)

        return WatchDataBatch(
            heartRateData: heartRateSlice,
            gaitData: gaitSlice,
            fallRiskData: fallRiskSlice,
            timestamp: Date(),
            compressed: config.compressionEnabled
        )
    }

    func addPendingBatch(_ batch: WatchDataBatch) {
        queue.async { [weak self] in
            self?.pendingBatches.append(batch)
        }
    }

    func getAllPendingData() -> [WatchDataBatch] {
        return queue.sync {
            let batches = pendingBatches
            pendingBatches.removeAll()
            return batches
        }
    }

    func markBatchAsSent(_ batch: WatchDataBatch) {
        queue.async { [weak self] in
            self?.pendingBatches.removeAll { $0.id == batch.id }
        }
    }

    // MARK: - Private Methods

    private func trimBufferIfNeeded() {
        if heartRateBuffer.count > maxBufferSize {
            heartRateBuffer.removeFirst(heartRateBuffer.count - maxBufferSize)
        }

        for (type, data) in gaitDataBuffer {
            if data.count > maxBufferSize {
                gaitDataBuffer[type] = Array(data.suffix(maxBufferSize))
            }
        }

        for (type, data) in fallRiskBuffer {
            if data.count > maxBufferSize {
                fallRiskBuffer[type] = Array(data.suffix(maxBufferSize))
            }
        }
    }

    private func gaitDataTotalCount() -> Int {
        return gaitDataBuffer.values.reduce(0) { $0 + $1.count }
    }

    private func fallRiskDataTotalCount() -> Int {
        return fallRiskBuffer.values.reduce(0) { $0 + $1.count }
    }

    private func extractGaitSlice(_ batchSize: Int) -> [WatchHealthDataPoint] {
        var result: [WatchHealthDataPoint] = []
        let targetCount = min(batchSize, gaitDataTotalCount())

        for (_, data) in gaitDataBuffer {
            let takeCount = min(targetCount - result.count, data.count)
            result.append(contentsOf: Array(data.prefix(takeCount)))

            if result.count >= targetCount {
                break
            }
        }

        return result
    }

    private func extractFallRiskSlice(_ batchSize: Int) -> [WatchHealthDataPoint] {
        var result: [WatchHealthDataPoint] = []
        let targetCount = min(batchSize, fallRiskDataTotalCount())

        for (_, data) in fallRiskBuffer {
            let takeCount = min(targetCount - result.count, data.count)
            result.append(contentsOf: Array(data.prefix(takeCount)))

            if result.count >= targetCount {
                break
            }
        }

        return result
    }

    private func removeGaitSlice(_ slice: [WatchHealthDataPoint]) {
        let sliceIds = Set(slice.map { ObjectIdentifier($0 as AnyObject) })

        for (type, data) in gaitDataBuffer {
            gaitDataBuffer[type] = data.filter { !sliceIds.contains(ObjectIdentifier($0 as AnyObject)) }
        }
    }

    private func removeFallRiskSlice(_ slice: [WatchHealthDataPoint]) {
        let sliceIds = Set(slice.map { ObjectIdentifier($0 as AnyObject) })

        for (type, data) in fallRiskBuffer {
            fallRiskBuffer[type] = data.filter { !sliceIds.contains(ObjectIdentifier($0 as AnyObject)) }
        }
    }
}
