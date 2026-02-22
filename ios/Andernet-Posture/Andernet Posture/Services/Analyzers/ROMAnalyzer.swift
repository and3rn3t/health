//
//  ROMAnalyzer.swift
//  Andernet Posture
//
//  Per-frame joint range-of-motion extraction during gait.
//  Computes hip flexion/extension, knee flexion, pelvic tilt,
//  trunk rotation, and arm swing for bilateral comparison.
//
//  Reference:
//  - Perry J & Burnfield JM, Gait Analysis: Normal and Pathological Function, 2010
//  - Neumann DA, Kinesiology of the Musculoskeletal System, 2010
//

import Foundation
import simd

// MARK: - Results

/// Per-frame ROM measurements for all tracked joints.
struct ROMMetrics: Sendable {
    // Hip (sagittal plane flexion, degrees)
    let hipFlexionLeftDeg: Double
    let hipFlexionRightDeg: Double

    // Knee (sagittal plane flexion, degrees)
    let kneeFlexionLeftDeg: Double
    let kneeFlexionRightDeg: Double

    // Pelvic tilt (sagittal, degrees — positive = anterior)
    let pelvicTiltDeg: Double

    // Trunk rotation (transverse plane, degrees)
    let trunkRotationDeg: Double

    // Arm swing arc (sagittal, degrees)
    let armSwingLeftDeg: Double
    let armSwingRightDeg: Double

    // Bilateral asymmetry flags
    var hipAsymmetryDeg: Double { abs(hipFlexionLeftDeg - hipFlexionRightDeg) }
    var kneeAsymmetryDeg: Double { abs(kneeFlexionLeftDeg - kneeFlexionRightDeg) }
    var armSwingAsymmetryDeg: Double { abs(armSwingLeftDeg - armSwingRightDeg) }

    /// True if any bilateral asymmetry exceeds Perry & Burnfield's 5° threshold.
    var hasSignificantAsymmetry: Bool {
        hipAsymmetryDeg > GaitROMLimits.romAsymmetryThreshold ||
        kneeAsymmetryDeg > GaitROMLimits.romAsymmetryThreshold ||
        armSwingAsymmetryDeg > GaitROMLimits.romAsymmetryThreshold
    }
}

/// Session-level ROM summary with ranges.
struct ROMSessionSummary: Sendable {
    let hipROMLeftDeg: Double    // max flex - max ext
    let hipROMRightDeg: Double
    let kneeROMLeftDeg: Double
    let kneeROMRightDeg: Double
    let trunkRotationRangeDeg: Double
    let pelvicTiltRangeDeg: Double
    let armSwingLeftRangeDeg: Double
    let armSwingRightRangeDeg: Double
    let armSwingAsymmetryPercent: Double
}

// MARK: - Protocol

protocol ROMAnalyzer: AnyObject {
    /// Compute per-frame ROM from joint positions.
    func analyze(joints: [JointName: SIMD3<Float>]) -> ROMMetrics

    /// Accumulate frame data for session summary.
    func recordFrame(_ metrics: ROMMetrics)

    /// Compute session-level ROM summary.
    func sessionSummary() -> ROMSessionSummary

    /// Reset state.
    func reset()
}

// MARK: - Default Implementation

final class DefaultROMAnalyzer: ROMAnalyzer {

    // MARK: Session accumulators

    /// Maximum history size (~10 minutes at 20fps recording every 3rd frame).
    private let maxHistory = 12_000

    private var hipFlexLeftHistory: [Double] = []
    private var hipFlexRightHistory: [Double] = []
    private var kneeFlexLeftHistory: [Double] = []
    private var kneeFlexRightHistory: [Double] = []
    private var trunkRotHistory: [Double] = []
    private var pelvicTiltHistory: [Double] = []
    private var armSwingLeftHistory: [Double] = []
    private var armSwingRightHistory: [Double] = []

    // MARK: - Per-Frame Analysis

