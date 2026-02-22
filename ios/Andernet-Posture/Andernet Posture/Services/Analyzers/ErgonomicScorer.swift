//
//  ErgonomicScorer.swift
//  Andernet Posture
//
//  REBA (Rapid Entire Body Assessment) scoring from ARKit joint positions.
//  Scores trunk, neck, legs, upper arms, forearms, and wrists to produce
//  a composite ergonomic risk score (1–15).
//
//  Reference:
//  - Hignett S & McAtamney L, Applied Ergonomics, 2000 (REBA method)
//

import Foundation
import simd

// MARK: - Results

/// REBA assessment result.
struct REBAResult: Sendable {
    /// Overall REBA score (1–15).
    let score: Int
    /// Risk level classification.
    let riskLevel: REBARiskLevel
    /// Action recommendation text.
    let action: String

    // Component scores
    let trunkScore: Int
    let neckScore: Int
    let legScore: Int
    let upperArmScore: Int
    let lowerArmScore: Int
    let wristScore: Int
}

// MARK: - Protocol

protocol ErgonomicScorer: AnyObject {
    /// Compute REBA score from joint positions.
    func computeREBA(joints: [JointName: SIMD3<Float>]) -> REBAResult
}

// MARK: - Default Implementation

final class DefaultErgonomicScorer: ErgonomicScorer {

    func computeREBA(joints: [JointName: SIMD3<Float>]) -> REBAResult {
        let trunk = scoreTrunk(joints: joints)
        let neck = scoreNeck(joints: joints)
        let legs = scoreLegs(joints: joints)
        let upperArm = scoreUpperArms(joints: joints)
        let lowerArm = scoreLowerArms(joints: joints)
        let wrist = scoreWrists(joints: joints)

        // REBA Table A: Trunk × Neck × Legs
        let tableA = lookupTableA(trunk: trunk, neck: neck, legs: legs)

        // Force/load score (from body tracking, assume no external load = 0)
        let forceLoad = 0
        let scoreA = tableA + forceLoad

        // REBA Table B: Upper Arm × Lower Arm × Wrist
        let tableB = lookupTableB(upperArm: upperArm, lowerArm: lowerArm, wrist: wrist)

        // Coupling score (no grip info from ARKit = 0)
        let coupling = 0
        let scoreB = tableB + coupling

        // REBA Table C: Score A × Score B
        let tableC = lookupTableC(scoreA: scoreA, scoreB: scoreB)

        // Activity score (assume sustained posture = +1)
        let activity = 1
        let rebaScore = min(15, max(1, tableC + activity))

        let riskLevel: REBARiskLevel
        let action: String
        switch rebaScore {
        case 1:
            riskLevel = .negligible
            action = "No action required"
        case 2...3:
            riskLevel = .low
            action = "May need change"
        case 4...7:
            riskLevel = .medium
            action = "Investigation needed; implement changes"
        case 8...10:
            riskLevel = .high
            action = "Investigation and changes needed soon"
        default:
            riskLevel = .veryHigh
            action = "Immediate investigation and changes required"
        }

        return REBAResult(
            score: rebaScore,
            riskLevel: riskLevel,
            action: action,
            trunkScore: trunk,
            neckScore: neck,
            legScore: legs,
            upperArmScore: upperArm,
            lowerArmScore: lowerArm,
            wristScore: wrist
        )
    }

    // MARK: - Component Scoring

    /// Trunk score (1–5). Based on sagittal flexion/extension.
    private func scoreTrunk(joints: [JointName: SIMD3<Float>]) -> Int {
        guard let hips = joints[.hips], let spine7 = joints[.spine7] else { return 1 }
        let trunkVec = spine7 - hips
        let angle = abs(trunkVec.sagittalAngleFromVerticalDeg())

        var score: Int
        if angle < 5 { score = 1 }           // upright
        else if angle <= 20 { score = 2 }     // slight flexion
        else if angle <= 60 { score = 3 }     // moderate flexion
        else { score = 4 }                     // severe flexion

        // Side-bending adjustment
        let lateralAngle = abs(trunkVec.frontalAngleFromVerticalDeg())
        if lateralAngle > 10 { score += 1 }

        return min(5, score)
    }

