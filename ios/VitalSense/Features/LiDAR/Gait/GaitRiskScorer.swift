import Foundation

/// Represents a computed gait risk assessment.
struct GaitRiskAssessment: Codable {
    let score: Double // 0-100
    let level: RiskLevel
    let confidence: Double // 0-1
}

/// Heuristic scorer combining multiple gait features into a 0-100 risk score.
struct GaitRiskScorer {
    struct Inputs {
        let walkingSpeed: Double? // m/s
        let cadence: Double? // spm
        let doubleSupport: Double? // %
        let stepLengthCV: Double? // coefficient of variation
        let speedCV: Double? // coefficient of variation
        let asymmetryStepLength: Double? // %
        let toeClearance: Double? // m (average)
        let stabilityIndex: Double? // 0-100
    }

    func score(_ i: Inputs) -> GaitRiskAssessment {
        var risk: Double = 0
        var evidence: Int = 0

        if let v = i.walkingSpeed { // slower speed => higher risk
            evidence += 1
            if v < 0.6 { risk += 18 } else if v < 0.8 { risk += 12 } else if v < 1.0 { risk += 6 }
        }
        if let c = i.cadence { // very low cadence
            evidence += 1
            if c < 80 { risk += 12 } else if c < 95 { risk += 6 }
        }
        if let ds = i.doubleSupport { // high double support
            evidence += 1
            if ds > 30 { risk += 18 } else if ds > 22 { risk += 12 } else if ds > 18 { risk += 6 }
        }
        if let slcv = i.stepLengthCV { // variability
            evidence += 1
            if slcv > 0.12 { risk += 18 } else if slcv > 0.08 { risk += 12 } else if slcv > 0.05 { risk += 6 }
        }
        if let scv = i.speedCV { // velocity variability
            evidence += 1
            if scv > 0.15 { risk += 12 } else if scv > 0.10 { risk += 8 } else if scv > 0.06 { risk += 4 }
        }
        if let asym = i.asymmetryStepLength { // asymmetry
            evidence += 1
            if asym > 10 { risk += 18 } else if asym > 6 { risk += 12 } else if asym > 3 { risk += 6 }
        }
        if let tc = i.toeClearance { // low toe clearance
            evidence += 1
            if tc < 0.01 { risk += 15 } else if tc < 0.015 { risk += 10 } else if tc < 0.02 { risk += 5 }
        }
        if let stab = i.stabilityIndex { // low stability
            evidence += 1
            if stab < 55 { risk += 15 } else if stab < 70 { risk += 10 } else if stab < 80 { risk += 5 }
        }

        let bounded = min(100, max(0, risk))
        // Confidence: proportion of provided evidence sources * simple penalty if few steps
        let confidence = min(1.0, Double(evidence) / 8.0)

        let level: RiskLevel
        switch bounded {
        case 0..<25: level = .low
        case 25..<50: level = .moderate
        case 50..<75: level = .high
        default: level = .critical
        }
        return GaitRiskAssessment(score: bounded, level: level, confidence: confidence)
    }
}
