import SwiftUI
import HealthKit
import CoreMotion
import WatchConnectivity

// MARK: - Apple Watch Gait Monitor
class AppleWatchGaitMonitor: NSObject, ObservableObject {
    static let shared = AppleWatchGaitMonitor()
    
    @Published var isMonitoring = false
    @Published var currentSession: GaitMonitoringSession?
    @Published var realtimeMetrics = RealtimeGaitMetrics()
    @Published var deviceMotion: CMDeviceMotion?
    
    private let motionManager = CMMotionManager()
    private let workoutSession = HKWorkoutSession.self
    private let healthStore = HKHealthStore()
    private var sessionStartTime: Date?
    
    // Watch Connectivity
    private var session: WCSession?
    
    override init() {
        super.init()
        setupWatchConnectivity()
        configureMotionManager()
    }
    
    // MARK: - Watch Connectivity Setup
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    // MARK: - Motion Manager Configuration
    private func configureMotionManager() {
        motionManager.deviceMotionUpdateInterval = 0.1 // 10 Hz for gait analysis
        motionManager.accelerometerUpdateInterval = 0.02 // 50 Hz for step detection
        motionManager.gyroUpdateInterval = 0.02 // 50 Hz for stability analysis
    }
    
    // MARK: - Gait Monitoring Session
    func startGaitMonitoring() async {
        guard !isMonitoring else { return }
        
        do {
            // Request HealthKit permissions for Apple Watch
            let gaitTypes: Set<HKSampleType> = [
                HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
                HKQuantityType.quantityType(forIdentifier: .stepLength)!,
                HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
                HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
                HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
                HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed)!
            ]
            
            try await healthStore.requestAuthorization(toShare: gaitTypes, read: gaitTypes)
            
            // Initialize monitoring session
            sessionStartTime = Date()
            currentSession = GaitMonitoringSession(
                sessionId: UUID().uuidString,
                startTime: sessionStartTime!,
                deviceType: .appleWatch,
                monitoringMode: .realtime
            )
            
            // Start motion updates
            startMotionUpdates()
            
            // Start HealthKit workout session for accurate gait data
            await startHealthKitWorkout()
            
            await MainActor.run {
                isMonitoring = true
            }
            
            print("🏃‍♂️ Apple Watch gait monitoring started")
            
        } catch {
            print("❌ Failed to start gait monitoring: \(error)")
        }
    }
    
    func stopGaitMonitoring() async {
        guard isMonitoring else { return }
        
        // Stop motion updates
        motionManager.stopDeviceMotionUpdates()
        motionManager.stopAccelerometerUpdates()
        motionManager.stopGyroUpdates()
        
        // Finalize session
        if var session = currentSession {
            session.endTime = Date()
            session.duration = Date().timeIntervalSince(session.startTime)
            session.finalMetrics = realtimeMetrics.toGaitMetrics()
            
            // Send final session data to iPhone
            await sendSessionDataToiPhone(session)
        }
        
        await MainActor.run {
            isMonitoring = false
            currentSession = nil
            realtimeMetrics = RealtimeGaitMetrics()
        }
        
        print("🛑 Apple Watch gait monitoring stopped")
    }
    
    // MARK: - Motion Data Processing
    private func startMotionUpdates() {
        // Device Motion for comprehensive gait analysis
        if motionManager.isDeviceMotionAvailable {
            motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
                guard let self = self, let motion = motion else { return }
                
                self.deviceMotion = motion
                self.processDeviceMotion(motion)
            }
        }
        
        // Accelerometer for step detection and gait patterns
        if motionManager.isAccelerometerAvailable {
            motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, error in
                guard let self = self, let data = data else { return }
                self.processAccelerometerData(data)
            }
        }
        
        // Gyroscope for stability and balance analysis
        if motionManager.isGyroAvailable {
            motionManager.startGyroUpdates(to: .main) { [weak self] data, error in
                guard let self = self, let data = data else { return }
                self.processGyroscopeData(data)
            }
        }
    }
    
    private func processDeviceMotion(_ motion: CMDeviceMotion) {
        let timestamp = Date()
        
        // Extract motion components
        let acceleration = motion.userAcceleration
        let rotationRate = motion.rotationRate
        let attitude = motion.attitude
        
        // Calculate gait-specific metrics
        let stepCadence = calculateStepCadence(from: acceleration)
        let gaitStability = calculateGaitStability(from: rotationRate)
        let walkingPattern = analyzeWalkingPattern(from: attitude)
        
        // Update realtime metrics
        DispatchQueue.main.async {
            self.realtimeMetrics.updateWithMotion(
                timestamp: timestamp,
                acceleration: acceleration,
                rotationRate: rotationRate,
                stepCadence: stepCadence,
                stability: gaitStability,
                walkingPattern: walkingPattern
            )
        }
        
        // Send realtime data to iPhone every second
        if Int(timestamp.timeIntervalSince1970) % 1 == 0 {
            Task {
                await sendRealtimeDataToiPhone()
            }
        }
    }
    
    private func processAccelerometerData(_ data: CMAccelerometerData) {
        let magnitude = sqrt(pow(data.acceleration.x, 2) + pow(data.acceleration.y, 2) + pow(data.acceleration.z, 2))
        
        // Step detection using accelerometer magnitude
        if detectStep(from: magnitude) {
            DispatchQueue.main.async {
                self.realtimeMetrics.recordStep(at: Date(), magnitude: magnitude)
            }
        }
    }
    
    private func processGyroscopeData(_ data: CMGyroData) {
        let rotationMagnitude = sqrt(pow(data.rotationRate.x, 2) + pow(data.rotationRate.y, 2) + pow(data.rotationRate.z, 2))
        
        // Analyze balance and stability
        let stabilityScore = calculateStabilityScore(from: rotationMagnitude)
        
        DispatchQueue.main.async {
            self.realtimeMetrics.updateStability(score: stabilityScore, at: Date())
        }
    }
    
    // MARK: - HealthKit Workout Session
    private func startHealthKitWorkout() async {
        // This would start an HKWorkoutSession for walking
        // Implementation would depend on specific HealthKit workout APIs
        print("🏃‍♂️ Starting HealthKit walking workout session")
    }
    
    // MARK: - Gait Analysis Algorithms
    private func calculateStepCadence(from acceleration: CMAcceleration) -> Double {
        // Step cadence calculation based on vertical acceleration
        let verticalAccel = abs(acceleration.y)
        
        // Simple cadence estimation (steps per minute)
        // Real implementation would use more sophisticated peak detection
        return verticalAccel > 0.1 ? 120.0 : 0.0
    }
    
    private func calculateGaitStability(from rotationRate: CMRotationRate) -> Double {
        // Stability based on rotational movement consistency
        let totalRotation = abs(rotationRate.x) + abs(rotationRate.y) + abs(rotationRate.z)
        
        // Lower rotation = higher stability (0-10 scale)
        return max(0, 10 - (totalRotation * 5))
    }
    
    private func analyzeWalkingPattern(from attitude: CMAttitude) -> WalkingPattern {
        let pitch = attitude.pitch
        let roll = attitude.roll
        
        // Analyze walking pattern based on device orientation
        if abs(pitch) > 0.2 {
            return .irregular
        } else if abs(roll) > 0.15 {
            return .asymmetric
        } else {
            return .normal
        }
    }
    
    private func detectStep(from magnitude: Double) -> Bool {
        // Simple step detection threshold
        // Real implementation would use sophisticated peak detection algorithms
        return magnitude > 1.2
    }
    
    private func calculateStabilityScore(from rotationMagnitude: Double) -> Double {
        // Convert rotation magnitude to stability score (0-10)
        return max(0, 10 - (rotationMagnitude * 2))
    }
    
    // MARK: - Data Transmission to iPhone
    private func sendRealtimeDataToiPhone() async {
        guard let session = session, session.isReachable else { return }
        
        let realtimeData: [String: Any] = [
            "type": "realtime_gait",
            "timestamp": Date().timeIntervalSince1970,
            "stepCount": realtimeMetrics.stepCount,
            "stepCadence": realtimeMetrics.currentCadence,
            "stabilityScore": realtimeMetrics.averageStability,
            "walkingPattern": realtimeMetrics.currentWalkingPattern.rawValue,
            "sessionDuration": currentSession?.duration ?? 0
        ]
        
        session.sendMessage(realtimeData, replyHandler: nil) { error in
            print("❌ Failed to send realtime data to iPhone: \(error)")
        }
    }
    
    private func sendSessionDataToiPhone(_ session: GaitMonitoringSession) async {
        guard let wcSession = self.session, wcSession.isReachable else { return }
        
        let sessionData: [String: Any] = [
            "type": "gait_session_complete",
            "sessionId": session.sessionId,
            "startTime": session.startTime.timeIntervalSince1970,
            "endTime": session.endTime?.timeIntervalSince1970 ?? Date().timeIntervalSince1970,
            "duration": session.duration,
            "stepCount": session.finalMetrics?.stepCount ?? 0,
            "avgCadence": session.finalMetrics?.averageCadence ?? 0,
            "avgStability": session.finalMetrics?.averageStability ?? 0,
            "deviceType": session.deviceType.rawValue
        ]
        
        wcSession.sendMessage(sessionData, replyHandler: nil) { error in
            print("❌ Failed to send session data to iPhone: \(error)")
        }
    }
}

