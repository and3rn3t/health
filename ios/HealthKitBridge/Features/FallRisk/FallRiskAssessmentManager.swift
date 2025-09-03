import SwiftUI
import CoreMotion
import HealthKit
import Combine

// MARK: - Fall Risk Assessment Manager
@MainActor
class FallRiskAssessmentManager: ObservableObject {
    // MARK: - Published Properties
    @Published var currentRiskLevel: FallRiskLevel = .unknown
    @Published var riskFactors: [FallRiskFactor] = []
    @Published var assessmentHistory: [FallRiskAssessment] = []
    @Published var recommendations: [FallRiskRecommendation] = []
    @Published var isAssessing = false
    @Published var balanceScore: Double = 0.0
    @Published var stabilityMetrics: StabilityMetrics?

    // MARK: - Dependencies
    private let gaitAnalysisManager: GaitAnalysisManager
    private let healthStore = HKHealthStore()
    private let motionManager = CMMotionManager()

    // MARK: - Assessment State
    private var assessmentTimer: Timer?
    private var stabilityData: [StabilityDataPoint] = []
    private var cancellables = Set<AnyCancellable>()

    init(gaitAnalysisManager: GaitAnalysisManager) {
        self.gaitAnalysisManager = gaitAnalysisManager
        setupHealthKitObservation()
        loadAssessmentHistory()
    }

    // MARK: - Assessment Methods

    func performComprehensiveAssessment() async throws {
        isAssessing = true
        defer { isAssessing = false }

        print("🔍 Starting comprehensive fall risk assessment...")

        // Collect data from various sources
        let gaitData = await collectGaitData()
        let balanceData = await performBalanceTest()
        let healthData = await collectHealthMetrics()
        let environmentalData = await assessEnvironmentalFactors()

        // Analyze risk factors
        let riskFactors = analyzeRiskFactors(
            gait: gaitData,
            balance: balanceData,
            health: healthData,
            environmental: environmentalData
        )

        // Calculate overall risk level
        let riskLevel = calculateOverallRiskLevel(from: riskFactors)

        // Generate recommendations
        let recommendations = generateRecommendations(for: riskFactors)

        // Create assessment record
        let assessment = FallRiskAssessment(
            id: UUID(),
            timestamp: Date(),
            riskLevel: riskLevel,
            riskFactors: riskFactors,
            gaitMetrics: gaitData,
            balanceScore: balanceData.overallScore,
            recommendations: recommendations
        )

        // Update state
        self.currentRiskLevel = riskLevel
        self.riskFactors = riskFactors
        self.recommendations = recommendations
        self.assessmentHistory.insert(assessment, at: 0)

        // Save assessment
        saveAssessment(assessment)

        print("✅ Fall risk assessment completed. Risk level: \(riskLevel.rawValue)")
    }

    // MARK: - Balance Testing

    func performBalanceTest() async -> BalanceTestResult {
        guard motionManager.isDeviceMotionAvailable else {
            return BalanceTestResult(overallScore: 0, testResults: [:])
        }

        print("⚖️ Performing balance test...")

        var testResults: [BalanceTestType: Double] = [:]
        stabilityData.removeAll()

        // Single Leg Stand Test (30 seconds)
        let singleLegScore = await performSingleLegStandTest()
        testResults[.singleLegStand] = singleLegScore

        // Eyes Closed Balance Test (10 seconds)
        let eyesClosedScore = await performEyesClosedBalanceTest()
        testResults[.eyesClosed] = eyesClosedScore

        // Dynamic Balance Test (step in place)
        let dynamicScore = await performDynamicBalanceTest()
        testResults[.dynamic] = dynamicScore

        // Tandem Walk Test
        let tandemScore = await performTandemWalkTest()
        testResults[.tandemWalk] = tandemScore

        // Calculate overall balance score
        let overallScore = testResults.values.reduce(0, +) / Double(testResults.count)
        self.balanceScore = overallScore

        // Generate stability metrics
        self.stabilityMetrics = calculateStabilityMetrics(from: stabilityData)

        return BalanceTestResult(overallScore: overallScore, testResults: testResults)
    }

