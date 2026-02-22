//
//  PostureAnalyzer.swift
//  Andernet Posture
//
//  Clinically-grounded posture analysis using ARKit body tracking.
//  Implements CVA, SVA, kyphosis/lordosis proxies, shoulder/pelvic symmetry,
//  coronal scoliosis screening, Kendall postural type, and NYPR automated subset.
//

import Foundation
import simd

// MARK: - Results

/// Complete per-frame posture analysis results across all tiers.
struct PostureMetrics: Sendable {
    // Tier 1 — Direct computation
    let sagittalTrunkLeanDeg: Double    // forward/backward trunk lean
    let frontalTrunkLeanDeg: Double     // lateral trunk lean (signed)
    let craniovertebralAngleDeg: Double // CVA (higher = better, normal 49–56°)
    let sagittalVerticalAxisCm: Double  // SVA (positive = forward, normal < 5 cm)
    let shoulderAsymmetryCm: Double     // |left - right| height diff
    let shoulderTiltDeg: Double         // shoulder line tilt
    let pelvicObliquityDeg: Double      // hip height asymmetry

    // Tier 2 — Proxy measurements
    let thoracicKyphosisDeg: Double     // 3-point proxy Cobb (normal 20–45°)
    let lumbarLordosisDeg: Double       // 3-point proxy (normal 40–60°)
    let coronalSpineDeviationCm: Double // max lateral deviation of spine
    let posturalType: PosturalType      // Kendall classification

    // Tier 3 — NYPR
    let nyprScore: Int                  // automated NYPR sub-score
    let nyprMaxScore: Int               // max possible automatable score

    // Composite
    let postureScore: Double            // 0–100, literature-grounded weighted

    // Per-parameter severity
    let severities: [String: ClinicalSeverity]

    // Legacy compatibility
    var trunkLeanDeg: Double { sagittalTrunkLeanDeg }
    var lateralLeanDeg: Double { frontalTrunkLeanDeg }
    var headForwardDeg: Double { max(0, 52 - craniovertebralAngleDeg) } // approx deviation from ideal CVA
    var frameScore: Double { postureScore }
}

// MARK: - Protocol

/// Protocol for posture analysis. Enables mock injection for testing.
protocol PostureAnalyzer: AnyObject {
    /// Analyze a set of joint positions and return comprehensive posture metrics.
    func analyze(joints: [JointName: SIMD3<Float>]) -> PostureMetrics?

    /// Compute an overall session posture score from frame-level scores.
    func computeSessionScore(trunkLeans: [Double], lateralLeans: [Double]) -> Double
}

// MARK: - Default Implementation

final class DefaultPostureAnalyzer: PostureAnalyzer {

    // MARK: - Compute Full Posture Analysis

