import SwiftUI
import HealthKit
import CoreLocation
import CoreMotion
import Combine

// MARK: - Walking Session Tracker
@MainActor
class WalkingSessionTracker: ObservableObject {
    // MARK: - Published Properties
    @Published var isTracking = false
    @Published var currentSession: WalkingSession?
    @Published var sessionMetrics = WalkingSessionMetrics()
    @Published var realTimeGaitMetrics: GaitMetrics?
    @Published var route: [CLLocationCoordinate2D] = []
    @Published var elevationProfile: [ElevationPoint] = []
    @Published var heartRateData: [HeartRatePoint] = []

    // MARK: - Managers
    private let healthStore = HKHealthStore()
    private let locationManager = CLLocationManager()
    private let motionManager = CMMotionManager()
    private let gaitAnalysisManager = GaitAnalysisManager()

    // MARK: - Session Properties
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var startTime: Date?
    private var lastLocation: CLLocation?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Real-time Processing
    private var stepCounter = 0
    private var cadenceTimer: Timer?
    private var gaitProcessingQueue = DispatchQueue(label: "gait.processing", qos: .userInitiated)

    init() {
        setupLocationManager()
        setupMotionManager()
        requestPermissions()
    }

    // MARK: - Session Control

    func startSession() async throws {
        guard !isTracking else { return }

        // Ensure permissions
        try await ensurePermissions()

        // Start HealthKit workout
        try await startWorkout()

        // Start location tracking
        startLocationTracking()

        // Start motion tracking
        startMotionTracking()

        // Initialize session
        let session = WalkingSession(
            id: UUID(),
            startTime: Date(),
            type: .general
        )

        currentSession = session
        sessionMetrics = WalkingSessionMetrics()
        route.removeAll()
        elevationProfile.removeAll()
        heartRateData.removeAll()
        stepCounter = 0

        isTracking = true
        startTime = Date()

        // Start real-time processing
        startRealTimeProcessing()

        print("✅ Walking session started")
    }

    func pauseSession() {
        guard isTracking else { return }

        workoutSession?.pause()
        locationManager.stopUpdatingLocation()
        motionManager.stopDeviceMotionUpdates()
        cadenceTimer?.invalidate()

        currentSession?.pauseTime = Date()
        print("⏸️ Walking session paused")
    }

    func resumeSession() {
        guard isTracking, currentSession?.pauseTime != nil else { return }

        workoutSession?.resume()
        startLocationTracking()
        startMotionTracking()
        startRealTimeProcessing()

        currentSession?.pauseTime = nil
        print("▶️ Walking session resumed")
    }

    func stopSession() async throws {
        guard isTracking else { return }

        isTracking = false
        cadenceTimer?.invalidate()

        // Stop tracking
        locationManager.stopUpdatingLocation()
        motionManager.stopDeviceMotionUpdates()

        // End workout
        try await endWorkout()

        // Finalize session
        if var session = currentSession {
            session.endTime = Date()
            session.finalMetrics = sessionMetrics
            session.route = route
            session.elevationProfile = elevationProfile
            session.heartRateData = heartRateData

            // Save session
            await saveSession(session)

            currentSession = session
        }

        print("🏁 Walking session completed")
    }

    // MARK: - HealthKit Workout Management

    private func startWorkout() async throws {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .walking
        configuration.locationType = .outdoor

        workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
        workoutBuilder = workoutSession?.associatedWorkoutBuilder()

        workoutBuilder?.dataSource = HKLiveWorkoutDataSource(
            healthStore: healthStore,
            workoutConfiguration: configuration
        )

        // Start collecting data
        let typesToCollect: Set<HKSampleType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!
        ]

        workoutBuilder?.dataTypesToCollect = typesToCollect

        // Setup real-time data collection
        workoutBuilder?.delegate = self

