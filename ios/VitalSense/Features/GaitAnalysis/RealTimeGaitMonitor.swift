//
//  RealTimeGaitMonitor.swift
//  VitalSense
//
//  Real-time gait monitoring with ML-powered fall prevention and emergency detection
//  Created: 2025-11-01
//

import SwiftUI
import HealthKit
import CoreMotion
import CoreML
import AVFoundation

// MARK: - Real-Time Gait Monitor

@MainActor
class RealTimeGaitMonitor: ObservableObject {
    static let shared = RealTimeGaitMonitor()

    // MARK: - Published Properties
    @Published var isMonitoring = false
    @Published var currentGaitState: GaitState = .normal
    @Published var fallRiskLevel: FallRiskLevel = .low
    @Published var realTimeMetrics: RealTimeGaitMetrics?
    @Published var emergencyAlert: EmergencyAlert?
    @Published var gaitRecommendations: [GaitRecommendation] = []

    // MARK: - Private Properties
    private let motionManager = CMMotionManager()
    private let healthStore = HKHealthStore()
    private var mlModel: MLModel?
    private var sensorBuffer: [SensorReading] = []
    private var analysisTimer: Timer?
    private let hapticFeedback = UIImpactFeedbackGenerator(style: .heavy)

    // Configuration
    private let bufferSize = 100
    private let analysisInterval: TimeInterval = 2.0
    private let emergencyThreshold: Double = 0.85

    private init() {
        setupML()
    }

    // MARK: - Public Methods

    func startMonitoring() async {
        guard !isMonitoring else { return }

        await requestPermissions()

        isMonitoring = true
        startSensorCollection()
        startRealTimeAnalysis()

        print("🚶‍♂️ Real-time gait monitoring started")
    }

    func stopMonitoring() {
        guard isMonitoring else { return }

        isMonitoring = false
        stopSensorCollection()
        stopRealTimeAnalysis()

        print("⏹️ Real-time gait monitoring stopped")
    }

    func calibrateForUser(age: Int, height: Double, weight: Double, medicalConditions: [String] = []) {
        // Personalize ML model thresholds based on user profile
        let userProfile = UserProfile(
            age: age,
            height: height,
            weight: weight,
            medicalConditions: medicalConditions
        )

        // Adjust thresholds based on user profile
        adjustThresholdsForUser(userProfile)
    }

    // MARK: - Private Methods

    private func setupML() {
        Task {
            do {
                // Load Core ML model for gait analysis
                guard let modelURL = Bundle.main.url(forResource: "GaitAnalysisModel", withExtension: "mlmodelc") else {
                    print("❌ Gait analysis model not found")
                    return
                }

                mlModel = try MLModel(contentsOf: modelURL)
                print("✅ Gait analysis ML model loaded successfully")
            } catch {
                print("❌ Failed to load ML model: \(error)")
            }
        }
    }