    /// Neck score (1–3). Based on neck flexion/extension.
    private func scoreNeck(joints: [JointName: SIMD3<Float>]) -> Int {
        guard let spine7 = joints[.spine7], let head = joints[.head] else { return 1 }
        let neckVec = head - spine7
        let angle = neckVec.sagittalAngleFromVerticalDeg()

        var score: Int
        if angle >= 0 && angle <= 20 { score = 1 }     // 0-20° flexion
        else { score = 2 }                               // >20° flexion or extension

        // Side-bending or rotation adjustment
        let lateralAngle = abs(neckVec.frontalAngleFromVerticalDeg())
        if lateralAngle > 10 { score += 1 }

        return min(3, score)
    }

    /// Legs score (1–4). Based on knee flexion and bilateral stance.
    private func scoreLegs(joints: [JointName: SIMD3<Float>]) -> Int {
        guard let lk = joints[.leftLeg], let rk = joints[.rightLeg],
              let lh = joints[.leftUpLeg], let rh = joints[.rightUpLeg],
              let la = joints[.leftFoot], let ra = joints[.rightFoot] else { return 1 }

        // Bilateral support (both feet on ground) → base = 1; unilateral → base = 2
        let footHeightDiff = abs(la.y - ra.y)
        var score = footHeightDiff > 0.1 ? 2 : 1

        // Knee flexion
        let leftKnee = 180.0 - Double(threePointAngleDeg(a: lh, vertex: lk, c: la))
        let rightKnee = 180.0 - Double(threePointAngleDeg(a: rh, vertex: rk, c: ra))
        let maxKnee = max(leftKnee, rightKnee)

        if maxKnee > 60 { score += 2 } else if maxKnee > 30 { score += 1 }

        return min(4, score)
    }

    /// Upper arm score (1–6). Based on shoulder flexion/abduction.
    private func scoreUpperArms(joints: [JointName: SIMD3<Float>]) -> Int {
        let leftScore = scoreUpperArm(
            shoulder: joints[.leftShoulder], elbow: joints[.leftArm], trunk: joints[.spine7]
        )
        let rightScore = scoreUpperArm(
            shoulder: joints[.rightShoulder], elbow: joints[.rightArm], trunk: joints[.spine7]
        )
        return max(leftScore, rightScore) // Use worst case
    }

    private func scoreUpperArm(shoulder: SIMD3<Float>?, elbow: SIMD3<Float>?, trunk: SIMD3<Float>?) -> Int {
        guard let shoulder = shoulder, let elbow = elbow else { return 1 }
        let armVec = elbow - shoulder
        let angle = abs(armVec.sagittalAngleFromVerticalDeg())

        var score: Int
        if angle <= 20 { score = 1 } else if angle <= 45 { score = 2 } else if angle <= 90 { score = 3 } else { score = 4 }

        // Shoulder raised
        if let trunk = trunk {
            let shoulderHeight = shoulder.y - trunk.y
            if shoulderHeight > 0.05 { score += 1 }
        }

        // Abduction
        let abduction = abs(armVec.frontalAngleFromVerticalDeg())
        if abduction > 30 { score += 1 }

        return min(6, score)
    }

    /// Lower arm score (1–2). Based on elbow flexion.
    private func scoreLowerArms(joints: [JointName: SIMD3<Float>]) -> Int {
        let left = scoreLowerArm(
            shoulder: joints[.leftArm], elbow: joints[.leftForearm], wrist: joints[.leftHand]
        )
        let right = scoreLowerArm(
            shoulder: joints[.rightArm], elbow: joints[.rightForearm], wrist: joints[.rightHand]
        )
        return max(left, right)
    }

