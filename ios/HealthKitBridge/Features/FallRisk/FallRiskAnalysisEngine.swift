import Foundation
import HealthKit
import CoreMotion

// MARK: - Fall Risk Analysis Engine
// Advanced fall risk detection and prevention system

class FallRiskAnalysisEngine: ObservableObject {
    static let shared = FallRiskAnalysisEngine()
    
    // MARK: - Published Properties
    @Published var currentRiskLevel: FallRiskLevel = .unknown
    @Published var riskScore: Double = 0.0 // 0-100 scale
    @Published var riskFactors: [RiskFactor] = []
    @Published var recommendations: [Recommendation] = []
    @Published var gaitAnalysis: GaitAnalysis?
    @Published var balanceMetrics: BalanceMetrics?
    @Published var environmentalRisks: [EnvironmentalRisk] = []
    @Published var lastAssessment: Date?
    
    // Additional computed properties for UI integration
    var latestRiskLevel: FallRiskLevel? {
        return currentRiskLevel != .unknown ? currentRiskLevel : nil
    }
    
    var latestRiskFactors: [String]? {
        guard !riskFactors.isEmpty else { return nil }
        return Array(riskFactors.prefix(3).map { $0.description })
    }
    
    var lastAssessmentTime: Date? {
        return lastAssessment
    }
    
    // MARK: - Risk Levels
    enum FallRiskLevel: String, CaseIterable {
        case low = "Low Risk"
        case moderate = "Moderate Risk"
        case high = "High Risk"
        case critical = "Critical Risk"
        case unknown = "Assessment Needed"
        
        var color: String {
            switch self {
            case .low: return "green"
            case .moderate: return "yellow"
            case .high: return "orange"
            case .critical: return "red"
            case .unknown: return "gray"
            }
        }
        
        var emoji: String {
            switch self {
            case .low: return "✅"
            case .moderate: return "⚠️"
            case .high: return "🟠"
            case .critical: return "🚨"
            case .unknown: return "❓"
            }
        }
    }
    
    // MARK: - Risk Factors
    struct RiskFactor {
        let id = UUID()
        let type: RiskType
        let severity: Severity
        let value: Double
        let description: String
        let detectedAt: Date
        
        enum RiskType {
            case walkingSteadiness
            case gaitSpeed
            case balanceStability
            case muscleWeakness
            case medicationSideEffect
            case visionImpairment
            case cognitiveDecline
            case environmentalHazard
            case previousFalls
        }
        
        enum Severity: Int, CaseIterable {
            case low = 1
            case moderate = 2
            case high = 3
            case critical = 4
        }
    }
    
    // MARK: - Gait Analysis
    struct GaitAnalysis {
        let averageSpeed: Double // m/s
        let stepLength: Double // meters
        let cadence: Double // steps/minute
        let symmetry: Double // 0-1 scale
        let steadiness: Double // 0-1 scale
        let confidence: Double // 0-1 scale
        let timestamp: Date
        
        var isAbnormal: Bool {
            return averageSpeed < 0.8 || // Slow walking speed
                   symmetry < 0.85 || // Poor symmetry
                   steadiness < 0.7 || // Poor steadiness
                   cadence < 100 // Low cadence
        }
    }
    
    // MARK: - Balance Metrics
    struct BalanceMetrics {
        let staticBalance: Double // 0-1 scale
        let dynamicBalance: Double // 0-1 scale
        let posturaSwayArea: Double // cm²
        let reactionTime: Double // milliseconds
        let timestamp: Date
        
        var isImpaired: Bool {
            return staticBalance < 0.7 ||
                   dynamicBalance < 0.6 ||
                   posturaSwayArea > 5.0 ||
                   reactionTime > 500
        }
    }
    
    // MARK: - Environmental Risks
    struct EnvironmentalRisk {
        let id = UUID()
        let type: String
        let location: String
        let severity: RiskFactor.Severity
        let detectedAt: Date
        let description: String
    }
    
