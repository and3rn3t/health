import Foundation

/// Builds a consolidated GaitAssessment at session end using the last streamed metrics & risk info.
/// (Future: integrate posture analyzer & richer balance/environment context.)
struct GaitPostSessionFusion {
    static func buildAssessment(metrics m: GaitMetrics, risk: GaitRiskAssessment, posture: PostureAnalysisResult? = nil, environment: EnvironmentAnalysisResult? = nil, sessionDuration: TimeInterval? = nil, qualityConfidence: Double? = nil, floorStd: Double? = nil) -> GaitAssessment {
        // Normalize gait cycle values
        let rawStance = m.stanceTime ?? 60
        let rawSwing = m.swingTime ?? (100 - rawStance)
        let rawDoubleSupport = m.doubleSupportTime ?? 12
        // Recompute single support: stance includes double support; singleSupport = stance - doubleSupport
        let singleSupport = max(0, rawStance - rawDoubleSupport)
        // Re-balance swing if totals drift
        let stancePct = rawStance
        let swingPct = max(0, 100 - stancePct)
        let dsPct = rawDoubleSupport
        let strideTime = estimateStrideTime(speed: m.averageWalkingSpeed, strideLength: m.strideLength)
        let stepTime = strideTime.map { $0 / 2 }
        let cadence = m.stepFrequency ?? (stepTime.map { 60 / $0 } ?? 100)

        let gaitCycle = GaitCycleAnalysis(
            stancePhasePercentage: stancePct,
            swingPhasePercentage: swingPct,
            doubleSupportPercentage: dsPct,
            singleSupportPercentage: singleSupport,
            cadence: cadence,
            strideTime: strideTime ?? 1.2,
            stepTime: stepTime ?? 0.6
        )

        // Balance metrics from posture if available; otherwise placeholder zeros
        let (mlSway, apSway, totalSway, postureStability) : (Double, Double, Double, Double) = {
            if let p = posture {
                return (Double(p.posturalSway.mediolateral), Double(p.posturalSway.anteriorPosterior), Double(p.posturalSway.totalSway), Double(p.balanceMetrics.stabilityIndex))
            }
            return (0,0,0,0)
        }()
        let balance = BalanceMetrics(
            mediolateralSway: mlSway,
            anteroposteriorSway: apSway,
            swayVelocity: totalSway / max(1.0, Double(strideTime ?? 1.2)),
            postualStability: postureStability,
            dynamicBalance: (postureStability * 0.9)
        )

        let temporal = TemporalSpatialParameters(
            stepLength: .init(
                left: (m.averageStepLength ?? 0) * 100,
                right: (m.averageStepLength ?? 0) * 100,
                average: (m.averageStepLength ?? 0) * 100
            ),
            strideLength: .init(
                left: (m.strideLength ?? (m.averageStepLength ?? 0) * 2) * 100,
                right: (m.strideLength ?? (m.averageStepLength ?? 0) * 2) * 100,
                average: (m.strideLength ?? (m.averageStepLength ?? 0) * 2) * 100
            ),
            stepWidth: 0,
            walkingSpeed: m.averageWalkingSpeed ?? 1.0,
            cadence: cadence,
            stepTime: .init(left: stepTime ?? 0.6, right: stepTime ?? 0.6, average: stepTime ?? 0.6),
            strideTime: strideTime ?? 1.2
        )

        let asym = AsymmetryAnalysis(
            stepLengthAsymmetry: m.walkingAsymmetry ?? 0,
            stepTimeAsymmetry: 0,
            swingTimeAsymmetry: 0,
            stanceTimeAsymmetry: 0
        )

        let variability = VariabilityAnalysis(
            stepTimeVariability: 0,
            stepLengthVariability: m.stepLengthVariability ?? 0,
            walkingSpeedVariability: m.walkingSpeedVariability ?? 0,
            strideTimeVariability: 0
        )

        let detailed = DetailedGaitAnalysis(
            gaitCycle: gaitCycle,
            balanceMetrics: balance,
            temporalSpatialParameters: temporal,
            asymmetryAnalysis: asym,
            variabilityAnalysis: variability
        )

        // Risk factors
        var factors = buildRiskFactors(metrics: m, posture: posture)
        if let env = environment, env.hazardScore > 25 {
            factors.append(RiskFactor(name: "Environmental Hazard", severity: min(1, Double(env.hazardScore)/100.0), description: "Detected elevated environmental risk", category: .environmental))
        }

        // Compute enriched confidence for assessment risk (blend original with data quality)
        let enrichedConfidence = computeConfidence(base: risk.confidence, sessionDuration: sessionDuration, qualityConfidence: qualityConfidence, floorStd: floorStd, postureAvailable: posture != nil)
        let fallRisk = FallRiskScore(
            score: risk.score,
            confidence: enrichedConfidence,
            factors: factors
        )

        return GaitAssessment(
            metrics: m,
            riskScore: fallRisk,
            recommendations: recommendations(for: risk, factors: factors),
            detailedAnalysis: detailed,
            environmentalFactors: mapEnvironment(environment)
        )
    }