    private func performSingleLegStandTest() async -> Double {
        return await withCheckedContinuation { continuation in
            var swayMeasurements: [Double] = []
            var isStable = true
            let testDuration: TimeInterval = 30.0
            let startTime = Date()

            motionManager.deviceMotionUpdateInterval = 0.1
            motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
                guard let motion = motion, let self = self else { return }

                let elapsed = Date().timeIntervalSince(startTime)

                if elapsed >= testDuration {
                    self.motionManager.stopDeviceMotionUpdates()

                    // Calculate stability score based on sway measurements
                    let averageSway = swayMeasurements.isEmpty ? 0 : swayMeasurements.reduce(0, +) / Double(swayMeasurements.count)
                    let stabilityScore = max(0, min(100, 100 - (averageSway * 1000)))

                    continuation.resume(returning: stabilityScore)
                    return
                }

                // Calculate body sway
                let gravity = motion.gravity
                let userAcceleration = motion.userAcceleration

                let sway = sqrt(
                    pow(userAcceleration.x, 2) +
                    pow(userAcceleration.y, 2) +
                    pow(userAcceleration.z, 2)
                )

                swayMeasurements.append(sway)

                // Record stability data point
                let dataPoint = StabilityDataPoint(
                    timestamp: Date(),
                    sway: sway,
                    gravity: gravity,
                    userAcceleration: userAcceleration
                )
                self.stabilityData.append(dataPoint)
            }
        }
    }

    private func performEyesClosedBalanceTest() async -> Double {
        // Similar implementation to single leg stand but with different scoring
        return await performStabilityTest(duration: 10.0, testType: .eyesClosed)
    }

    private func performDynamicBalanceTest() async -> Double {
        return await performStabilityTest(duration: 15.0, testType: .dynamic)
    }

    private func performTandemWalkTest() async -> Double {
        return await performStabilityTest(duration: 20.0, testType: .tandemWalk)
    }

    private func performStabilityTest(duration: TimeInterval, testType: BalanceTestType) async -> Double {
        return await withCheckedContinuation { continuation in
            var measurements: [Double] = []
            let startTime = Date()

            motionManager.deviceMotionUpdateInterval = 0.1
            motionManager.startDeviceMotionUpdates(to: .main) { motion, error in
                guard let motion = motion else { return }

                let elapsed = Date().timeIntervalSince(startTime)

                if elapsed >= duration {
                    self.motionManager.stopDeviceMotionUpdates()

                    let score = self.calculateTestScore(measurements: measurements, testType: testType)
                    continuation.resume(returning: score)
                    return
                }

                let stability = self.calculateInstantaneousStability(from: motion)
                measurements.append(stability)
            }
        }
    }

    // MARK: - Data Collection

    private func collectGaitData() async -> GaitMetrics? {
        // Get the latest gait analysis from the gait manager
        return gaitAnalysisManager.latestGaitMetrics
    }

    private func collectHealthMetrics() async -> HealthRiskMetrics {
        var metrics = HealthRiskMetrics()

        // Age-related risk
        if let dateOfBirth = try? await getDateOfBirth() {
            let age = Calendar.current.dateComponents([.year], from: dateOfBirth, to: Date()).year ?? 0
            metrics.age = age
        }

        // Medication history (placeholder - would need specific implementation)
        metrics.medicationRiskScore = await assessMedicationRisk()

        // Previous falls (from HealthKit or user input)
        metrics.previousFalls = await getPreviousFallCount()

        // Chronic conditions
        metrics.chronicConditions = await assessChronicConditions()

        return metrics
    }

    private func assessEnvironmentalFactors() async -> EnvironmentalRiskFactors {
        // This would typically involve user input or smart home integration
        return EnvironmentalRiskFactors(
            homeHazards: .medium,
            lightingQuality: .good,
            floorSurfaces: .mixed,
            stairSafety: .good
        )
    }

    // MARK: - Risk Analysis

    private func analyzeRiskFactors(
        gait: GaitMetrics?,
        balance: BalanceTestResult,
        health: HealthRiskMetrics,
        environmental: EnvironmentalRiskFactors
    ) -> [FallRiskFactor] {
        var factors: [FallRiskFactor] = []

        // Gait-related risks
        if let gait = gait {
            if let walkingSpeed = gait.averageWalkingSpeed, walkingSpeed < 0.8 {
                factors.append(FallRiskFactor(
                    type: .slowWalkingSpeed,
                    severity: walkingSpeed < 0.6 ? .high : .medium,
                    description: "Walking speed below normal range",
                    value: walkingSpeed
                ))
            }

            if let asymmetry = gait.walkingAsymmetry, asymmetry > 0.1 {
                factors.append(FallRiskFactor(
                    type: .gaitAsymmetry,
                    severity: asymmetry > 0.15 ? .high : .medium,
                    description: "Significant gait asymmetry detected",
                    value: asymmetry
                ))
            }

            if let variability = gait.gaitVariability, variability > 0.1 {
                factors.append(FallRiskFactor(
                    type: .gaitVariability,
                    severity: variability > 0.15 ? .high : .medium,
                    description: "High gait variability indicating instability",
                    value: variability
                ))
            }
        }

        // Balance-related risks
        if balance.overallScore < 70 {
            factors.append(FallRiskFactor(
                type: .poorBalance,
                severity: balance.overallScore < 50 ? .high : .medium,
                description: "Below-average balance performance",
                value: balance.overallScore
            ))
        }

        // Age-related risk
        if health.age > 65 {
            let severity: RiskSeverity = health.age > 80 ? .high : .medium
            factors.append(FallRiskFactor(
                type: .advancedAge,
                severity: severity,
                description: "Increased fall risk due to age",
                value: Double(health.age)
            ))
        }

        // Medication risk
        if health.medicationRiskScore > 0.5 {
            factors.append(FallRiskFactor(
                type: .medicationEffects,
                severity: health.medicationRiskScore > 0.7 ? .high : .medium,
                description: "Medications that may affect balance or cognition",
                value: health.medicationRiskScore
            ))
        }

        // Previous falls
        if health.previousFalls > 0 {
            factors.append(FallRiskFactor(
                type: .fallHistory,
                severity: health.previousFalls > 2 ? .high : .medium,
                description: "History of previous falls",
                value: Double(health.previousFalls)
            ))
        }

        // Environmental risks
        if environmental.homeHazards != .low {
            factors.append(FallRiskFactor(
                type: .environmentalHazards,
                severity: environmental.homeHazards == .high ? .high : .medium,
                description: "Environmental hazards in living space",
                value: Double(environmental.homeHazards.rawValue)
            ))
        }

        return factors
    }

    private func calculateOverallRiskLevel(from factors: [FallRiskFactor]) -> FallRiskLevel {
        let highRiskCount = factors.filter { $0.severity == .high }.count
        let mediumRiskCount = factors.filter { $0.severity == .medium }.count
        let totalRiskScore = Double(highRiskCount * 3 + mediumRiskCount * 2)

        if highRiskCount >= 2 || totalRiskScore >= 8 {
            return .high
        } else if highRiskCount >= 1 || mediumRiskCount >= 2 || totalRiskScore >= 4 {
            return .medium
        } else if factors.isEmpty {
            return .low
        } else {
            return .low
        }
    }

    // MARK: - Recommendations

    private func generateRecommendations(for riskFactors: [FallRiskFactor]) -> [FallRiskRecommendation] {
        var recommendations: [FallRiskRecommendation] = []

        for factor in riskFactors {
            switch factor.type {
            case .slowWalkingSpeed:
                recommendations.append(FallRiskRecommendation(
                    type: .exerciseProgram,
                    priority: .high,
                    title: "Improve Walking Speed",
                    description: "Regular walking exercises and strength training can help improve walking speed and reduce fall risk.",
                    actions: [
                        "Start with 10-minute daily walks",
                        "Gradually increase walking pace",
                        "Add resistance training 2-3 times per week",
                        "Consider physical therapy consultation"
                    ]
                ))

            case .poorBalance:
                recommendations.append(FallRiskRecommendation(
                    type: .balanceTraining,
                    priority: .high,
                    title: "Balance Training Program",
                    description: "Specific balance exercises can significantly improve stability and reduce fall risk.",
                    actions: [
                        "Practice single-leg stands daily",
                        "Try tai chi or yoga classes",
                        "Use balance training apps",
                        "Consider professional balance assessment"
                    ]
                ))

            case .gaitAsymmetry:
                recommendations.append(FallRiskRecommendation(
                    type: .medicalConsultation,
                    priority: .medium,
                    title: "Address Gait Asymmetry",
                    description: "Gait asymmetry may indicate underlying issues that should be evaluated.",
                    actions: [
                        "Consult with a physical therapist",
                        "Check for leg length differences",
                        "Assess for muscle imbalances",
                        "Consider gait training exercises"
                    ]
                ))

            case .environmentalHazards:
                recommendations.append(FallRiskRecommendation(
                    type: .homeModification,
                    priority: .medium,
                    title: "Home Safety Improvements",
                    description: "Making your home safer can prevent many falls from occurring.",
                    actions: [
                        "Remove loose rugs and clutter",
                        "Install handrails on stairs",
                        "Improve lighting in all areas",
                        "Add grab bars in bathroom",
                        "Secure electrical cords"
                    ]
                ))

            case .medicationEffects:
                recommendations.append(FallRiskRecommendation(
                    type: .medicationReview,
                    priority: .high,
                    title: "Medication Review",
                    description: "Some medications can increase fall risk. A review with your healthcare provider is recommended.",
                    actions: [
                        "Schedule medication review with doctor",
                        "Discuss side effects that affect balance",
                        "Consider timing of medication doses",
                        "Ask about alternative medications"
                    ]
                ))

            default:
                break
            }
        }

        // Add general recommendations
        if riskFactors.contains(where: { $0.severity == .high }) {
            recommendations.append(FallRiskRecommendation(
                type: .medicalConsultation,
                priority: .high,
                title: "Healthcare Provider Consultation",
                description: "Given your elevated fall risk, consult with your healthcare provider for a comprehensive evaluation.",
                actions: [
                    "Schedule appointment with primary care physician",
                    "Bring fall risk assessment results",
                    "Discuss any recent changes in balance or mobility",
                    "Consider referral to fall prevention specialist"
                ]
            ))
        }

        return recommendations
    }

    // MARK: - Helper Methods

    private func calculateStabilityMetrics(from data: [StabilityDataPoint]) -> StabilityMetrics {
        guard !data.isEmpty else {
            return StabilityMetrics(averageSway: 0, peakSway: 0, swayVariability: 0, stabilityIndex: 0)
        }

        let swayValues = data.map { $0.sway }
        let averageSway = swayValues.reduce(0, +) / Double(swayValues.count)
        let peakSway = swayValues.max() ?? 0

        // Calculate variability (standard deviation)
        let variance = swayValues.map { pow($0 - averageSway, 2) }.reduce(0, +) / Double(swayValues.count)
        let swayVariability = sqrt(variance)

        // Calculate stability index (lower is better)
        let stabilityIndex = (averageSway * 0.6) + (swayVariability * 0.4)

        return StabilityMetrics(
            averageSway: averageSway,
            peakSway: peakSway,
            swayVariability: swayVariability,
            stabilityIndex: stabilityIndex
        )
    }

    private func calculateTestScore(measurements: [Double], testType: BalanceTestType) -> Double {
        guard !measurements.isEmpty else { return 0 }

        let average = measurements.reduce(0, +) / Double(measurements.count)

        // Different scoring for different test types
        switch testType {
        case .singleLegStand:
            return max(0, min(100, 100 - (average * 1000)))
        case .eyesClosed:
            return max(0, min(100, 100 - (average * 800)))
        case .dynamic:
            return max(0, min(100, 100 - (average * 600)))
        case .tandemWalk:
            return max(0, min(100, 100 - (average * 700)))
        }
    }

    private func calculateInstantaneousStability(from motion: CMDeviceMotion) -> Double {
        let userAcceleration = motion.userAcceleration
        return sqrt(
            pow(userAcceleration.x, 2) +
            pow(userAcceleration.y, 2) +
            pow(userAcceleration.z, 2)
        )
    }

    // MARK: - HealthKit Helpers

    private func setupHealthKitObservation() {
        // Setup observers for relevant health data changes
    }

    private func getDateOfBirth() async throws -> Date? {
        return try await withCheckedThrowingContinuation { continuation in
            do {
                let dateOfBirth = try healthStore.dateOfBirthComponents()
                continuation.resume(returning: dateOfBirth.date)
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    private func assessMedicationRisk() async -> Double {
        // Placeholder - would need medication data from HealthKit or user input
        return 0.3
    }

    private func getPreviousFallCount() async -> Int {
        // Placeholder - would query HealthKit for fall incidents
        return 0
    }

    private func assessChronicConditions() async -> [String] {
        // Placeholder - would query HealthKit for relevant conditions
        return []
    }

    // MARK: - Persistence

    private func loadAssessmentHistory() {
        // Load from Core Data or UserDefaults
        if let data = UserDefaults.standard.data(forKey: "FallRiskAssessmentHistory"),
           let history = try? JSONDecoder().decode([FallRiskAssessment].self, from: data) {
            assessmentHistory = history
        }
    }

    private func saveAssessment(_ assessment: FallRiskAssessment) {
        do {
            let data = try JSONEncoder().encode(assessmentHistory)
            UserDefaults.standard.set(data, forKey: "FallRiskAssessmentHistory")
        } catch {
            print("❌ Failed to save assessment: \(error)")
        }
    }
}

// MARK: - Supporting Types

enum FallRiskLevel: String, Codable, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case unknown = "unknown"

    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .red
        case .unknown: return .gray
        }
    }

    var description: String {
        switch self {
        case .low: return "Low fall risk"
        case .medium: return "Moderate fall risk"
        case .high: return "High fall risk"
        case .unknown: return "Risk level unknown"
        }
    }
}