    // MARK: - Recommendations
    struct Recommendation {
        let id = UUID()
        let category: Category
        let title: String
        let description: String
        let priority: Priority
        let actionable: Bool
        let estimatedImpact: Double // 0-1 scale
        
        enum Category {
            case exercise, environment, medical, lifestyle, safety
        }
        
        enum Priority: Int, CaseIterable {
            case low = 1
            case medium = 2
            case high = 3
            case urgent = 4
        }
    }
    
    // MARK: - Motion Manager
    private let motionManager = CMMotionManager()
    private var accelerometerData: [CMAccelerometerData] = []
    private var gyroscopeData: [CMGyroData] = []
    
    // MARK: - Analysis Parameters
    private let riskFactorWeights: [RiskFactor.RiskType: Double] = [
        .walkingSteadiness: 0.25,
        .gaitSpeed: 0.20,
        .balanceStability: 0.20,
        .previousFalls: 0.15,
        .muscleWeakness: 0.10,
        .medicationSideEffect: 0.05,
        .visionImpairment: 0.03,
        .cognitiveDecline: 0.02
    ]
    
    private init() {
        setupMotionTracking()
    }
    
    // MARK: - Main Analysis Function
    func performFallRiskAssessment(healthData: [String: Double]) async {
        print("🔍 Performing comprehensive fall risk assessment...")
        
        await MainActor.run {
            lastAssessment = Date()
            riskFactors.removeAll()
            recommendations.removeAll()
        }
        
        // Analyze health metrics
        await analyzeHealthMetrics(healthData)
        
        // Analyze motion patterns
        await analyzeMotionPatterns()
        
        // Calculate overall risk score
        let calculatedScore = calculateRiskScore()
        let riskLevel = determineRiskLevel(score: calculatedScore)
        
        // Generate recommendations
        let newRecommendations = generateRecommendations()
        
        await MainActor.run {
            self.riskScore = calculatedScore
            self.currentRiskLevel = riskLevel
            self.recommendations = newRecommendations
        }
        
        print("✅ Fall risk assessment completed. Risk Level: \(riskLevel.rawValue), Score: \(Int(calculatedScore))")
    }
    
    // MARK: - Health Metrics Analysis
    private func analyzeHealthMetrics(_ healthData: [String: Double]) async {
        // Walking Steadiness Analysis
        if let walkingSteadiness = healthData["walking_steadiness"] {
            await analyzeWalkingSteadiness(walkingSteadiness)
        }
        
        // Gait Speed Analysis (derived from steps and distance)
        if let steps = healthData["steps"], let distance = healthData["distance"] {
            await analyzeGaitMetrics(steps: steps, distance: distance)
        }
        
        // NEW: Advanced Running Gait Analysis
        if let groundContactTime = healthData["running_ground_contact_time"] {
            await analyzeRunningGaitMetrics(groundContactTime: groundContactTime)
        }
        
        // NEW: Cardiovascular Fitness Assessment
        if let vo2Max = healthData["vo2_max"] {
            await analyzeCardiovascularFitness(vo2Max)
        }
        
        // NEW: Activity Level & Mobility Assessment
        if let flightsClimbed = healthData["flights_climbed"] {
            await analyzeStairClimbingAbility(flightsClimbed)
        }
        
        // Enhanced Heart Rate Analysis
        if let heartRate = healthData["heart_rate"] {
            await analyzeHeartRatePatterns(heartRate)
        }
        
        // NEW: Heart Rate Variability Analysis
        if let hrv = healthData["heart_rate_variability"] {
            await analyzeHeartRateVariability(hrv)
        }
        
        // Activity Level Analysis
        if let activeEnergy = healthData["active_energy"] {
            await analyzeActivityLevel(activeEnergy)
        }
        
        // NEW: Sedentary Behavior Analysis
        if let standTime = healthData["stand_time"] {
            await analyzeSedentaryBehavior(standTime)
        }
        
        // NEW: Critical Blood Pressure Analysis (Orthostatic Hypotension)
        if let systolic = healthData["blood_pressure_systolic"], let diastolic = healthData["blood_pressure_diastolic"] {
            await analyzeBloodPressure(systolic: systolic, diastolic: diastolic)
        }
        
        // NEW: Sleep Quality Impact on Balance
        if let timeInDaylight = healthData["time_in_daylight"] {
            await analyzeSleepCircadianImpact(timeInDaylight)
        }
        
        // NEW: Respiratory Health Impact
        if let respiratoryRate = healthData["respiratory_rate"] {
            await analyzeRespiratoryPatterns(respiratoryRate)
        }
        
        // NEW: Oxygen Saturation Analysis
        if let oxygenSat = healthData["oxygen_saturation"] {
            await analyzeOxygenSaturation(oxygenSat)
        }
        
        // NEW: Body Temperature Impact
        if let bodyTemp = healthData["body_temperature"] {
            await analyzeBodyTemperature(bodyTemp)
        }
        
        // NEW: Cycling Balance & Coordination
        if let cyclingCadence = healthData["cycling_cadence"] {
            await analyzeCyclingCoordination(cyclingCadence)
        }
        
        // NEW: Swimming Coordination Analysis
        if let swimmingStrokes = healthData["swimming_stroke_count"] {
            await analyzeSwimmingCoordination(swimmingStrokes)
        }
        
        // NEW: Walking Heart Rate Response
        if let walkingHR = healthData["walking_heart_rate_average"] {
            await analyzeWalkingHeartRateResponse(walkingHR)
        }
    }
    