    func analyze(joints: [JointName: SIMD3<Float>]) -> ROMMetrics {
        // Hip flexion: angle at hip joint between trunk (spine1→hip) and thigh (hip→knee)
        let hipFlexL = computeHipFlexion(
            spine: joints[.spine1], hip: joints[.leftUpLeg], knee: joints[.leftLeg]
        )
        let hipFlexR = computeHipFlexion(
            spine: joints[.spine1], hip: joints[.rightUpLeg], knee: joints[.rightLeg]
        )

        // Knee flexion: angle at knee between thigh (hip→knee) and shank (knee→ankle)
        let kneeFlexL = computeKneeFlexion(
            hip: joints[.leftUpLeg], knee: joints[.leftLeg], ankle: joints[.leftFoot]
        )
        let kneeFlexR = computeKneeFlexion(
            hip: joints[.rightUpLeg], knee: joints[.rightLeg], ankle: joints[.rightFoot]
        )

        // Pelvic tilt (sagittal plane): angle of pelvis from horizontal
        let pelvicTilt = computePelvicTilt(
            root: joints[.root], hips: joints[.hips], spine1: joints[.spine1]
        )

        // Trunk rotation (transverse plane)
        let trunkRot = computeTrunkRotation(
            leftShoulder: joints[.leftShoulder], rightShoulder: joints[.rightShoulder],
            leftHip: joints[.leftUpLeg], rightHip: joints[.rightUpLeg]
        )

        // Arm swing (sagittal plane arc of upper arm)
        let armSwingL = computeArmSwing(
            shoulder: joints[.leftShoulder], elbow: joints[.leftArm], trunk: joints[.spine7]
        )
        let armSwingR = computeArmSwing(
            shoulder: joints[.rightShoulder], elbow: joints[.rightArm], trunk: joints[.spine7]
        )

        return ROMMetrics(
            hipFlexionLeftDeg: hipFlexL,
            hipFlexionRightDeg: hipFlexR,
            kneeFlexionLeftDeg: kneeFlexL,
            kneeFlexionRightDeg: kneeFlexR,
            pelvicTiltDeg: pelvicTilt,
            trunkRotationDeg: trunkRot,
            armSwingLeftDeg: armSwingL,
            armSwingRightDeg: armSwingR
        )
    }

    func recordFrame(_ metrics: ROMMetrics) {
        hipFlexLeftHistory.append(metrics.hipFlexionLeftDeg)
        hipFlexRightHistory.append(metrics.hipFlexionRightDeg)
        kneeFlexLeftHistory.append(metrics.kneeFlexionLeftDeg)
        kneeFlexRightHistory.append(metrics.kneeFlexionRightDeg)
        trunkRotHistory.append(metrics.trunkRotationDeg)
        pelvicTiltHistory.append(metrics.pelvicTiltDeg)
        armSwingLeftHistory.append(metrics.armSwingLeftDeg)
        armSwingRightHistory.append(metrics.armSwingRightDeg)

        // Cap all histories to prevent unbounded memory growth
        if hipFlexLeftHistory.count > maxHistory {
            let drop = hipFlexLeftHistory.count - maxHistory
            hipFlexLeftHistory.removeFirst(drop)
            hipFlexRightHistory.removeFirst(drop)
            kneeFlexLeftHistory.removeFirst(drop)
            kneeFlexRightHistory.removeFirst(drop)
            trunkRotHistory.removeFirst(drop)
            pelvicTiltHistory.removeFirst(drop)
            armSwingLeftHistory.removeFirst(drop)
            armSwingRightHistory.removeFirst(drop)
        }
    }

    func sessionSummary() -> ROMSessionSummary {
        let hipROMLeft = range(of: hipFlexLeftHistory)
        let hipROMRight = range(of: hipFlexRightHistory)
        let kneeROMLeft = range(of: kneeFlexLeftHistory)
        let kneeROMRight = range(of: kneeFlexRightHistory)
        let trunkRotRange = range(of: trunkRotHistory)
        let pelvicTiltRange = range(of: pelvicTiltHistory)
        let armSwingLeftRange = range(of: armSwingLeftHistory)
        let armSwingRightRange = range(of: armSwingRightHistory)

        // Arm swing asymmetry: |L - R| / (0.5*(L+R)) * 100
        let avgArmL = armSwingLeftRange
        let avgArmR = armSwingRightRange
        let meanArm = 0.5 * (avgArmL + avgArmR)
        let armAsymmetry = meanArm > 0.1 ? abs(avgArmL - avgArmR) / meanArm * 100 : 0

        return ROMSessionSummary(
            hipROMLeftDeg: hipROMLeft,
            hipROMRightDeg: hipROMRight,
            kneeROMLeftDeg: kneeROMLeft,
            kneeROMRightDeg: kneeROMRight,
            trunkRotationRangeDeg: trunkRotRange,
            pelvicTiltRangeDeg: pelvicTiltRange,
            armSwingLeftRangeDeg: armSwingLeftRange,
            armSwingRightRangeDeg: armSwingRightRange,
            armSwingAsymmetryPercent: armAsymmetry
        )
    }