    // swiftlint:disable:next function_body_length
    func analyze(joints: [JointName: SIMD3<Float>]) -> PostureMetrics? {
        guard
            let root = joints[.root],
            let hips = joints[.hips],
            let spine7 = joints[.spine7],
            let neck1 = joints[.neck1],
            let head = joints[.head]
        else { return nil }

        // ── Tier 1 ──

        // Sagittal trunk lean: hips→spine7 in YZ plane
        let trunkVec = spine7 - hips
        let sagittalLean = Double(trunkVec.sagittalAngleFromVerticalDeg())

        // Frontal trunk lean: hips→spine7 in XY plane
        let frontalLean = Double(trunkVec.frontalAngleFromVerticalDeg())

        // CVA: angle from horizontal to the C7→tragus line in the sagittal plane.
        // Higher angle = more upright head. Normal 49–56° (Yip et al., 2008).
        let headVec = head - spine7
        let cvaDeg: Double = {
            let verticalDelta = headVec.y   // up component
            let forwardDelta = headVec.z    // depth (AP) component
            let len = sqrt(verticalDelta * verticalDelta + forwardDelta * forwardDelta)
            guard len > 0.001 else { return 52.0 } // default ideal
            // CVA = atan2(vertical, |horizontal|) — angle from horizontal
            return Double(atan2(verticalDelta, abs(forwardDelta)) * 180 / .pi)
        }()

        // SVA: horizontal offset of C7 relative to S1 (root) in sagittal plane
        let svaCm = Double((spine7.z - root.z) * 100)

        // Shoulder levelness
        let shoulderCm: Double
        let shoulderTilt: Double
        if let ls = joints[.leftShoulder], let rs = joints[.rightShoulder] {
            shoulderCm = Double(abs(ls.y - rs.y) * 100)
            let shoulderVec = rs - ls
            shoulderTilt = Double(atan2(shoulderVec.y, sqrt(shoulderVec.x * shoulderVec.x + shoulderVec.z * shoulderVec.z)) * 180 / .pi)
        } else {
            shoulderCm = 0
            shoulderTilt = 0
        }

        // Pelvic obliquity
        let pelvicDeg: Double
        if let lu = joints[.leftUpLeg], let ru = joints[.rightUpLeg] {
            let pelvisVec = ru - lu
            pelvicDeg = Double(atan2(pelvisVec.y, sqrt(pelvisVec.x * pelvisVec.x + pelvisVec.z * pelvisVec.z)) * 180 / .pi)
        } else {
            pelvicDeg = 0
        }

        // ── Tier 2 ──

        // Thoracic kyphosis: 3-point angle at mid-thoracic between lower and upper thoracic
        let kyphosisDeg: Double
        if let s2 = joints[.spine2], let s5 = joints[.spine5] {
            let rawAngle = Double(threePointAngleDeg(a: s2, vertex: s5, c: spine7))
            kyphosisDeg = 180.0 - rawAngle
        } else {
            kyphosisDeg = 30.0 // default normal
        }

        // Lumbar lordosis: 3-point angle at spine1 between root and spine3
        let lordosisDeg: Double
        if let s1 = joints[.spine1], let s3 = joints[.spine3] {
            let rawAngle = Double(threePointAngleDeg(a: root, vertex: s1, c: s3))
            lordosisDeg = 180.0 - rawAngle
        } else {
            lordosisDeg = 50.0 // default normal
        }

        // Coronal scoliosis proxy: max lateral deviation of spine joints from root→neck1 line
        let spineJoints: [JointName] = [.spine1, .spine2, .spine3, .spine4, .spine5, .spine6, .spine7]
        var maxDeviation: Float = 0
        for j in spineJoints {
            if let pos = joints[j] {
                let dev = pointToLineDistance(pos, lineStart: root, lineEnd: neck1)
                maxDeviation = max(maxDeviation, dev)
            }
        }
        let coronalDevCm = Double(maxDeviation * 100)

        // Pelvic tilt for Kendall classification (from ROM data if available)
        let pelvicTiltForKendall: Double
        if let s1 = joints[.spine1] {
            let pelvisVec = s1 - root
            pelvicTiltForKendall = Double(pelvisVec.sagittalAngleFromVerticalDeg())
        } else {
            pelvicTiltForKendall = 0
        }

        // Kendall postural type classification
        let posturalType = classifyKendall(
            headOffset: Double(head.z - root.z) * 100,
            shoulderOffset: Double(spine7.z - root.z) * 100,
            kyphosis: kyphosisDeg,
            lordosis: lordosisDeg,
            pelvicTiltDeg: pelvicTiltForKendall
        )

        // ── Tier 3: NYPR ──
        let (nypr, nyprMax) = computeNYPR(
            joints: joints, cvaDeg: cvaDeg, kyphosisDeg: kyphosisDeg,
            shoulderCm: shoulderCm, pelvicDeg: pelvicDeg, frontalLean: frontalLean
        )

        // ── Composite Score ──
        let cvaScore = PostureThresholds.subScore(measured: cvaDeg, idealTarget: 52.5, maxDeviation: 25)
        let svaScore = PostureThresholds.subScore(measured: abs(svaCm), idealTarget: 0, maxDeviation: 12)
        let trunkScore = PostureThresholds.subScore(measured: abs(sagittalLean), idealTarget: 0, maxDeviation: 25)
        let lateralScore = PostureThresholds.subScore(measured: abs(frontalLean), idealTarget: 0, maxDeviation: 15)
        let shoulderScore = PostureThresholds.subScore(measured: shoulderCm, idealTarget: 0, maxDeviation: 6)
        let kyphosisScore = PostureThresholds.subScore(measured: kyphosisDeg, idealTarget: 32.5, maxDeviation: 40)
        let pelvicScore = PostureThresholds.subScore(measured: abs(pelvicDeg), idealTarget: 0, maxDeviation: 8)

        // Lordosis sub-score
        let lordosisScore = PostureThresholds.subScore(measured: lordosisDeg, idealTarget: 50.0, maxDeviation: 35)
        // Coronal scoliosis sub-score
        let coronalScore = PostureThresholds.subScore(measured: coronalDevCm, idealTarget: 0, maxDeviation: 6)

        let composite =
            cvaScore * PostureThresholds.compositeCVAWeight +
            svaScore * PostureThresholds.compositeSVAWeight +
            trunkScore * PostureThresholds.compositeTrunkWeight +
            lateralScore * PostureThresholds.compositeLateralWeight +
            shoulderScore * PostureThresholds.compositeShoulderWeight +
            kyphosisScore * PostureThresholds.compositeKyphosisWeight +
            pelvicScore * PostureThresholds.compositePelvicWeight +
            lordosisScore * PostureThresholds.compositeLordosisWeight +
            coronalScore * PostureThresholds.compositeCoronalWeight

        // Severities
        let severities: [String: ClinicalSeverity] = [
            "cva": PostureThresholds.cvaSeverity(cvaDeg),
            "sva": PostureThresholds.svaSeverity(svaCm),
            "trunkForward": PostureThresholds.trunkForwardSeverity(sagittalLean),
            "lateralLean": PostureThresholds.lateralLeanSeverity(frontalLean),
            "shoulder": PostureThresholds.shoulderSeverity(cm: shoulderCm),
            "pelvic": PostureThresholds.pelvicSeverity(pelvicDeg),
            "kyphosis": PostureThresholds.kyphosisSeverity(kyphosisDeg),
            "lordosis": PostureThresholds.lordosisSeverity(lordosisDeg),
            "scoliosis": PostureThresholds.scoliosisSeverity(cm: coronalDevCm)
        ]

        return PostureMetrics(
            sagittalTrunkLeanDeg: sagittalLean,
            frontalTrunkLeanDeg: frontalLean,
            craniovertebralAngleDeg: cvaDeg,
            sagittalVerticalAxisCm: svaCm,
            shoulderAsymmetryCm: shoulderCm,
            shoulderTiltDeg: shoulderTilt,
            pelvicObliquityDeg: pelvicDeg,
            thoracicKyphosisDeg: kyphosisDeg,
            lumbarLordosisDeg: lordosisDeg,
            coronalSpineDeviationCm: coronalDevCm,
            posturalType: posturalType,
            nyprScore: nypr,
            nyprMaxScore: nyprMax,
            postureScore: min(100, max(0, composite)),
            severities: severities
        )
    }