        try await workoutSession?.startActivity(with: Date())
        try await workoutBuilder?.beginCollection(withStart: Date())
    }

    private func endWorkout() async throws {
        guard let workoutSession = workoutSession,
              let workoutBuilder = workoutBuilder else { return }

        try await workoutSession.end()
        try await workoutBuilder.endCollection(withEnd: Date())
        try await workoutBuilder.finishWorkout()

        self.workoutSession = nil
        self.workoutBuilder = nil
    }

    // MARK: - Location Tracking

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 2.0 // Update every 2 meters
    }

    private func startLocationTracking() {
        guard locationManager.authorizationStatus == .authorizedWhenInUse ||
              locationManager.authorizationStatus == .authorizedAlways else { return }

        locationManager.startUpdatingLocation()
    }

    // MARK: - Motion Tracking

    private func setupMotionManager() {
        motionManager.deviceMotionUpdateInterval = 0.1 // 10 Hz
    }

    private func startMotionTracking() {
        guard motionManager.isDeviceMotionAvailable else { return }

        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let self = self, let motion = motion else { return }

            Task { @MainActor in
                await self.processMotionData(motion)
            }
        }
    }

    @MainActor
    private func processMotionData(_ motion: CMDeviceMotion) async {
        // Calculate real-time gait metrics
        let acceleration = motion.userAcceleration
        let rotationRate = motion.rotationRate

        // Step detection using acceleration
        let accelerationMagnitude = sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
        )

        // Simple step detection threshold
        if accelerationMagnitude > 0.1 {
            stepCounter += 1
            sessionMetrics.totalSteps = stepCounter
        }

        // Process gait data in background
        gaitProcessingQueue.async { [weak self] in
            self?.analyzeGaitPattern(acceleration: acceleration, rotation: rotationRate)
        }
    }

    private func analyzeGaitPattern(acceleration: CMAcceleration, rotation: CMRotationRate) {
        // Advanced gait analysis would go here
        // For now, we'll create basic metrics

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Update real-time gait metrics
            self.realTimeGaitMetrics = GaitMetrics(
                walkingSpeed: self.sessionMetrics.averageSpeed,
                cadence: self.calculateCurrentCadence(),
                stepLength: self.calculateCurrentStepLength(),
                walkingAsymmetry: 0.03, // Placeholder
                gaitVariability: 0.05,  // Placeholder
                timestamps: [Date()],
                quality: .good
            )
        }
    }

    // MARK: - Real-time Processing

    private func startRealTimeProcessing() {
        cadenceTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.updateRealTimeMetrics()
            }
        }
    }

    @MainActor
    private func updateRealTimeMetrics() async {
        guard let startTime = startTime else { return }

        let elapsedTime = Date().timeIntervalSince(startTime)
        sessionMetrics.duration = elapsedTime

        // Calculate current pace and other metrics
        if sessionMetrics.totalDistance > 0 {
            sessionMetrics.averageSpeed = sessionMetrics.totalDistance / elapsedTime
        }

        // Update cadence (steps per minute)
        if elapsedTime > 0 {
            sessionMetrics.averageCadence = Double(stepCounter) / (elapsedTime / 60.0)
        }

        // Notify WebSocket if configured
        await notifyWebSocket()
    }

    // MARK: - Calculations

    private func calculateCurrentCadence() -> Double {
        guard let startTime = startTime else { return 0 }

        let elapsedMinutes = Date().timeIntervalSince(startTime) / 60.0
        return elapsedMinutes > 0 ? Double(stepCounter) / elapsedMinutes : 0
    }

    private func calculateCurrentStepLength() -> Double {
        guard sessionMetrics.totalSteps > 0, sessionMetrics.totalDistance > 0 else { return 0 }
        return sessionMetrics.totalDistance / Double(sessionMetrics.totalSteps)
    }

    // MARK: - Data Persistence

    private func saveSession(_ session: WalkingSession) async {
        // Save to Core Data or local storage
        let sessionData = try? JSONEncoder().encode(session)
        UserDefaults.standard.set(sessionData, forKey: "LastWalkingSession")
    }

    // MARK: - WebSocket Integration

    private func notifyWebSocket() async {
        guard let session = currentSession else { return }

        let walkingData: [String: Any] = [
            "type": "walking_session_update",
            "sessionId": session.id.uuidString,
            "metrics": [
                "duration": sessionMetrics.duration,
                "distance": sessionMetrics.totalDistance,
                "steps": sessionMetrics.totalSteps,
                "averageSpeed": sessionMetrics.averageSpeed,
                "averageCadence": sessionMetrics.averageCadence,
                "calories": sessionMetrics.calories
            ],
            "realTimeGait": realTimeGaitMetrics?.toDictionary() ?? [:],
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        // Send via WebSocket (implement WebSocket manager separately)
        // WebSocketManager.shared.send(walkingData)
    }

    // MARK: - Permissions

    private func requestPermissions() {
        locationManager.requestWhenInUseAuthorization()

        let typesToRead: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!
        ]

        let typesToShare: Set<HKSampleType> = [
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKWorkoutType.workoutType()
        ]

        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if let error = error {
                print("❌ HealthKit authorization error: \(error)")
            }
        }
    }

    private func ensurePermissions() async throws {
        guard CLLocationManager.locationServicesEnabled() else {
            throw WalkingSessionError.locationNotAvailable
        }

        guard locationManager.authorizationStatus == .authorizedWhenInUse ||
              locationManager.authorizationStatus == .authorizedAlways else {
            throw WalkingSessionError.locationPermissionDenied
        }

        guard HKHealthStore.isHealthDataAvailable() else {
            throw WalkingSessionError.healthKitNotAvailable
        }
    }
}

// MARK: - Location Manager Delegate
extension WalkingSessionTracker: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Update route
        let coordinate = location.coordinate
        route.append(coordinate)

        // Calculate distance
        if let lastLocation = lastLocation {
            let distance = location.distance(from: lastLocation)
            sessionMetrics.totalDistance += distance
        }

        // Update elevation profile
        let elevationPoint = ElevationPoint(
            coordinate: coordinate,
            elevation: location.altitude,
            timestamp: location.timestamp
        )
        elevationProfile.append(elevationPoint)

        lastLocation = location

        // Update current session location
        currentSession?.currentLocation = coordinate
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error)")
    }
}

