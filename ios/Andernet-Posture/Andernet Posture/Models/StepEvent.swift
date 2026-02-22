//
//  StepEvent.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation

/// A single foot-strike event detected during gait analysis.
struct StepEvent: Codable, Sendable {
    /// Represents which foot struck the ground.
    enum Foot: String, Codable, Sendable {
        case left
        case right
    }

    /// Gait phase classification.
    enum GaitPhase: String, Codable, Sendable {
        case initialContact
        case loadingResponse
        case midStance
        case terminalStance
        case preSwing
        case initialSwing
        case midSwing
        case terminalSwing
    }

    /// Time elapsed since session start, in seconds.
    let timestamp: TimeInterval
    /// Which foot made contact.
    let foot: Foot
    /// World-space XZ position of the foot at contact.
    let positionX: Float
    let positionZ: Float
    /// Stride length in meters (distance from previous same-foot strike). Nil for the first step.
    let strideLengthM: Double?
    /// Step length in meters (distance from contralateral foot at previous contact).
    var stepLengthM: Double?
    /// Step width in cm (mediolateral distance between feet at contact).
    var stepWidthCm: Double?
    /// Stance time in seconds for this step (foot contact to toe-off).
    var stanceTimeSec: Double?
    /// Swing time in seconds (toe-off to next contact, same foot).
    var swingTimeSec: Double?
    /// Current gait phase at this event.
    var gaitPhase: GaitPhase?
    /// Foot vertical velocity at impact (m/s). Lower = softer landing.
    var impactVelocity: Double?
    /// Foot clearance height during swing (meters).
    var footClearanceM: Double?

    // MARK: - Coding Keys (backward compatible)

    enum CodingKeys: String, CodingKey {
        case timestamp, foot, positionX, positionZ, strideLengthM
        case stepLengthM, stepWidthCm, stanceTimeSec, swingTimeSec
        case gaitPhase, impactVelocity, footClearanceM
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        timestamp = try c.decode(TimeInterval.self, forKey: .timestamp)
        foot = try c.decode(Foot.self, forKey: .foot)
        positionX = try c.decode(Float.self, forKey: .positionX)
        positionZ = try c.decode(Float.self, forKey: .positionZ)
        strideLengthM = try c.decodeIfPresent(Double.self, forKey: .strideLengthM)
        stepLengthM = try c.decodeIfPresent(Double.self, forKey: .stepLengthM)
        stepWidthCm = try c.decodeIfPresent(Double.self, forKey: .stepWidthCm)
        stanceTimeSec = try c.decodeIfPresent(Double.self, forKey: .stanceTimeSec)
        swingTimeSec = try c.decodeIfPresent(Double.self, forKey: .swingTimeSec)
        gaitPhase = try c.decodeIfPresent(GaitPhase.self, forKey: .gaitPhase)
        impactVelocity = try c.decodeIfPresent(Double.self, forKey: .impactVelocity)
        footClearanceM = try c.decodeIfPresent(Double.self, forKey: .footClearanceM)
    }

    init(
        timestamp: TimeInterval,
        foot: Foot,
        positionX: Float,
        positionZ: Float,
        strideLengthM: Double? = nil,
        stepLengthM: Double? = nil,
        stepWidthCm: Double? = nil,
        stanceTimeSec: Double? = nil,
        swingTimeSec: Double? = nil,
        gaitPhase: GaitPhase? = nil,
        impactVelocity: Double? = nil,
        footClearanceM: Double? = nil
    ) {
        self.timestamp = timestamp
        self.foot = foot
        self.positionX = positionX
        self.positionZ = positionZ
        self.strideLengthM = strideLengthM
        self.stepLengthM = stepLengthM
        self.stepWidthCm = stepWidthCm
        self.stanceTimeSec = stanceTimeSec
        self.swingTimeSec = swingTimeSec
        self.gaitPhase = gaitPhase
        self.impactVelocity = impactVelocity
        self.footClearanceM = footClearanceM
    }
}