    // MARK: - Session Score

    func computeSessionScore(trunkLeans: [Double], lateralLeans: [Double]) -> Double {
        guard !trunkLeans.isEmpty else { return 0 }
        let avgTrunk = trunkLeans.reduce(0, +) / Double(trunkLeans.count)
        let avgLateral = lateralLeans.isEmpty ? 0 : lateralLeans.reduce(0, +) / Double(lateralLeans.count)
        let trunkScore = PostureThresholds.subScore(measured: abs(avgTrunk), idealTarget: 0, maxDeviation: 25)
        let lateralScore = PostureThresholds.subScore(measured: abs(avgLateral), idealTarget: 0, maxDeviation: 15)
        return min(100, max(0, trunkScore * 0.6 + lateralScore * 0.4))
    }

    // MARK: - Kendall Classification

    private func classifyKendall(headOffset: Double, shoulderOffset: Double, kyphosis: Double, lordosis: Double, pelvicTiltDeg: Double = 0) -> PosturalType {
        let forwardHead = headOffset > 3       // head anterior to root
        let forwardShoulder = shoulderOffset > 2 // shoulders forward
        let highKyphosis = kyphosis > 45
        let highLordosis = lordosis > 55
        let lowLordosis = lordosis < 35
        let posteriorPelvicTilt = pelvicTiltDeg < -5  // posterior tilt

        if forwardHead && forwardShoulder && highKyphosis && highLordosis {
            return .kyphosisLordosis
        }
        if lowLordosis && !highKyphosis {
            return .flatBack
        }
        // Sway-back: posterior pelvic tilt with forward head, flattened lordosis
        // Ref: Kendall FP et al., Muscles: Testing and Function, 2005
        if forwardHead && (posteriorPelvicTilt || lowLordosis) && !forwardShoulder {
            return .swayBack
        }
        return .ideal
    }

