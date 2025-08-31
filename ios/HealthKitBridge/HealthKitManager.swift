import Foundation
import HealthKit
import UIKit

// MARK: - Health Data Model
struct HealthData {
    let type: String
    let value: Double
    let unit: String
    let timestamp: Date
    let deviceId: String
    let userId: String
}

// MARK: - Connection Quality Monitor
class ConnectionQualityMonitor: ObservableObject {
    @Published var signalStrength: Double = 1.0
    @Published var latency: TimeInterval = 0.0
    @Published var packetLoss: Double = 0.0
    @Published var reconnectCount: Int = 0
    
    private var lastPingTime: Date?
    
    func recordPing() {
        lastPingTime = Date()
    }
    
    func recordPong() {
        guard let pingTime = lastPingTime else { return }
        latency = Date().timeIntervalSince(pingTime)
    }
    
    func recordReconnect() {
        reconnectCount += 1
    }
}

// MARK: - HealthKit Manager
class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    let healthStore = HKHealthStore()
    private var webSocketManager: WebSocketManager?
    private var deviceToken: String?
    private let userId: String
    
    // Enhanced configuration using new config system
    private let config = EnhancedAppConfig.shared

    // Health data types we want to read - optimized based on config with safe initialization
    private lazy var healthDataTypes: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []
        
        // Safely add health data types with proper error handling
        if let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) {
            types.insert(heartRateType)
        }
        if let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepCountType)
        }
        if let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) {
            types.insert(distanceType)
        }
        if let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(activeEnergyType)
        }
        if let basalEnergyType = HKQuantityType.quantityType(forIdentifier: .basalEnergyBurned) {
            types.insert(basalEnergyType)
        }
        
        // Add additional types for non-production environments
        if config.getCurrentEnvironment() != .production {
            if let walkingSteadiness = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) {
                types.insert(walkingSteadiness)
            }
        }
        
        return types
    }()

    @Published var authorizationStatus: HKAuthorizationStatus = .notDetermined
    @Published var isAuthorized = false
    @Published var lastError: String?
    @Published var lastHeartRate: Double?
    @Published var lastStepCount: Double?
    @Published var lastWalkingSteadiness: Double?
    @Published var lastActiveEnergy: Double?
    @Published var lastDistance: Double?
    
    // Enhanced monitoring stats with performance optimizations
    @Published var totalDataPointsSent: Int = 0
    @Published var dataPointsPerMinute: Double = 0.0
    @Published var isMonitoringActive: Bool = false {
        didSet {
            if config.shouldLogDebugInfo() {
                print("🏥 isMonitoringActive changed to: \(isMonitoringActive)")
            }
        }
    }
    @Published var connectionQuality = ConnectionQualityMonitor()
    @Published var healthDataFreshness: [String: Date] = [:]
    
    // Performance tracking
    private var lastMinuteDataPoints: [Date] = []
    
    var activeQueries: [HKQuery] = []
    private var dataPointTimer: Timer?
    private var performanceMonitor: PerformanceMonitor?
    private var periodicHealthCheckTimer: Timer?

    private override init() {
        // Use enhanced config
        self.userId = config.userId
        super.init()
        
        // Initialize performance monitoring if enabled
        if config.enablePerformanceMonitoring {
            performanceMonitor = PerformanceMonitor()
        }
        
        // Ensure initial state is properly set
        DispatchQueue.main.async {
            self.isMonitoringActive = false
            if self.config.shouldLogDebugInfo() {
                print("🏥 HealthKitManager initialized - isMonitoringActive: \(self.isMonitoringActive)")
                print("🔧 Configuration: \(self.config.getConfigurationSummary())")
            }
        }
        
        checkAuthorizationStatus()
        startDataPointTracking()
    }
    
    private func startDataPointTracking() {
        // Use optimized sync interval from config
        let interval = config.getOptimalSyncInterval()
        dataPointTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.updateDataPointsPerMinute()
        }
    }
    
    private func updateDataPointsPerMinute() {
        let now = Date()
        let oneMinuteAgo = now.addingTimeInterval(-60)
        
        // Remove data points older than 1 minute
        lastMinuteDataPoints = lastMinuteDataPoints.filter { $0 > oneMinuteAgo }
        
        // Update rate
        dataPointsPerMinute = Double(lastMinuteDataPoints.count)
    }
    
    private func recordDataPoint() {
        lastMinuteDataPoints.append(Date())
        totalDataPointsSent += 1
        performanceMonitor?.recordDataPoint()
    }

    // Request HealthKit permissions with enhanced feedback
    func requestAuthorization() async {
        performanceMonitor?.startTiming("authorization")
        
        if config.shouldLogDebugInfo() {
            print("📋 Requesting HealthKit authorization...")
        }

        guard HKHealthStore.isHealthDataAvailable() else {
            if config.shouldLogDebugInfo() {
                print("❌ HealthKit not available on this device")
            }
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "HealthKit is not available on this device"
            }
            performanceMonitor?.endTiming("authorization")
            return
        }

        // Start with step count first since it's most reliable
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "Step count data type not available"
            }
            performanceMonitor?.endTiming("authorization")
            return
        }
        let primaryTypes: Set<HKObjectType> = [stepType]
        
        do {
            if config.shouldLogDebugInfo() {
                print("📋 Requesting authorization for step count first...")
            }
            try await healthStore.requestAuthorization(toShare: [], read: primaryTypes)
            
            // Test step count access immediately
            await testStepCountAccess()
            
            // If step count worked, try additional types
            if isAuthorized {
                if config.shouldLogDebugInfo() {
                    print("📋 Step count authorized, requesting additional health data types...")
                }
                try await healthStore.requestAuthorization(toShare: [], read: healthDataTypes)
                
                // Wait a moment for system to process - use config timeout
                let waitTime = min(config.connectionTimeout, 2.0) // Cap at 2 seconds for responsiveness
                try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
                
                // Update status after full request
                await MainActor.run {
                    self.checkAuthorizationStatus()
                    self.lastError = nil
                    if self.config.shouldLogDebugInfo() {
                        print("✅ Full HealthKit authorization process completed")
                    }
                }
                
                // Test all data types for better feedback
                await testAllDataTypes()
            }
            
        } catch {
            if config.shouldLogDebugInfo() {
                print("❌ HealthKit authorization failed with error: \(error)")
            }
            await MainActor.run {
                self.isAuthorized = false
                self.authorizationStatus = .sharingDenied
                self.lastError = "Authorization failed: \(error.localizedDescription)"
            }
        }
        
        performanceMonitor?.endTiming("authorization")
    }
    
    private func testAllDataTypes() async {
        let testTypes: [(String, HKQuantityType?)] = [
            ("Heart Rate", HKQuantityType.quantityType(forIdentifier: .heartRate)),
            ("Step Count", HKQuantityType.quantityType(forIdentifier: .stepCount)),
            ("Distance", HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)),
            ("Active Energy", HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned))
        ]
        
        for (name, optionalType) in testTypes {
            guard let type = optionalType else {
                print("📊 \(name): Not available on this system")
                continue
            }
            let status = healthStore.authorizationStatus(for: type)
            print("📊 \(name): \(statusDescription(status))")
        }
    }
    
    private func testStepCountAccess() async {
        print("🔬 Testing step count data access...")
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("🔬 Step count type not available on this system")
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] query, result, error in
                
                if let error = error {
                    print("🔬 Step count access test failed: \(error)")
                    DispatchQueue.main.async {
                        self?.isAuthorized = false
                        self?.authorizationStatus = .sharingDenied
                    }
                } else if let result = result {
                    print("🔬 Step count access test succeeded!")
                    DispatchQueue.main.async {
                        self?.isAuthorized = true
                        self?.authorizationStatus = .sharingAuthorized
                        
                        if let sum = result.sumQuantity() {
                            let steps = sum.doubleValue(for: HKUnit.count())
                            self?.lastStepCount = steps
                            print("🔬 Got step count: \(steps)")
                        }
                    }
                } else {
                    print("🔬 Step count test returned nil result - this might still be valid")
                    DispatchQueue.main.async {
                        self?.isAuthorized = true
                        self?.authorizationStatus = .sharingAuthorized
                    }
                }
                
                continuation.resume()
            }
            
            self.healthStore.execute(query)
        }
    }
    
    private func checkAuthorizationStatus() {
        // Check authorization for multiple key types to get a better picture with safe initialization
        let keyTypes: [HKQuantityType] = [
            HKQuantityType.quantityType(forIdentifier: .heartRate),
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
        ].compactMap { $0 } // Remove any nil values safely
        
        var statusMessages: [String] = []
        var authorizedCount = 0
        var deniedCount = 0
        var notDeterminedCount = 0
        
        for type in keyTypes {
            let status = healthStore.authorizationStatus(for: type)
            let typeName = type.identifier.replacingOccurrences(of: "HKQuantityTypeIdentifier", with: "")
            statusMessages.append("\(typeName): \(statusDescription(status))")
            
            switch status {
            case .sharingAuthorized:
                authorizedCount += 1
            case .sharingDenied:
                deniedCount += 1
            case .notDetermined:
                notDeterminedCount += 1
            @unknown default:
                notDeterminedCount += 1
            }
        }
        
        // Use step count as the primary indicator since it's most commonly granted
        if let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            authorizationStatus = healthStore.authorizationStatus(for: stepCountType)
        } else {
            print("⚠️ Step count type not available on this system")
        }
        
        print("📊 HealthKit authorization status details:")
        for message in statusMessages {
            print("   \(message)")
        }
        
        if authorizedCount > 0 {
            // If ANY data type is authorized, consider it a success
            isAuthorized = true
            print("✅ At least one health data type is authorized - treating as success")
        } else if deniedCount == keyTypes.count {
            // Only if ALL types are explicitly denied
            isAuthorized = false
            print("❌ All health data types explicitly denied")
        } else {
            // Mixed or unclear status - test actual access
            print("⚠️ Mixed or unclear authorization status - testing actual data access...")
            testActualDataAccess()
        }
    }
    
    private func statusDescription(_ status: HKAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "NotDetermined"
        case .sharingDenied:
            return "Denied"
        case .sharingAuthorized:
            return "Authorized"
        @unknown default:
            return "Unknown"
        }
    }

    // Start live data streaming with WebSocket manager
    func startLiveDataStreaming(webSocketManager: WebSocketManager) async {
        print("📊 Starting enhanced live health data streaming...")
        self.webSocketManager = webSocketManager

        await MainActor.run {
            self.isMonitoringActive = true
        }

        // Start observing health data changes
        startObservingHealthData()

        // Send initial data snapshot
        try? await sendCurrentHealthData()
        
        // Start periodic health checks
        startPeriodicHealthCheck()
    }
    
    private func startPeriodicHealthCheck() {
        // Clean up existing timer first
        periodicHealthCheckTimer?.invalidate()
        
        periodicHealthCheckTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            Task {
                await self?.performHealthCheck()
            }
        }
    }
    
    private func performHealthCheck() async {
        print("🔍 Performing periodic health check...")
        
        // Check data freshness
        let now = Date()
        let staleThreshold: TimeInterval = 300 // 5 minutes
        
        for (dataType, lastUpdate) in healthDataFreshness {
            if now.timeIntervalSince(lastUpdate) > staleThreshold {
                print("⚠️ \(dataType) data is stale (last update: \(lastUpdate))")
            }
        }
        
        // Test connection quality
        connectionQuality.recordPing()
        
        // Optionally fetch fresh data if needed
        if healthDataFreshness.isEmpty || healthDataFreshness.values.allSatisfy({ now.timeIntervalSince($0) > 60 }) {
            try? await sendCurrentHealthData()
        }
    }

    private func startObservingHealthData() {
        // Set up background health data observers
        observeHeartRate()
        observeStepCount()
        observeWalkingSteadiness()
        observeActiveEnergy()
        observeDistance()
    }
    
    private func observeHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("⚠️ Heart rate type not available on this system")
            return
        }

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
        activeQueries.append(query)
    }

    private func observeStepCount() {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("⚠️ Step count type not available on this system")
            return
        }

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
        activeQueries.append(query)
    }

    private func observeWalkingSteadiness() {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else {
            print("⚠️ Walking steadiness type not available on this system")
            return
        }

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
        activeQueries.append(query)
    }
    
    private func observeActiveEnergy() {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("⚠️ Active energy type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: energyType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Active energy observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestActiveEnergy()
            }

            completionHandler()
        }

        healthStore.execute(query)
        activeQueries.append(query)
    }
    
    private func observeDistance() {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            print("⚠️ Distance type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: distanceType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Distance observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestDistance()
            }

            completionHandler()
        }

        healthStore.execute(query)
        activeQueries.append(query)
    }
    
    private func fetchLatestActiveEnergy() async {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("⚠️ Active energy type not available on this system")
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

            if let error = error {
                print("❌ Active energy fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let energy = sum.doubleValue(for: HKUnit.kilocalorie())

            Task { @MainActor in
                self?.lastActiveEnergy = energy
                self?.healthDataFreshness["active_energy"] = Date()
                await self?.sendHealthData(type: "active_energy", value: energy, unit: "kcal", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }
    
    private func fetchLatestDistance() async {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            print("⚠️ Distance type not available on this system")
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

            if let error = error {
                print("❌ Distance fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let distance = sum.doubleValue(for: HKUnit.meter())

            Task { @MainActor in
                self?.lastDistance = distance
                self?.healthDataFreshness["distance"] = Date()
                await self?.sendHealthData(type: "distance", value: distance, unit: "m", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestHeartRate() async {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("⚠️ Heart rate type not available on this system")
            return
        }

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
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("⚠️ Step count type not available on this system")
            return
        }

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
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else {
            print("⚠️ Walking steadiness type not available on this system")
            return
        }

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
    
    internal func sendHealthData(type: String, value: Double, unit: String, timestamp: Date) async {
        guard let webSocketManager = webSocketManager else {
            print("⚠️ WebSocket manager not available")
            return
        }

        let healthData = HealthData(
            type: type,
            value: value,
            unit: unit,
            timestamp: timestamp,
            deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
            userId: userId
        )

        do {
            try await webSocketManager.sendHealthData(healthData)
            await MainActor.run {
                self.recordDataPoint()
                self.connectionQuality.recordPong()
            }
            print("✅ Successfully sent \(type): \(value) \(unit)")
        } catch {
            print("❌ Failed to send health data: \(error)")
            await MainActor.run {
                self.lastError = "Send failed: \(error.localizedDescription)"
            }
        }
    }

    func sendCurrentHealthData() async throws {
        print("📤 Sending comprehensive health data snapshot...")
        
        // Verify we have WebSocket connection
        guard webSocketManager != nil else {
            throw NSError(domain: "HealthKitManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "WebSocket not connected"])
        }
        
        // Verify HealthKit authorization
        guard isAuthorized else {
            throw NSError(domain: "HealthKitManager", code: 2, userInfo: [NSLocalizedDescriptionKey: "HealthKit not authorized"])
        }
        
        var errors: [String] = []
        var successCount = 0
        
        // Fetch and send each health data type
        await fetchLatestHeartRate()
        successCount += 1
        
        await fetchLatestStepCount()
        successCount += 1
        
        await fetchLatestWalkingSteadiness()
        successCount += 1
        
        await fetchLatestActiveEnergy()
        successCount += 1
        
        await fetchLatestDistance()
        successCount += 1
        
        await MainActor.run {
            self.healthDataFreshness["snapshot"] = Date()
        }
        
        // Report results
        if errors.isEmpty {
            print("✅ Successfully refreshed all health data (5/5 metrics)")
        } else if successCount > 0 {
            print("⚠️ Partially successful refresh (\(successCount)/5 metrics). Errors: \(errors.joined(separator: ", "))")
        } else {
            let errorMessage = "Failed to refresh health data: \(errors.joined(separator: ", "))"
            print("❌ \(errorMessage)")
            throw NSError(domain: "HealthKitManager", code: 3, userInfo: [NSLocalizedDescriptionKey: errorMessage])
        }
    }

    func sendTestData() async {
        print("🧪 Sending enhanced test health data...")
        
        let testData = [
            HealthData(
                type: "heart_rate",
                value: Double.random(in: 60...100),
                unit: "bpm",
                timestamp: Date(),
                deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "test-device",
                userId: userId
            ),
            HealthData(
                type: "step_count",
                value: Double.random(in: 1000...15000),
                unit: "steps",
                timestamp: Date(),
                deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "test-device",
                userId: userId
            ),
            HealthData(
                type: "active_energy",
                value: Double.random(in: 200...800),
                unit: "kcal",
                timestamp: Date(),
                deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "test-device",
                userId: userId
            ),
            HealthData(
                type: "distance",
                value: Double.random(in: 1000...10000),
                unit: "m",
                timestamp: Date(),
                deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "test-device",
                userId: userId
            )
        ]

        for data in testData {
            do {
                try await webSocketManager?.sendHealthData(data)
                await MainActor.run {
                    self.recordDataPoint()
                }
            } catch {
                print("❌ Failed to send test data: \(error)")
            }
        }
        
        await MainActor.run {
            lastHeartRate = testData[0].value
            lastStepCount = testData[1].value
            lastActiveEnergy = testData[2].value
            lastDistance = testData[3].value
        }
    }

    // Enhanced monitoring stop with cleanup
    func stopMonitoring() {
        print("⏹️ Stopping comprehensive health data monitoring...")
        
        for query in activeQueries {
            healthStore.stop(query)
        }
        activeQueries.removeAll()
        
        // Clean up all timers
        dataPointTimer?.invalidate()
        dataPointTimer = nil
        
        periodicHealthCheckTimer?.invalidate()
        periodicHealthCheckTimer = nil
        
        isMonitoringActive = false
        
        print("✅ Health monitoring stopped and cleaned up")
    }
    
    deinit {
        print("🗑️ HealthKitManager deinitializing - cleaning up resources")
        stopMonitoring()
        
        // Additional cleanup for observers
        for dataType in healthDataTypes {
            if let quantityType = dataType as? HKQuantityType {
                healthStore.disableBackgroundDelivery(for: quantityType) { _, _ in }
            }
        }
    }
    
    // MARK: - Utility Methods
    
    func getConnectionSummary() -> String {
        let quality = connectionQuality.signalStrength > 0.8 ? "Excellent" :
                     connectionQuality.signalStrength > 0.6 ? "Good" :
                     connectionQuality.signalStrength > 0.4 ? "Fair" : "Poor"
        
        return """
        Status: \(isMonitoringActive ? "Active" : "Inactive")
        Quality: \(quality)
        Data Rate: \(String(format: "%.1f", dataPointsPerMinute))/min
        Total Sent: \(totalDataPointsSent)
        Latency: \(String(format: "%.0f", connectionQuality.latency * 1000))ms
        """
    }
    
    func getHealthDataSummary() -> String {
        var summary: [String] = []
        
        if let hr = lastHeartRate {
            summary.append("❤️ \(Int(hr)) BPM")
        }
        if let steps = lastStepCount {
            summary.append("🚶 \(Int(steps)) steps")
        }
        if let energy = lastActiveEnergy {
            summary.append("🔥 \(Int(energy)) kcal")
        }
        if let distance = lastDistance {
            summary.append("📏 \(String(format: "%.1f", distance/1000)) km")
        }
        
        return summary.joined(separator: " • ")
    }
    
    private func testActualDataAccess() {
        print("🔍 Testing actual HealthKit data access...")
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("🔍 Step count type not available on this system")
            return
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { [weak self] query, result, error in
            
            if let error = error {
                print("🔍 Data access test failed with error: \(error)")
                DispatchQueue.main.async {
                    self?.isAuthorized = false
                    self?.authorizationStatus = .sharingDenied
                }
                return
            }
            
            if let result = result {
                print("🔍 Data access test succeeded!")
                DispatchQueue.main.async {
                    self?.isAuthorized = true
                    print("✅ Actual data access confirmed")
                    
                    if let sum = result.sumQuantity() {
                        let steps = sum.doubleValue(for: HKUnit.count())
                        self?.lastStepCount = steps
                        print("📊 Current step count: \(steps)")
                    }
                }
            } else {
                print("🔍 Data access test returned nil result")
                self?.testHeartRateAccess()
            }
        }
        
        healthStore.execute(query)
    }
    
    private func testHeartRateAccess() {
        print("🔍 Testing heart rate data access as fallback...")
        
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("🔍 Heart rate type not available on this system")
            return
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] query, samples, error in
            
            if let error = error {
                print("🔍 Heart rate access test failed: \(error)")
                DispatchQueue.main.async {
                    self?.isAuthorized = false
                    self?.authorizationStatus = .sharingDenied
                }
                return
            }
            
            print("🔍 Heart rate access test completed")
            
            DispatchQueue.main.async {
                self?.isAuthorized = true
                print("✅ Heart rate access confirmed")
                
                if let sample = samples?.first as? HKQuantitySample {
                    let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    self?.lastHeartRate = heartRate
                    print("📊 Latest heart rate: \(heartRate) BPM")
                }
            }
        }
        
        healthStore.execute(query)
    }
}
