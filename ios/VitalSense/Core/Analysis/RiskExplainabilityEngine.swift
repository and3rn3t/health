import Foundation

/// Heuristic explainability engine deriving coarse contributing factors to current gait risk.
/// Produces up to N top factors with normalized 0-1 severities.
struct RiskExplainabilityEngine {
    struct Factor: Equatable { let code: String; let score: Double }

    static func evaluate(metrics: GaitMetrics?, stabilityIndex: Double?, risk: GaitRiskAssessment?, limit: Int = 3) -> [Factor] {
        guard let m = metrics else { return [] }
        var factors: [Factor] = []

        // Low walking speed
        if let s = m.averageWalkingSpeed, s < 1.0 {
            let base = max(0, (1.0 - s) / 1.0) // 1.0 ->0, 0 ->1
            let boosted = s < 0.6 ? min(1.0, base * 1.25 + 0.1) : base
            if boosted > 0.05 { factors.append(.init(code: "low_speed", score: round(boosted*1000)/1000)) }
        }
        // High double support
        if let ds = m.doubleSupportTime, ds > 15 {
            let sev = min(1.0, (ds - 15.0) / 20.0) // 35% ~1.0
            if sev > 0.05 { factors.append(.init(code: "high_double_support", score: round(sev*1000)/1000)) }
        }
        // Step length variability
        if let slcv = m.stepLengthVariability, slcv > 0.05 {
            let sev = min(1.0, (slcv - 0.05) / 0.10) // 0.15 ->1
            if sev > 0.05 { factors.append(.init(code: "high_step_length_variability", score: round(sev*1000)/1000)) }
        }
        // Speed variability
        if let scv = m.walkingSpeedVariability, scv > 0.06 {
            let sev = min(1.0, (scv - 0.06) / 0.12) // 0.18 ->1
            if sev > 0.05 { factors.append(.init(code: "high_speed_variability", score: round(sev*1000)/1000)) }
        }
        // Asymmetry
        if let asym = m.walkingAsymmetry, asym > 3 {
            let sev = min(1.0, (asym - 3.0) / 9.0) // 12% ->1
            if sev > 0.05 { factors.append(.init(code: "asymmetry_step_length", score: round(sev*1000)/1000)) }
        }
        // Low toe clearance
        if let tc = m.averageToeClearance, tc < 0.02 {
            let sev = min(1.0, (0.02 - tc) / 0.02) // 0 ->1
            if sev > 0.05 { factors.append(.init(code: "low_toe_clearance", score: round(sev*1000)/1000)) }
        }
        // Low stability index
        if let si = stabilityIndex, si < 70 {
            let sev = min(1.0, (70.0 - si) / 30.0) // 40 ->1
            if sev > 0.05 { factors.append(.init(code: "low_stability", score: round(sev*1000)/1000)) }
        }
        // High near-trip event accumulation
        if let nt = m.nearTripEvents, nt >= 2 {
            let sev = min(1.0, Double(nt) / 10.0) // 10 events ->1
            if sev > 0.05 { factors.append(.init(code: "near_trip_events", score: round(sev*1000)/1000)) }
        }
        // Sort by score desc then code
        factors.sort { ($0.score, $0.code) > ($1.score, $1.code) }
        if factors.count > limit { return Array(factors.prefix(limit)) }
        return factors
    }
}