// MARK: - Watch Connectivity Delegate
extension AppleWatchGaitMonitor: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("❌ WCSession activation failed: \(error)")
        } else {
            print("✅ WCSession activated with state: \(activationState.rawValue)")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        // Handle messages from iPhone app
        if let messageType = message["type"] as? String {
            switch messageType {
            case "start_gait_monitoring":
                Task {
                    await startGaitMonitoring()
                }
            case "stop_gait_monitoring":
                Task {
                    await stopGaitMonitoring()
                }
            default:
                break
            }
        }
    }
}

// MARK: - Supporting Data Models
struct GaitMonitoringSession {
    let sessionId: String
    let startTime: Date
    var endTime: Date?
    var duration: TimeInterval = 0
    let deviceType: DeviceType
    let monitoringMode: MonitoringMode
    var finalMetrics: GaitMetrics?
    
    enum DeviceType: String, CaseIterable {
        case appleWatch = "apple_watch"
        case iPhone = "iphone"
    }
    
    enum MonitoringMode: String, CaseIterable {
        case realtime = "realtime"
        case background = "background"
        case workout = "workout"
    }
}

struct RealtimeGaitMetrics {
    var stepCount: Int = 0
    var currentCadence: Double = 0
    var averageStability: Double = 10.0
    var currentWalkingPattern: WalkingPattern = .normal
    var lastStepTime: Date?
    var sessionStartTime: Date = Date()
    