    private func scoreLowerArm(shoulder: SIMD3<Float>?, elbow: SIMD3<Float>?, wrist: SIMD3<Float>?) -> Int {
        guard let shoulder = shoulder, let elbow = elbow, let wrist = wrist else { return 1 }
        let angle = Double(threePointAngleDeg(a: shoulder, vertex: elbow, c: wrist))
        let flexion = 180.0 - angle
        return (flexion >= 60 && flexion <= 100) ? 1 : 2
    }

    /// Wrist score (1–3). Based on wrist deviation.
    private func scoreWrists(joints: [JointName: SIMD3<Float>]) -> Int {
        // Limited wrist data from ARKit — use forearm-hand angle as proxy
        let left = scoreWrist(forearm: joints[.leftForearm], hand: joints[.leftHand])
        let right = scoreWrist(forearm: joints[.rightForearm], hand: joints[.rightHand])
        return max(left, right)
    }

    private func scoreWrist(forearm: SIMD3<Float>?, hand: SIMD3<Float>?) -> Int {
        guard let forearm = forearm, let hand = hand else { return 1 }
        let wristVec = hand - forearm
        let deviation = abs(wristVec.frontalAngleFromVerticalDeg())
        if deviation < 15 { return 1 }
        return 2
    }

    // MARK: - REBA Lookup Tables (Hignett & McAtamney, 2000)

    /// Table A: Trunk (1-5) × Neck (1-3) × Legs (1-4)
    private func lookupTableA(trunk: Int, neck: Int, legs: Int) -> Int {
        let t = min(5, max(1, trunk)) - 1
        let n = min(3, max(1, neck)) - 1
        let l = min(4, max(1, legs)) - 1

        // Table A from REBA paper [trunk][neck][legs]
        let table: [[[Int]]] = [
            // trunk = 1
            [[1, 2, 3, 4], [1, 2, 3, 4], [3, 3, 5, 6]],
            // trunk = 2
            [[2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
            // trunk = 3
            [[2, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 8]],
            // trunk = 4
            [[3, 5, 6, 7], [5, 6, 7, 8], [6, 7, 8, 9]],
            // trunk = 5
            [[4, 6, 7, 8], [6, 7, 8, 9], [7, 8, 9, 9]]
        ]
        return table[t][n][l]
    }

    /// Table B: Upper Arm (1-6) × Lower Arm (1-2) × Wrist (1-3)
    private func lookupTableB(upperArm: Int, lowerArm: Int, wrist: Int) -> Int {
        let u = min(6, max(1, upperArm)) - 1
        let la = min(2, max(1, lowerArm)) - 1
        let w = min(3, max(1, wrist)) - 1

        // Table B from REBA paper [upperArm][lowerArm][wrist]
        let table: [[[Int]]] = [
            // upperArm = 1
            [[1, 2, 2], [1, 2, 3]],
            // upperArm = 2
            [[1, 2, 3], [2, 3, 4]],
            // upperArm = 3
            [[3, 4, 5], [4, 5, 5]],
            // upperArm = 4
            [[4, 5, 5], [5, 6, 7]],
            // upperArm = 5
            [[6, 7, 8], [7, 8, 8]],
            // upperArm = 6
            [[7, 8, 8], [8, 9, 9]]
        ]
        return table[u][la][w]
    }

    /// Table C: Score A (1-12) × Score B (1-12)
    private func lookupTableC(scoreA: Int, scoreB: Int) -> Int {
        let a = min(12, max(1, scoreA)) - 1
        let b = min(12, max(1, scoreB)) - 1

        // Table C from REBA paper [scoreA][scoreB]
        let table: [[Int]] = [
            [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],   // A=1
            [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],   // A=2
            [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],   // A=3
            [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],   // A=4
            [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 10],   // A=5
            [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],   // A=6
            [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],   // A=7
            [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],   // A=8
            [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],   // A=9
            [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],  // A=10
            [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],  // A=11
            [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]  // A=12
        ]
        return table[a][b]
    }
}
