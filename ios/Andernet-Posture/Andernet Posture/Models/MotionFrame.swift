//
//  MotionFrame.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import CoreMotion

/// A snapshot of device motion data from CoreMotion.
struct MotionFrame: Codable, Sendable {
    let timestamp: TimeInterval
    /// Device attitude (roll, pitch, yaw) in radians.
    let roll: Double
    let pitch: Double
    let yaw: Double
    /// User acceleration (gravity removed) in G's.
    let userAccelerationX: Double
    let userAccelerationY: Double
    let userAccelerationZ: Double
    /// Gravity vector in G's.
    let gravityX: Double
    let gravityY: Double
    let gravityZ: Double
    /// Rotation rate in radians/s.
    let rotationRateX: Double
    let rotationRateY: Double
    let rotationRateZ: Double

    init(from motion: CMDeviceMotion, sessionStart: TimeInterval = 0) {
        self.timestamp = motion.timestamp - sessionStart
        self.roll = motion.attitude.roll
        self.pitch = motion.attitude.pitch
        self.yaw = motion.attitude.yaw
        self.userAccelerationX = motion.userAcceleration.x
        self.userAccelerationY = motion.userAcceleration.y
        self.userAccelerationZ = motion.userAcceleration.z
        self.gravityX = motion.gravity.x
        self.gravityY = motion.gravity.y
        self.gravityZ = motion.gravity.z
        self.rotationRateX = motion.rotationRate.x
        self.rotationRateY = motion.rotationRate.y
        self.rotationRateZ = motion.rotationRate.z
    }
}
