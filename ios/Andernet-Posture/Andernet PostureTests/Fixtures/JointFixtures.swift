//
//  JointFixtures.swift
//  Andernet PostureTests
//
//  Shared joint position factories for unit tests.
//  Consolidates uprightJoints(), makeIdealJoints(), stubJoints()
//  that were previously duplicated across test files.
//

import simd
@testable import Andernet_Posture

// MARK: - JointFixtures

/// Centralized joint position factories for testing.
enum JointFixtures {

    // MARK: - Upright / Ideal

    /// Full 22-joint upright standing skeleton with anatomically plausible positions.
    /// Suitable for posture, balance, and ergonomic analyzer tests.
    static func upright() -> [JointName: SIMD3<Float>] {
        [
            .root:           SIMD3<Float>(0, 0.95, 0),
            .hips:           SIMD3<Float>(0, 0.95, 0),
            .spine1:         SIMD3<Float>(0, 1.00, 0),
            .spine2:         SIMD3<Float>(0, 1.05, 0),
            .spine3:         SIMD3<Float>(0, 1.10, 0),
            .spine4:         SIMD3<Float>(0, 1.15, 0),
            .spine5:         SIMD3<Float>(0, 1.20, 0),
            .spine6:         SIMD3<Float>(0, 1.25, 0),
            .spine7:         SIMD3<Float>(0, 1.30, 0),
            .neck1:          SIMD3<Float>(0, 1.35, 0),
            .head:           SIMD3<Float>(0, 1.55, 0),
            .leftShoulder:   SIMD3<Float>(-0.10, 1.30, 0),
            .leftArm:        SIMD3<Float>(-0.20, 1.30, 0),
            .leftForearm:    SIMD3<Float>(-0.20, 1.05, 0),
            .leftHand:       SIMD3<Float>(-0.20, 0.80, 0),
            .rightShoulder:  SIMD3<Float>( 0.10, 1.30, 0),
            .rightArm:       SIMD3<Float>( 0.20, 1.30, 0),
            .rightForearm:   SIMD3<Float>( 0.20, 1.05, 0),
            .rightHand:      SIMD3<Float>( 0.20, 0.80, 0),
            .leftUpLeg:      SIMD3<Float>(-0.10, 0.90, 0),
            .leftLeg:        SIMD3<Float>(-0.10, 0.50, 0),
            .leftFoot:       SIMD3<Float>(-0.10, 0.05, 0),
            .leftToeEnd:     SIMD3<Float>(-0.10, 0.00, 0.10),
            .rightUpLeg:     SIMD3<Float>( 0.10, 0.90, 0),
            .rightLeg:       SIMD3<Float>( 0.10, 0.50, 0),
            .rightFoot:      SIMD3<Float>( 0.10, 0.05, 0),
            .rightToeEnd:    SIMD3<Float>( 0.10, 0.00, 0.10),
        ]
    }

    /// Minimal 18-joint stub for tests that only need joint presence.
    static func stub() -> [JointName: SIMD3<Float>] {
        [
            .root:           SIMD3<Float>(0, 1.0, 0),
            .hips:           SIMD3<Float>(0, 1.0, 0),
            .spine7:         SIMD3<Float>(0, 1.3, 0),
            .neck1:          SIMD3<Float>(0, 1.4, 0),
            .head:           SIMD3<Float>(0, 1.6, 0),
            .leftShoulder:   SIMD3<Float>(-0.2, 1.3, 0),
            .leftArm:        SIMD3<Float>(-0.3, 1.3, 0),
            .leftForearm:    SIMD3<Float>(-0.3, 1.0, 0),
            .leftHand:       SIMD3<Float>(-0.3, 0.8, 0),
            .rightShoulder:  SIMD3<Float>( 0.2, 1.3, 0),
            .rightArm:       SIMD3<Float>( 0.3, 1.3, 0),
            .rightForearm:   SIMD3<Float>( 0.3, 1.0, 0),
            .rightHand:      SIMD3<Float>( 0.3, 0.8, 0),
            .leftUpLeg:      SIMD3<Float>(-0.1, 0.9, 0),
            .leftLeg:        SIMD3<Float>(-0.1, 0.5, 0),
            .leftFoot:       SIMD3<Float>(-0.1, 0.0, 0),
            .rightUpLeg:     SIMD3<Float>( 0.1, 0.9, 0),
            .rightLeg:       SIMD3<Float>( 0.1, 0.5, 0),
            .rightFoot:      SIMD3<Float>( 0.1, 0.0, 0),
        ]
    }

    // MARK: - Posture Variants

    /// Forward-leaning skeleton (head shifted forward by `offsetM` meters).
    static func forwardLean(offset offsetM: Float = 0.15) -> [JointName: SIMD3<Float>] {
        var joints = upright()
        joints[.head] = SIMD3<Float>(0, 1.50, -offsetM)
        joints[.neck1] = SIMD3<Float>(0, 1.33, -offsetM * 0.5)
        return joints
    }

    /// Lateral tilt skeleton (shoulders asymmetric).
    static func lateralTilt(rightHigher: Float = 0.05) -> [JointName: SIMD3<Float>] {
        var joints = upright()
        joints[.leftShoulder]  = SIMD3<Float>(-0.10, 1.30 - rightHigher, 0)
        joints[.rightShoulder] = SIMD3<Float>( 0.10, 1.30 + rightHigher, 0)
        return joints
    }

    /// Walking skeleton with one foot forward.
    static func midStride() -> [JointName: SIMD3<Float>] {
        var joints = upright()
        joints[.leftFoot]  = SIMD3<Float>(-0.10, 0.05, -0.30)
        joints[.rightFoot] = SIMD3<Float>( 0.10, 0.05,  0.30)
        joints[.leftUpLeg] = SIMD3<Float>(-0.10, 0.90, -0.10)
        joints[.rightUpLeg] = SIMD3<Float>( 0.10, 0.90, 0.10)
        return joints
    }
}