    private func analyzeWalkingSteadiness(_ steadiness: Double) async {
        // Apple's walking steadiness scale: 0-100%
        if steadiness < 50 {
            let severity: RiskFactor.Severity = steadiness < 25 ? .critical : .high
            let riskFactor = RiskFactor(
                type: .walkingSteadiness,
                severity: severity,
                value: steadiness,
                description: "Walking steadiness is \(Int(steadiness))% - indicates increased fall risk",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeGaitMetrics(steps: Double, distance: Double) async {
        // Calculate approximate gait speed (simplified)
        let timeWindow: Double = 3600 // 1 hour window
        let avgSpeed = distance / timeWindow // m/s approximation
        
        let gaitAnalysis = GaitAnalysis(
            averageSpeed: avgSpeed,
            stepLength: distance / steps,
            cadence: steps / (timeWindow / 60),
            symmetry: 0.9, // Would need more sophisticated analysis
            steadiness: 0.8, // Would need accelerometer data
            confidence: 0.7,
            timestamp: Date()
        )
        
        await MainActor.run {
            self.gaitAnalysis = gaitAnalysis
        }
        
        if gaitAnalysis.isAbnormal {
            let riskFactor = RiskFactor(
                type: .gaitSpeed,
                severity: avgSpeed < 0.6 ? .high : .moderate,
                value: avgSpeed,
                description: "Gait speed of \(String(format: "%.2f", avgSpeed)) m/s indicates mobility concerns",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeRunningGaitMetrics(groundContactTime: Double) async {
        // Ground contact time analysis (normal range: 150-300ms)
        if groundContactTime > 300 { // ms
            let riskFactor = RiskFactor(
                type: .gaitSpeed,
                severity: groundContactTime > 400 ? .high : .moderate,
                value: groundContactTime,
                description: "Ground contact time of \(Int(groundContactTime))ms indicates potential gait instability",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeCardiovascularFitness(_ vo2Max: Double) async {
        // VO2 Max analysis (age-adjusted norms)
        // Low VO2 Max indicates poor fitness = higher fall risk
        let lowThreshold: Double = 25.0 // Simplified threshold
        
        if vo2Max < lowThreshold {
            let riskFactor = RiskFactor(
                type: .muscleWeakness,
                severity: vo2Max < 20 ? .high : .moderate,
                value: vo2Max,
                description: "VO2 Max of \(String(format: "%.1f", vo2Max)) ml/kg/min indicates poor cardiovascular fitness",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeStairClimbingAbility(_ flightsClimbed: Double) async {
        // Stair climbing ability is a key fall risk indicator
        // Low daily stair climbing suggests mobility limitations
        if flightsClimbed < 3 { // Less than 3 flights per day
            let riskFactor = RiskFactor(
                type: .muscleWeakness,
                severity: flightsClimbed < 1 ? .high : .moderate,
                value: flightsClimbed,
                description: "Only \(Int(flightsClimbed)) flights climbed today suggests limited mobility",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeHeartRatePatterns(_ heartRate: Double) async {
        // Analyze for orthostatic hypotension indicators
        // This would be more sophisticated with continuous monitoring
        if heartRate > 100 || heartRate < 50 {
            let riskFactor = RiskFactor(
                type: .medicationSideEffect,
                severity: .moderate,
                value: heartRate,
                description: "Heart rate of \(Int(heartRate)) BPM may indicate medication effects or cardiovascular issues",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeHeartRateVariability(_ hrv: Double) async {
        // Low HRV indicates poor autonomic function = balance issues
        // Normal HRV is typically 20-50ms (simplified)
        if hrv < 20 {
            let riskFactor = RiskFactor(
                type: .balanceStability,
                severity: hrv < 15 ? .high : .moderate,
                value: hrv,
                description: "Heart rate variability of \(String(format: "%.1f", hrv))ms suggests autonomic dysfunction affecting balance",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeActivityLevel(_ activeEnergy: Double) async {
        // Low activity level indicates muscle weakness risk
        let dailyTarget: Double = 400 // kcal
        if activeEnergy < dailyTarget * 0.5 {
            let riskFactor = RiskFactor(
                type: .muscleWeakness,
                severity: activeEnergy < dailyTarget * 0.25 ? .high : .moderate,
                value: activeEnergy,
                description: "Low activity level (\(Int(activeEnergy)) kcal) suggests muscle weakness risk",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeSedentaryBehavior(_ standTime: Double) async {
        // Low stand time indicates sedentary lifestyle = muscle weakness
        let dailyTarget: Double = 8 * 60 // 8 hours in minutes
        
        if standTime < dailyTarget * 0.3 { // Less than 2.4 hours standing
            let riskFactor = RiskFactor(
                type: .muscleWeakness,
                severity: standTime < dailyTarget * 0.15 ? .high : .moderate,
                value: standTime,
                description: "Only \(Int(standTime/60)) hours standing today indicates sedentary lifestyle",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeBloodPressure(systolic: Double, diastolic: Double) async {
        // Orthostatic hypotension is a major fall risk factor
        // Normal: <140/90, Hypertensive: >140/90, Hypotensive: <90/60
        
        if systolic < 90 || diastolic < 60 {
            // Hypotension - major fall risk
            let riskFactor = RiskFactor(
                type: .medicationSideEffect,
                severity: systolic < 80 ? .critical : .high,
                value: systolic,
                description: "Blood pressure \(Int(systolic))/\(Int(diastolic)) indicates hypotension - major fall risk",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        } else if systolic > 180 || diastolic > 110 {
            // Severe hypertension can also affect balance
            let riskFactor = RiskFactor(
                type: .medicationSideEffect,
                severity: .moderate,
                value: systolic,
                description: "Severe hypertension \(Int(systolic))/\(Int(diastolic)) may affect balance and medication side effects",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeSleepCircadianImpact(_ timeInDaylight: Double) async {
        // Insufficient daylight exposure affects circadian rhythm and balance
        let minimumDaylight: Double = 2 * 60 // 2 hours in minutes
        
        if timeInDaylight < minimumDaylight {
            let riskFactor = RiskFactor(
                type: .cognitiveDecline,
                severity: timeInDaylight < 60 ? .high : .moderate,
                value: timeInDaylight,
                description: "Only \(Int(timeInDaylight/60)) hours daylight exposure affects circadian rhythm and balance",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeRespiratoryPatterns(_ respiratoryRate: Double) async {
        // Abnormal respiratory rate can indicate physical stress affecting balance
        // Normal: 12-20 breaths per minute
        
        if respiratoryRate > 24 || respiratoryRate < 10 {
            let riskFactor = RiskFactor(
                type: .medicationSideEffect,
                severity: respiratoryRate > 30 || respiratoryRate < 8 ? .high : .moderate,
                value: respiratoryRate,
                description: "Respiratory rate of \(Int(respiratoryRate)) breaths/min indicates physical stress affecting balance",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeOxygenSaturation(_ oxygenSat: Double) async {
        // Low oxygen saturation affects cognitive function and balance
        // Normal: 95-100%
        
        if oxygenSat < 95 {
            let riskFactor = RiskFactor(
                type: .cognitiveDecline,
                severity: oxygenSat < 90 ? .critical : .high,
                value: oxygenSat,
                description: "Oxygen saturation of \(Int(oxygenSat))% affects cognitive function and balance",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeBodyTemperature(_ bodyTemp: Double) async {
        // Fever or hypothermia affects balance and coordination
        // Normal: 36.1-37.2°C (97-99°F)
        
        if bodyTemp > 38.0 || bodyTemp < 35.0 { // °C
            let riskFactor = RiskFactor(
                type: .medicationSideEffect,
                severity: bodyTemp > 39.0 || bodyTemp < 34.0 ? .high : .moderate,
                value: bodyTemp,
                description: "Body temperature of \(String(format: "%.1f", bodyTemp))°C affects balance and coordination",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeCyclingCoordination(_ cyclingCadence: Double) async {
        // Low cycling cadence indicates poor coordination/balance
        // Normal cycling cadence: 60-90 RPM
        
        if cyclingCadence < 50 && cyclingCadence > 0 {
            let riskFactor = RiskFactor(
                type: .balanceStability,
                severity: cyclingCadence < 40 ? .moderate : .low,
                value: cyclingCadence,
                description: "Low cycling cadence of \(Int(cyclingCadence)) RPM suggests coordination concerns",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeSwimmingCoordination(_ swimmingStrokes: Double) async {
        // Swimming stroke efficiency indicates coordination and balance
        // High stroke count for distance suggests poor efficiency/coordination
        // This would need distance data for proper analysis, but we can detect unusual patterns
        
        if swimmingStrokes > 100 { // Simplified threshold
            let riskFactor = RiskFactor(
                type: .balanceStability,
                severity: .low,
                value: swimmingStrokes,
                description: "High swimming stroke count may indicate coordination inefficiency",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    private func analyzeWalkingHeartRateResponse(_ walkingHR: Double) async {
        // Abnormal heart rate response during walking indicates cardiovascular issues
        // Combined with resting HR, this shows cardiovascular fitness
        
        // This would be more sophisticated with resting HR comparison
        if walkingHR > 140 {
            let riskFactor = RiskFactor(
                type: .muscleWeakness,
                severity: walkingHR > 160 ? .high : .moderate,
                value: walkingHR,
                description: "Walking heart rate of \(Int(walkingHR)) BPM indicates poor cardiovascular fitness",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    // MARK: - Motion Pattern Analysis
    private func analyzeMotionPatterns() async {
        // This would analyze accelerometer and gyroscope data
        // for balance and stability patterns
        
        let balanceMetrics = BalanceMetrics(
            staticBalance: 0.8,
            dynamicBalance: 0.7,
            posturaSwayArea: 3.2,
            reactionTime: 350,
            timestamp: Date()
        )
        
        await MainActor.run {
            self.balanceMetrics = balanceMetrics
        }
        
        if balanceMetrics.isImpaired {
            let riskFactor = RiskFactor(
                type: .balanceStability,
                severity: .moderate,
                value: balanceMetrics.staticBalance,
                description: "Balance analysis shows stability concerns",
                detectedAt: Date()
            )
            
            await MainActor.run {
                self.riskFactors.append(riskFactor)
            }
        }
    }
    
    // MARK: - Risk Calculation
    private func calculateRiskScore() -> Double {
        var totalScore: Double = 0
        var totalWeight: Double = 0
        
        for riskFactor in riskFactors {
            if let weight = riskFactorWeights[riskFactor.type] {
                let factorScore = Double(riskFactor.severity.rawValue) * 25 // 25, 50, 75, 100
                totalScore += factorScore * weight
                totalWeight += weight
            }
        }
        
        return totalWeight > 0 ? totalScore / totalWeight : 0
    }
    
    private func determineRiskLevel(score: Double) -> FallRiskLevel {
        switch score {
        case 0..<25: return .low
        case 25..<50: return .moderate
        case 50..<75: return .high
        case 75...100: return .critical
        default: return .unknown
        }
    }
    
    // MARK: - Recommendations Generation
    private func generateRecommendations() -> [Recommendation] {
        var recommendations: [Recommendation] = []
        
        // Exercise recommendations
        if riskFactors.contains(where: { $0.type == .muscleWeakness || $0.type == .balanceStability }) {
            recommendations.append(Recommendation(
                category: .exercise,
                title: "Balance Training Program",
                description: "Perform tai chi or yoga for 20 minutes, 3 times per week to improve balance and strength",
                priority: .high,
                actionable: true,
                estimatedImpact: 0.7
            ))
            
            recommendations.append(Recommendation(
                category: .exercise,
                title: "Strength Training",
                description: "Focus on leg strengthening exercises 2-3 times per week",
                priority: .medium,
                actionable: true,
                estimatedImpact: 0.6
            ))
        }
        
        // Gait-specific recommendations
        if riskFactors.contains(where: { $0.type == .gaitSpeed || $0.type == .walkingSteadiness }) {
            recommendations.append(Recommendation(
                category: .medical,
                title: "Gait Assessment",
                description: "Consider physical therapy evaluation for gait training",
                priority: .high,
                actionable: true,
                estimatedImpact: 0.8
            ))
        }
        
        // Safety recommendations
        if currentRiskLevel == .high || currentRiskLevel == .critical {
            recommendations.append(Recommendation(
                category: .safety,
                title: "Home Safety Audit",
                description: "Remove throw rugs, improve lighting, install grab bars in bathroom",
                priority: .urgent,
                actionable: true,
                estimatedImpact: 0.9
            ))
            
            recommendations.append(Recommendation(
                category: .safety,
                title: "Emergency Response Plan",
                description: "Consider a medical alert device and emergency contact system",
                priority: .high,
                actionable: true,
                estimatedImpact: 0.8
            ))
        }
        
        // Medication review
        if riskFactors.contains(where: { $0.type == .medicationSideEffect }) {
            recommendations.append(Recommendation(
                category: .medical,
                title: "Medication Review",
                description: "Discuss current medications with healthcare provider for fall risk assessment",
                priority: .high,
                actionable: true,
                estimatedImpact: 0.7
            ))
        }
        
        return recommendations.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }
    
    // MARK: - Motion Tracking Setup
    private func setupMotionTracking() {
        if motionManager.isAccelerometerAvailable {
            motionManager.accelerometerUpdateInterval = 0.1
            motionManager.startAccelerometerUpdates()
        }
        
        if motionManager.isGyroAvailable {
            motionManager.gyroUpdateInterval = 0.1
            motionManager.startGyroUpdates()
        }
    }
    
    // MARK: - Public Interface Methods
    func getRiskSummary() -> String {
        let level = currentRiskLevel.rawValue
        let score = Int(riskScore)
        let factorCount = riskFactors.count
        
        return "\(currentRiskLevel.emoji) \(level) (Score: \(score)/100) - \(factorCount) risk factors identified"
    }
    
    func getTopRecommendations(limit: Int = 3) -> [Recommendation] {
        return Array(recommendations.prefix(limit))
    }
    
    func clearAssessment() {
        riskFactors.removeAll()
        recommendations.removeAll()
        currentRiskLevel = .unknown
        riskScore = 0.0
        lastAssessment = nil
    }
}