enum FallRiskFactorType: String, Codable, CaseIterable {
    case slowWalkingSpeed = "slow_walking_speed"
    case poorBalance = "poor_balance"
    case gaitAsymmetry = "gait_asymmetry"
    case gaitVariability = "gait_variability"
    case advancedAge = "advanced_age"
    case medicationEffects = "medication_effects"
    case fallHistory = "fall_history"
    case environmentalHazards = "environmental_hazards"
    case visionProblems = "vision_problems"
    case cognitiveImpairment = "cognitive_impairment"
}

enum RiskSeverity: String, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
}

struct FallRiskFactor: Codable, Identifiable {
    let id = UUID()
    let type: FallRiskFactorType
    let severity: RiskSeverity
    let description: String
    let value: Double
    let timestamp: Date = Date()
}

struct FallRiskAssessment: Codable, Identifiable {
    let id: UUID
    let timestamp: Date
    let riskLevel: FallRiskLevel
    let riskFactors: [FallRiskFactor]
    let gaitMetrics: GaitMetrics?
    let balanceScore: Double
    let recommendations: [FallRiskRecommendation]
}

enum BalanceTestType: String, Codable, CaseIterable {
    case singleLegStand = "single_leg_stand"
    case eyesClosed = "eyes_closed"
    case dynamic = "dynamic"
    case tandemWalk = "tandem_walk"
}