    func reset() {
        hipFlexLeftHistory.removeAll()
        hipFlexRightHistory.removeAll()
        kneeFlexLeftHistory.removeAll()
        kneeFlexRightHistory.removeAll()
        trunkRotHistory.removeAll()
        pelvicTiltHistory.removeAll()
        armSwingLeftHistory.removeAll()
        armSwingRightHistory.removeAll()
    }

    // MARK: - Private Computations

    /// Hip flexion: sagittal-plane angle between trunk vector and thigh vector.
    /// Positive = flexion, negative = extension.
    private func computeHipFlexion(spine: SIMD3<Float>?, hip: SIMD3<Float>?, knee: SIMD3<Float>?) -> Double {
        guard let spine = spine, let hip = hip, let knee = knee else { return 0 }
        let trunkVec = spine - hip
        let thighVec = knee - hip
        // Project to sagittal plane (YZ)
        let trunkSag = SIMD2<Float>(trunkVec.z, trunkVec.y)
        let thighSag = SIMD2<Float>(thighVec.z, thighVec.y)
        return Double(signedAngle2D(trunkSag, thighSag))
    }

    /// Knee flexion: angle at knee joint. 0° = fully extended, positive = flexed.
    private func computeKneeFlexion(hip: SIMD3<Float>?, knee: SIMD3<Float>?, ankle: SIMD3<Float>?) -> Double {
        guard let hip = hip, let knee = knee, let ankle = ankle else { return 0 }
        let angle = Double(threePointAngleDeg(a: hip, vertex: knee, c: ankle))
        return 180.0 - angle  // Convert supplement to flexion angle
    }

    /// Pelvic tilt in sagittal plane. Positive = anterior tilt.
    private func computePelvicTilt(root: SIMD3<Float>?, hips: SIMD3<Float>?, spine1: SIMD3<Float>?) -> Double {
        guard let root = root, let spine1 = spine1 else { return 0 }
        let pelvisVec = spine1 - root
        // Sagittal-plane angle from vertical
        return Double(pelvisVec.sagittalAngleFromVerticalDeg())
    }

    /// Trunk rotation in transverse plane (angle between shoulder line and pelvis line).
    private func computeTrunkRotation(
        leftShoulder: SIMD3<Float>?, rightShoulder: SIMD3<Float>?,
        leftHip: SIMD3<Float>?, rightHip: SIMD3<Float>?
    ) -> Double {
        guard let ls = leftShoulder, let rs = rightShoulder,
              let lh = leftHip, let rh = rightHip else { return 0 }
        let shoulderLine = SIMD2<Float>(rs.x - ls.x, rs.z - ls.z)
        let pelvisLine = SIMD2<Float>(rh.x - lh.x, rh.z - lh.z)
        return Double(signedAngle2D(shoulderLine, pelvisLine))
    }

    /// Arm swing: sagittal-plane angle of upper arm relative to trunk vertical.
    private func computeArmSwing(shoulder: SIMD3<Float>?, elbow: SIMD3<Float>?, trunk: SIMD3<Float>?) -> Double {
        guard let shoulder = shoulder, let elbow = elbow else { return 0 }
        let armVec = elbow - shoulder
        return Double(armVec.sagittalAngleFromVerticalDeg())
    }

    /// Compute range (max - min) of a value history.
    private func range(of values: [Double]) -> Double {
        guard let minV = values.min(), let maxV = values.max() else { return 0 }
        return maxV - minV
    }
}