// MARK: - Workout Builder Delegate
extension WalkingSessionTracker: HKLiveWorkoutBuilderDelegate {
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        // Process collected health data
        for type in collectedTypes {
            if type == HKQuantityType.quantityType(forIdentifier: .heartRate) {
                processHeartRateData(from: workoutBuilder)
            } else if type == HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
                processEnergyData(from: workoutBuilder)
            }
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {
        // Handle workout events
    }

    private func processHeartRateData(from builder: HKLiveWorkoutBuilder) {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate),
              let samples = builder.collectedData(for: heartRateType) as? [HKQuantitySample],
              let latestSample = samples.last else { return }

        let heartRate = latestSample.quantity.doubleValue(for: HKUnit(from: "count/min"))

        let heartRatePoint = HeartRatePoint(
            heartRate: heartRate,
            timestamp: latestSample.startDate
        )

        DispatchQueue.main.async {
            self.heartRateData.append(heartRatePoint)
            self.sessionMetrics.averageHeartRate = heartRate
        }
    }

    private func processEnergyData(from builder: HKLiveWorkoutBuilder) {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
              let samples = builder.collectedData(for: energyType) as? [HKQuantitySample] else { return }

        let totalEnergy = samples.reduce(0.0) { total, sample in
            total + sample.quantity.doubleValue(for: HKUnit.kilocalorie())
        }

        DispatchQueue.main.async {
            self.sessionMetrics.calories = totalEnergy
        }
    }
}

// MARK: - Supporting Types

struct WalkingSession: Codable, Identifiable {
    let id: UUID
    let startTime: Date
    var endTime: Date?
    var pauseTime: Date?
    let type: WalkingSessionType
    var finalMetrics: WalkingSessionMetrics?
    var route: [CLLocationCoordinate2D]?
    var elevationProfile: [ElevationPoint]?
    var heartRateData: [HeartRatePoint]?
    var currentLocation: CLLocationCoordinate2D?

    var duration: TimeInterval {
        let endTime = self.endTime ?? Date()
        return endTime.timeIntervalSince(startTime)
    }

    var isPaused: Bool {
        pauseTime != nil
    }
}

enum WalkingSessionType: String, Codable, CaseIterable {
    case general = "general"
    case briskWalk = "brisk_walk"
    case hillWalk = "hill_walk"
    case recoveryWalk = "recovery_walk"

    var displayName: String {
        switch self {
        case .general: return "General Walk"
        case .briskWalk: return "Brisk Walk"
        case .hillWalk: return "Hill Walk"
        case .recoveryWalk: return "Recovery Walk"
        }
    }
}

struct WalkingSessionMetrics: Codable {
    var duration: TimeInterval = 0
    var totalDistance: Double = 0 // meters
    var totalSteps: Int = 0
    var averageSpeed: Double = 0 // m/s
    var averageCadence: Double = 0 // steps/min
    var averageHeartRate: Double = 0 // bpm
    var calories: Double = 0 // kcal
    var elevationGain: Double = 0 // meters
    var maxSpeed: Double = 0 // m/s
    var minSpeed: Double = 0 // m/s
}

struct ElevationPoint: Codable {
    let coordinate: CLLocationCoordinate2D
    let elevation: Double
    let timestamp: Date
}

struct HeartRatePoint: Codable {
    let heartRate: Double
    let timestamp: Date
}

enum WalkingSessionError: Error {
    case locationNotAvailable
    case locationPermissionDenied
    case healthKitNotAvailable
    case sessionAlreadyActive
    case noActiveSession

    var localizedDescription: String {
        switch self {
        case .locationNotAvailable:
            return "Location services are not available"
        case .locationPermissionDenied:
            return "Location permission is required for walk tracking"
        case .healthKitNotAvailable:
            return "HealthKit is not available on this device"
        case .sessionAlreadyActive:
            return "A walking session is already active"
        case .noActiveSession:
            return "No active walking session found"
        }
    }
}

// MARK: - Extensions

extension CLLocationCoordinate2D: Codable {
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let latitude = try container.decode(Double.self, forKey: .latitude)
        let longitude = try container.decode(Double.self, forKey: .longitude)
        self.init(latitude: latitude, longitude: longitude)
    }

    private enum CodingKeys: String, CodingKey {
        case latitude, longitude
    }
}

extension GaitMetrics {
    func toDictionary() -> [String: Any] {
        return [
            "walkingSpeed": averageWalkingSpeed ?? 0,
            "cadence": cadence ?? 0,
            "stepLength": averageStepLength ?? 0,
            "asymmetry": walkingAsymmetry ?? 0,
            "variability": gaitVariability ?? 0,
            "quality": quality?.rawValue ?? "unknown"
        ]
    }
}