    // MARK: - NYPR Automated Scoring

    // swiftlint:disable:next cyclomatic_complexity
    private func computeNYPR(
        joints: [JointName: SIMD3<Float>],
        cvaDeg: Double,
        kyphosisDeg: Double,
        shoulderCm: Double,
        pelvicDeg: Double,
        frontalLean: Double
    ) -> (score: Int, maxScore: Int) {
        var score = 0

        // 1. Head tilt (lateral) — deviation of head from midline in frontal plane
        if let head = joints[.head], let neck1 = joints[.neck1] {
            let headTilt = abs(Float(atan2(head.x - neck1.x, head.y - neck1.y)) * 180 / .pi)
            if headTilt < 3 { score += 5 } else if headTilt < 8 { score += 3 } else { score += 1 }
        }

        // 2. Shoulder level
        if shoulderCm < 1.5 { score += 5 } else if shoulderCm < 3 { score += 3 } else { score += 1 }

        // 3. Cervical alignment (CVA proxy)
        if cvaDeg >= 49 { score += 5 } else if cvaDeg >= 40 { score += 3 } else { score += 1 }

        // 4. Thoracic kyphosis
        if PostureThresholds.kyphosisNormal.contains(kyphosisDeg) { score += 5 } else if kyphosisDeg <= 55 { score += 3 } else { score += 1 }

        // 5. Trunk alignment (lateral lean)
        if abs(frontalLean) < 2 { score += 5 } else if abs(frontalLean) < 5 { score += 3 } else { score += 1 }

        // 6. Shoulder protraction
        if let ls = joints[.leftShoulder], let rs = joints[.rightShoulder], let s7 = joints[.spine7] {
            let avgShoulderZ = (ls.z + rs.z) / 2
            let protractionCm = Double((avgShoulderZ - s7.z) * 100)
            if abs(protractionCm) < 2 { score += 5 } else if abs(protractionCm) < 4 { score += 3 } else { score += 1 }
        }

        // 7. Hip level (pelvic obliquity)
        if abs(pelvicDeg) < 1 { score += 5 } else if abs(pelvicDeg) < 3 { score += 3 } else { score += 1 }

        // 8. Knee alignment (valgus/varus proxy)
        if let lk = joints[.leftLeg], let rk = joints[.rightLeg],
           let la = joints[.leftFoot], let ra = joints[.rightFoot] {
            let leftKneeAngle = abs(threePointAngleDeg(a: joints[.leftUpLeg] ?? lk, vertex: lk, c: la) - 180)
            let rightKneeAngle = abs(threePointAngleDeg(a: joints[.rightUpLeg] ?? rk, vertex: rk, c: ra) - 180)
            let maxKneeDeviation = Double(max(leftKneeAngle, rightKneeAngle))
            if maxKneeDeviation < 5 { score += 5 } else if maxKneeDeviation < 10 { score += 3 } else { score += 1 }
        }

        // 9. Head rotation
        if let neck3 = joints[.neck3], let neck1 = joints[.neck1], let head = joints[.head] {
            let neckLine = neck1 - neck3
            let headLine = head - neck1
            let rotAngle = abs(signedAngle2D(SIMD2(neckLine.x, neckLine.z), SIMD2(headLine.x, headLine.z)))
            if rotAngle < 5 { score += 5 } else if rotAngle < 10 { score += 3 } else { score += 1 }
        }

        return (score, NYPRItem.maxAutomatableScore)
    }
}