struct BalanceTestResult {
    let overallScore: Double
    let testResults: [BalanceTestType: Double]
}

struct StabilityMetrics: Codable {
    let averageSway: Double
    let peakSway: Double
    let swayVariability: Double
    let stabilityIndex: Double
}

struct StabilityDataPoint {
    let timestamp: Date
    let sway: Double
    let gravity: CMAcceleration
    let userAcceleration: CMAcceleration
}

struct HealthRiskMetrics {
    var age: Int = 0
    var medicationRiskScore: Double = 0
    var previousFalls: Int = 0
    var chronicConditions: [String] = []
}

enum EnvironmentalRiskLevel: Int, Codable {
    case low = 1
    case medium = 2
    case high = 3
}

struct EnvironmentalRiskFactors {
    let homeHazards: EnvironmentalRiskLevel
    let lightingQuality: EnvironmentalRiskLevel
    let floorSurfaces: EnvironmentalRiskLevel
    let stairSafety: EnvironmentalRiskLevel
}

enum FallRiskRecommendationType: String, Codable {
    case exerciseProgram = "exercise_program"
    case balanceTraining = "balance_training"
    case homeModification = "home_modification"
    case medicationReview = "medication_review"
    case medicalConsultation = "medical_consultation"
    case visionCheck = "vision_check"
}

enum RecommendationPriority: String, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
}

struct FallRiskRecommendation: Codable, Identifiable {
    let id = UUID()
    let type: FallRiskRecommendationType
    let priority: RecommendationPriority
    let title: String
    let description: String
    let actions: [String]
    let timestamp: Date = Date()
}