    private func requestPermissions() async {
        // Request HealthKit permissions
        let healthTypes: Set<HKSampleType> = [
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
            HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
            HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!
        ]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: healthTypes)
            print("✅ HealthKit permissions granted")
        } catch {
            print("❌ Failed to request HealthKit permissions: \(error)")
        }
    }

    private func startSensorCollection() {
        guard motionManager.isDeviceMotionAvailable else {
            print("❌ Device motion not available")
            return
        }

        motionManager.deviceMotionUpdateInterval = 1.0 / 50.0 // 50Hz
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let self = self, let motion = motion else { return }

            let reading = SensorReading(
                timestamp: Date(),
                accelerationX: motion.userAcceleration.x,
                accelerationY: motion.userAcceleration.y,
                accelerationZ: motion.userAcceleration.z
            )

            self.processSensorReading(reading)
        }
    }

    private func stopSensorCollection() {
        motionManager.stopDeviceMotionUpdates()
        sensorBuffer.removeAll()
    }

    private func startRealTimeAnalysis() {
        analysisTimer = Timer.scheduledTimer(withTimeInterval: analysisInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.performRealTimeAnalysis()
            }
        }
    }

    private func stopRealTimeAnalysis() {
        analysisTimer?.invalidate()
        analysisTimer = nil
    }

    private func processSensorReading(_ reading: SensorReading) {
        sensorBuffer.append(reading)

        // Keep buffer size manageable
        if sensorBuffer.count > bufferSize {
            sensorBuffer.removeFirst()
        }
    }

    private func performRealTimeAnalysis() async {
        guard sensorBuffer.count >= 50 else { return } // Need minimum data

        // Extract features from sensor buffer
        let features = extractGaitFeatures(from: sensorBuffer)

        // Run ML inference
        if let prediction = await runMLPrediction(features: features) {
            updateGaitState(from: prediction)

            // Check for emergency situations
            if prediction.fallRisk > emergencyThreshold {
                await handleEmergencyDetection(prediction: prediction)
            }

            // Update metrics
            updateRealTimeMetrics(from: prediction, features: features)

            // Generate recommendations
            gaitRecommendations = generateRecommendations(from: prediction)
        }
    }

    private func extractGaitFeatures(from readings: [SensorReading]) -> RealTimeGaitFeatures {
        let recentReadings = Array(readings.suffix(50)) // Last 1 second at 50Hz

        // Calculate step detection metrics
        let stepVariability = calculateStepVariability(readings: recentReadings)
        let walkingSpeed = estimateWalkingSpeed(readings: recentReadings)
        let gaitAsymmetry = calculateGaitAsymmetry(readings: recentReadings)
        let stabilityIndex = calculateStabilityIndex(readings: recentReadings)
        let rhythmicity = calculateRhythmicity(readings: recentReadings)

        return RealTimeGaitFeatures(
            stepVariability: stepVariability,
            walkingSpeed: walkingSpeed,
            gaitAsymmetry: gaitAsymmetry,
            stabilityIndex: stabilityIndex,
            rhythmicity: rhythmicity,
            timestamp: Date()
        )
    }

    private func runMLPrediction(features: RealTimeGaitFeatures) async -> RealTimeGaitPrediction? {
        guard let mlModel = mlModel else { return nil }

        do {
            // Convert features to ML input format
            let inputArray = MLMultiArray(shape: [1, 5], dataType: .double)
            inputArray[0] = NSNumber(value: features.stepVariability)
            inputArray[1] = NSNumber(value: features.walkingSpeed)
            inputArray[2] = NSNumber(value: features.gaitAsymmetry)
            inputArray[3] = NSNumber(value: features.stabilityIndex)
            inputArray[4] = NSNumber(value: features.rhythmicity)

            let input = try MLDictionaryFeatureProvider(
                dictionary: ["input": inputArray]
            )

            let prediction = try mlModel.prediction(from: input)

            // Extract prediction results
            if let outputArray = prediction.featureValue(for: "output")?.multiArrayValue {
                return RealTimeGaitPrediction(
                    fallRisk: outputArray[0].doubleValue,
                    gaitQuality: outputArray[1].doubleValue,
                    stabilityScore: outputArray[2].doubleValue,
                    confidence: outputArray[3].doubleValue
                )
            }
        } catch {
            print("❌ ML prediction failed: \(error)")
        }

        return nil
    }

    private func updateGaitState(from prediction: RealTimeGaitPrediction) {
        let previousState = currentGaitState

        // Determine new gait state based on prediction
        currentGaitState = determineGaitState(from: prediction)
        fallRiskLevel = determineFallRiskLevel(from: prediction)

        // Provide haptic feedback on state changes
        if currentGaitState != previousState && currentGaitState != .normal {
            hapticFeedback.impactOccurred()
        }
    }

    private func handleEmergencyDetection(prediction: RealTimeGaitPrediction) async {
        let alert = EmergencyAlert(
            id: UUID(),
            timestamp: Date(),
            type: .fallRiskDetected,
            severity: .high,
            message: "High fall risk detected - exercise caution",
            fallRisk: prediction.fallRisk,
            location: nil // Could integrate location services
        )

        emergencyAlert = alert

        // Trigger emergency protocols
        await triggerEmergencyResponse(alert: alert)
    }

    private func triggerEmergencyResponse(alert: EmergencyAlert) async {
        // Haptic feedback
        hapticFeedback.impactOccurred()

        // Log emergency event
        print("🚨 Emergency detected: \(alert.message)")

        // Could integrate with:
        // - Emergency contacts notification
        // - Caregiver alerts
        // - Medical emergency services
        // - Apple Watch emergency features
    }

    private func updateRealTimeMetrics(from prediction: RealTimeGaitPrediction, features: RealTimeGaitFeatures) {
        realTimeMetrics = RealTimeGaitMetrics(
            timestamp: Date(),
            walkingSpeed: features.walkingSpeed,
            stepVariability: features.stepVariability,
            gaitAsymmetry: features.gaitAsymmetry,
            stabilityIndex: features.stabilityIndex,
            fallRisk: prediction.fallRisk,
            gaitQuality: prediction.gaitQuality,
            confidence: prediction.confidence
        )
    }

    private func generateRecommendations(from prediction: RealTimeGaitPrediction) -> [GaitRecommendation] {
        var recommendations: [GaitRecommendation] = []

        if prediction.fallRisk > 0.6 {
            recommendations.append(GaitRecommendation(
                id: UUID(),
                type: .safety,
                priority: .high,
                title: "Slow Down",
                message: "Consider reducing walking speed for safety",
                actionTitle: "Got it"
            ))
        }

        if prediction.gaitQuality < 0.4 {
            recommendations.append(GaitRecommendation(
                id: UUID(),
                type: .improvement,
                priority: .medium,
                title: "Focus on Form",
                message: "Try to maintain steady, rhythmic steps",
                actionTitle: "Learn More"
            ))
        }

        if prediction.stabilityScore < 0.5 {
            recommendations.append(GaitRecommendation(
                id: UUID(),
                type: .exercise,
                priority: .medium,
                title: "Balance Exercises",
                message: "Regular balance training can improve stability",
                actionTitle: "View Exercises"
            ))
        }

        return recommendations
    }

    // MARK: - Helper Methods

    private func calculateStepVariability(readings: [SensorReading]) -> Double {
        let accelerations = readings.map { sqrt(pow($0.accelerationX, 2) + pow($0.accelerationY, 2) + pow($0.accelerationZ, 2)) }
        let mean = accelerations.reduce(0, +) / Double(accelerations.count)
        let variance = accelerations.map { pow($0 - mean, 2) }.reduce(0, +) / Double(accelerations.count)
        return sqrt(variance) / mean // Coefficient of variation
    }

    private func estimateWalkingSpeed(readings: [SensorReading]) -> Double {
        // Simplified walking speed estimation from accelerometer data
        let verticalAccelerations = readings.map { $0.accelerationZ }
        let peaks = detectPeaks(in: verticalAccelerations)
        let stepFrequency = Double(peaks.count) / 1.0 // steps per second
        let estimatedStepLength = 0.7 // meters (could be personalized)
        return stepFrequency * estimatedStepLength
    }

    private func calculateGaitAsymmetry(readings: [SensorReading]) -> Double {
        // Analyze left-right asymmetry in gait pattern
        let lateralAccelerations = readings.map { $0.accelerationY }
        let leftSteps = lateralAccelerations.filter { $0 > 0 }
        let rightSteps = lateralAccelerations.filter { $0 < 0 }

        guard !leftSteps.isEmpty && !rightSteps.isEmpty else { return 0 }

        let leftMean = leftSteps.reduce(0, +) / Double(leftSteps.count)
        let rightMean = abs(rightSteps.reduce(0, +) / Double(rightSteps.count))

        return abs(leftMean - rightMean) / max(leftMean, rightMean)
    }

    private func calculateStabilityIndex(readings: [SensorReading]) -> Double {
        // Calculate overall stability based on motion variance
        let totalVariance = readings.map { reading in
            pow(reading.accelerationX, 2) + pow(reading.accelerationY, 2) + pow(reading.accelerationZ, 2)
        }.reduce(0, +) / Double(readings.count)

        return 1.0 / (1.0 + totalVariance) // Higher stability = lower variance
    }

    private func calculateRhythmicity(readings: [SensorReading]) -> Double {
        // Analyze the rhythmicity of the gait pattern
        let accelerations = readings.map { $0.accelerationZ }
        let peaks = detectPeaks(in: accelerations)

        guard peaks.count > 2 else { return 0 }

        let intervals = zip(peaks.dropFirst(), peaks).map { $0.0 - $0.1 }
        let meanInterval = intervals.reduce(0, +) / Double(intervals.count)
        let variability = intervals.map { abs($0 - meanInterval) }.reduce(0, +) / Double(intervals.count)

        return 1.0 / (1.0 + variability) // Higher rhythmicity = lower interval variability
    }

    private func detectPeaks(in data: [Double]) -> [Int] {
        var peaks: [Int] = []
        let threshold = data.reduce(0, +) / Double(data.count) * 1.2 // 20% above mean

        for i in 1..<(data.count - 1) {
            if data[i] > threshold && data[i] > data[i-1] && data[i] > data[i+1] {
                peaks.append(i)
            }
        }

        return peaks
    }

    private func determineGaitState(from prediction: RealTimeGaitPrediction) -> GaitState {
        if prediction.fallRisk > 0.7 {
            return .highRisk
        } else if prediction.gaitQuality < 0.3 {
            return .unsteady
        } else if prediction.stabilityScore < 0.4 {
            return .cautious
        } else {
            return .normal
        }
    }

    private func determineFallRiskLevel(from prediction: RealTimeGaitPrediction) -> FallRiskLevel {
        if prediction.fallRisk > 0.8 {
            return .critical
        } else if prediction.fallRisk > 0.6 {
            return .high
        } else if prediction.fallRisk > 0.4 {
            return .moderate
        } else {
            return .low
        }
    }

    private func adjustThresholdsForUser(_ profile: UserProfile) {
        // Implement personalized threshold adjustment based on user profile
        print("🔧 Adjusting thresholds for user profile: age \(profile.age), conditions: \(profile.medicalConditions)")
    }
}

