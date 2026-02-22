//
//  FrameFixtures.swift
//  Andernet PostureTests
//
//  Shared BodyFrame and MotionFrame factories for unit tests.
//

import Foundation
import simd
@testable import Andernet_Posture

// MARK: - Test-only MotionFrame Initializer

/// Memberwise initializer for MotionFrame (test target only).
/// The production code only has init(from: CMDeviceMotion).
extension MotionFrame {
    init(
        timestamp: TimeInterval,
        roll: Double = 0,
        pitch: Double = 0,
        yaw: Double = 0,
        userAccelerationX: Double = 0,
        userAccelerationY: Double = 0,
        userAccelerationZ: Double = 0,
        gravityX: Double = 0,
        gravityY: Double = -1,
        gravityZ: Double = 0,
        rotationRateX: Double = 0,
        rotationRateY: Double = 0,
        rotationRateZ: Double = 0
    ) {
        let json: [String: Any] = [
            "timestamp": timestamp,
            "roll": roll, "pitch": pitch, "yaw": yaw,
            "userAccelerationX": userAccelerationX,
            "userAccelerationY": userAccelerationY,
            "userAccelerationZ": userAccelerationZ,
            "gravityX": gravityX,
            "gravityY": gravityY,
            "gravityZ": gravityZ,
            "rotationRateX": rotationRateX,
            "rotationRateY": rotationRateY,
            "rotationRateZ": rotationRateZ,
        ]
        // swiftlint:disable:next force_try
        let data = try! JSONSerialization.data(withJSONObject: json)
        // swiftlint:disable:next force_try
        self = try! JSONDecoder().decode(MotionFrame.self, from: data)
    }
}

// MARK: - FrameFixtures

/// Centralized BodyFrame factories for testing.
enum FrameFixtures {

    // MARK: - BodyFrame

    /// A BodyFrame from upright standing joints with metric defaults.
    static func upright(
        timestamp: TimeInterval = 0,
        postureScore: Double = 85,
        cadenceSPM: Double = 0,
        walkingSpeedMPS: Double = 0,
        swayVelocityMMS: Double = 5.0
    ) -> BodyFrame {
        BodyFrame(
            timestamp: timestamp,
            joints: JointFixtures.upright(),
            sagittalTrunkLeanDeg: 2.0,
            frontalTrunkLeanDeg: 1.0,
            craniovertebralAngleDeg: 52.0,
            sagittalVerticalAxisCm: 2.0,
            shoulderAsymmetryCm: 0.5,
            shoulderTiltDeg: 1.0,
            pelvicObliquityDeg: 0.5,
            thoracicKyphosisDeg: 35.0,
            lumbarLordosisDeg: 45.0,
            coronalSpineDeviationCm: 0.3,
            postureScore: postureScore,
            cadenceSPM: cadenceSPM,
            avgStrideLengthM: 0,
            walkingSpeedMPS: walkingSpeedMPS,
            stepWidthCm: 10,
            swayVelocityMMS: swayVelocityMMS
        )
    }

    /// A BodyFrame simulating a forward-leaning posture.
    static func forwardLean(timestamp: TimeInterval = 0) -> BodyFrame {
        BodyFrame(
            timestamp: timestamp,
            joints: JointFixtures.forwardLean(),
            sagittalTrunkLeanDeg: 15.0,
            frontalTrunkLeanDeg: 1.0,
            craniovertebralAngleDeg: 35.0,
            sagittalVerticalAxisCm: 8.0,
            postureScore: 45
        )
    }

    /// A BodyFrame during walking with gait metrics populated.
    static func walking(
        timestamp: TimeInterval = 0,
        cadenceSPM: Double = 110,
        walkingSpeedMPS: Double = 1.2,
        strideLength: Double = 0.7
    ) -> BodyFrame {
        BodyFrame(
            timestamp: timestamp,
            joints: JointFixtures.midStride(),
            sagittalTrunkLeanDeg: 3.0,
            frontalTrunkLeanDeg: 2.0,
            craniovertebralAngleDeg: 50.0,
            sagittalVerticalAxisCm: 3.0,
            postureScore: 72,
            cadenceSPM: cadenceSPM,
            avgStrideLengthM: strideLength,
            walkingSpeedMPS: walkingSpeedMPS,
            stepWidthCm: 12,
            hipFlexionLeftDeg: 25,
            hipFlexionRightDeg: 10,
            kneeFlexionLeftDeg: 45,
            kneeFlexionRightDeg: 15
        )
    }

    /// Sequence of walk frames with incrementing timestamps.
    static func walkSequence(count: Int, startTime: TimeInterval = 0) -> [BodyFrame] {
        (0..<count).map { i in
            walking(
                timestamp: startTime + Double(i) * 0.033,
                cadenceSPM: 110.0 + Double(i % 5),
                walkingSpeedMPS: 1.2,
                strideLength: 0.7
            )
        }
    }
}