    private static func mapEnvironment(_ env: EnvironmentAnalysisResult?) -> EnvironmentalFactors? {
        guard let env else { return nil }
        let surface: EnvironmentalFactors.SurfaceType = {
            switch env.surfaceAnalysis.type.lowercased() {
            case "level", "concrete", "hard": return .concrete
            case "carpet": return .carpet
            case "grass": return .grass
            default: return .indoor
            }
        }()
        let lighting: EnvironmentalFactors.LightingCondition = {
            switch env.lighting.quality.lowercased() {
            case "dim": return .dim
            case "dark": return .dark
            case "bright": return .bright
            default: return .normal
            }
        }()
        let obstacles: [EnvironmentalFactors.Obstacle] = env.obstacles.map { obs in
            EnvironmentalFactors.Obstacle(type: .other, distance: Double(obs.location.z), height: Double(obs.size.y * 100))
        }
        return EnvironmentalFactors(
            surface: surface,
            lighting: lighting,
            obstacles: obstacles,
            weatherConditions: nil,
            noiseLevel: nil
        )
    }

    private static func computeConfidence(base: Double, sessionDuration: TimeInterval?, qualityConfidence: Double?, floorStd: Double?, postureAvailable: Bool) -> Double {
        var c = base
        if let dur = sessionDuration { c *= min(1, max(0.6, dur / 20.0)) } // prefer >=20s sessions
        if let qc = qualityConfidence { c *= (0.8 + 0.2 * qc) }
        if let fs = floorStd, fs > 0 { c *= max(0.6, min(1.0, 0.02 / fs)) } // penalize unstable floor baseline
        if postureAvailable { c = min(1.0, c * 1.05) }
        return min(1.0, max(0.0, c))
    }

    private static func buildRiskFactors(metrics m: GaitMetrics, posture: PostureAnalysisResult?) -> [RiskFactor] {
        var list: [RiskFactor] = []
        if let speed = m.averageWalkingSpeed, speed < 0.8 {
            list.append(RiskFactor(name: "Low Speed", severity: min(1, (0.8-speed)/0.8), description: "Average walking speed below normative threshold", category: .gaitPattern))
        }
        if let ds = m.doubleSupportTime, ds > 20 {
            list.append(RiskFactor(name: "High Double Support", severity: min(1, (ds-20)/40), description: "Elevated double support percentage", category: .balance))
        }
        if let asym = m.walkingAsymmetry, asym > 5 {
            list.append(RiskFactor(name: "Step Length Asymmetry", severity: min(1, (asym-5)/20), description: "Left/right step length imbalance", category: .gaitPattern))
        }
        if let tc = m.averageToeClearance, tc < 0.015 {
            list.append(RiskFactor(name: "Low Toe Clearance", severity: min(1, (0.015-tc)/0.015), description: "Reduced swing foot clearance", category: .gaitPattern))
        }
        if let varSL = m.stepLengthVariability, varSL > 0.08 {
            list.append(RiskFactor(name: "High Step Length Variability", severity: min(1, (varSL-0.08)/0.12), description: "Irregular step length pattern", category: .gaitPattern))
        }
        if let posture = posture, posture.posturalSway.totalSway > 30 {
            list.append(RiskFactor(name: "Excessive Sway", severity: min(1, (Double(posture.posturalSway.totalSway)-30)/70), description: "Increased postural sway detected", category: .balance))
        }
        return list
    }

    private static func estimateStrideTime(speed: Double?, strideLength: Double?) -> Double? {
        guard let s = speed, let L = strideLength, s > 0 else { return nil }
        return L / s
    }

    private static func recommendations(for risk: GaitRiskAssessment, factors: [RiskFactor]) -> [String] {
        var rec: [String] = []
        switch risk.level {
        case .low: rec.append("Maintain regular walking routine")
        case .moderate: rec.append(contentsOf: ["Balance & strength exercises 2–3x/week", "Monitor gait symmetry trends"])
        case .high: rec.append(contentsOf: ["Clinical gait evaluation advisable", "Target double support reduction via cadence drills"])
        case .critical: rec.append(contentsOf: ["Comprehensive fall risk assessment urgently", "Consider assistive device assessment"])
        }
        if factors.contains(where: { $0.name == "Low Speed" }) { rec.append("Incorporate interval pace training") }
        if factors.contains(where: { $0.name == "High Double Support" }) { rec.append("Practice weight transfer exercises") }
        if factors.contains(where: { $0.name == "Step Length Asymmetry" }) { rec.append("Gait retraining for symmetry (mirror or cueing)") }
        if factors.contains(where: { $0.name == "Excessive Sway" }) { rec.append("Static & dynamic balance drills (narrow stance, foam)") }
        return Array(Set(rec))
    }
}