// MARK: - Supporting Data Models

// Use the canonical SensorReading model defined in Core/Models/GaitAnalysisModels.swift
// struct SensorReading { ... }  // removed local duplicate

struct RealTimeGaitFeatures {
    let stepVariability: Double
    let walkingSpeed: Double
    let gaitAsymmetry: Double
    let stabilityIndex: Double
    let rhythmicity: Double
    let timestamp: Date
}

struct RealTimeGaitPrediction {
    let fallRisk: Double
    let gaitQuality: Double
    let stabilityScore: Double
    let confidence: Double
}

struct RealTimeGaitMetrics {
    let timestamp: Date
    let walkingSpeed: Double
    let stepVariability: Double
    let gaitAsymmetry: Double
    let stabilityIndex: Double
    let fallRisk: Double
    let gaitQuality: Double
    let confidence: Double
}

typealias RealTimeEmergencyAlert = EmergencyAlert

struct GaitRecommendation {
    let id: UUID
    let type: RecommendationType
    let priority: Priority
    let title: String
    let message: String
    let actionTitle: String
}

// MARK: - Enums

enum GaitState {
    case normal
    case cautious
    case unsteady
    case highRisk

    var color: Color {
        switch self {
        case .normal: return .green
        case .cautious: return .yellow
        case .unsteady: return .orange
        case .highRisk: return .red
        }
    }

    var icon: String {
        switch self {
        case .normal: return "checkmark.circle.fill"
        case .cautious: return "exclamationmark.triangle.fill"
        case .unsteady: return "exclamationmark.circle.fill"
        case .highRisk: return "exclamationmark.octagon.fill"
        }
    }
}

// NOTE: FallRiskLevel is defined in EnhancedFallRiskTypes.swift to avoid duplication.
// EmergencyType, EmergencySeverity are in InfrastructureModels.swift (as EmergencyAlert.EmergencyType, etc.)

enum RecommendationType {
    case safety, improvement, exercise, medical
}

enum Priority {
    case low, medium, high
}