    private var stabilityScores: [Double] = []
    private var cadenceReadings: [Double] = []
    
    mutating func updateWithMotion(
        timestamp: Date,
        acceleration: CMAcceleration,
        rotationRate: CMRotationRate,
        stepCadence: Double,
        stability: Double,
        walkingPattern: WalkingPattern
    ) {
        currentCadence = stepCadence
        currentWalkingPattern = walkingPattern
        
        // Update stability average
        stabilityScores.append(stability)
        if stabilityScores.count > 50 { // Keep last 50 readings (5 seconds at 10Hz)
            stabilityScores.removeFirst()
        }
        averageStability = stabilityScores.reduce(0, +) / Double(stabilityScores.count)
        
        // Update cadence average
        if stepCadence > 0 {
            cadenceReadings.append(stepCadence)
            if cadenceReadings.count > 30 { // Keep last 30 readings
                cadenceReadings.removeFirst()
            }
        }
    }
    
    mutating func recordStep(at timestamp: Date, magnitude: Double) {
        stepCount += 1
        lastStepTime = timestamp
    }
    
    mutating func updateStability(score: Double, at timestamp: Date) {
        stabilityScores.append(score)
        if stabilityScores.count > 50 {
            stabilityScores.removeFirst()
        }
        averageStability = stabilityScores.reduce(0, +) / Double(stabilityScores.count)
    }
    
    func toGaitMetrics() -> GaitMetrics {
        let sessionDuration = Date().timeIntervalSince(sessionStartTime)
        let avgCadence = cadenceReadings.isEmpty ? 0 : cadenceReadings.reduce(0, +) / Double(cadenceReadings.count)
        
        return GaitMetrics(
            timestamp: Date(),
            averageWalkingSpeed: nil, // Would be calculated from HealthKit
            averageStepLength: nil, // Would be calculated from HealthKit
            stepCount: stepCount,
            walkingAsymmetry: nil, // Would be calculated from HealthKit
            doubleSupportTime: nil, // Would be calculated from HealthKit
            stairAscentSpeed: nil,
            stairDescentSpeed: nil,
            averageCadence: avgCadence,
            averageStability: averageStability,
            mobilityStatus: averageStability > 7 ? .excellent : averageStability > 5 ? .good : .needsAttention,
            sessionDuration: sessionDuration,
            walkingPattern: currentWalkingPattern
        )
    }
}

enum WalkingPattern: String, CaseIterable {
    case normal = "normal"
    case irregular = "irregular"
    case asymmetric = "asymmetric"
    case unstable = "unstable"
    
    var color: Color {
        switch self {
        case .normal: return .green
        case .irregular: return .orange
        case .asymmetric: return .orange
        case .unstable: return .red
        }
    }
}

// MARK: - Apple Watch UI Views
struct WatchGaitMonitorView: View {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "figure.walk")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("Gait Monitor")
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            
            if gaitMonitor.isMonitoring {
                // Monitoring Status
                VStack(spacing: 8) {
                    // Step Count
                    HStack {
                        Image(systemName: "figure.walk.circle")
                            .foregroundColor(.green)
                        
                        Text("\(gaitMonitor.realtimeMetrics.stepCount) steps")
                            .font(.body)
                            .fontWeight(.medium)
                    }
                    
                    // Stability Score
                    HStack {
                        Image(systemName: "scale.3d")
                            .foregroundColor(gaitMonitor.realtimeMetrics.averageStability > 7 ? .green : .orange)
                        
                        Text("Stability: \(String(format: "%.1f", gaitMonitor.realtimeMetrics.averageStability))")
                            .font(.body)
                            .fontWeight(.medium)
                    }
                    
                    // Walking Pattern
                    HStack {
                        Circle()
                            .fill(gaitMonitor.realtimeMetrics.currentWalkingPattern.color)
                            .frame(width: 8, height: 8)
                        
                        Text(gaitMonitor.realtimeMetrics.currentWalkingPattern.rawValue.capitalized)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                }
                
                // Stop Button
                Button("Stop Monitoring") {
                    Task {
                        await gaitMonitor.stopGaitMonitoring()
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
                
            } else {
                // Start Monitoring
                VStack(spacing: 8) {
                    Text("Ready to monitor your gait and walking patterns")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Start Monitoring") {
                        Task {
                            await gaitMonitor.startGaitMonitoring()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
            }
        }
        .padding()
    }
}

#Preview {
    WatchGaitMonitorView()
}
