//
//  JointName.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import ARKit

/// Maps to ARKit skeleton joint names with Codable conformance for serialization.
enum JointName: String, Codable, CaseIterable, Sendable {
    case root
    case hips = "hips_joint"
    case spine1 = "spine_1_joint"
    case spine2 = "spine_2_joint"
    case spine3 = "spine_3_joint"
    case spine4 = "spine_4_joint"
    case spine5 = "spine_5_joint"
    case spine6 = "spine_6_joint"
    case spine7 = "spine_7_joint"
    case neck1 = "neck_1_joint"
    case neck2 = "neck_2_joint"
    case neck3 = "neck_3_joint"
    case neck4 = "neck_4_joint"
    case head = "head_joint"
    case leftShoulder = "left_shoulder_1_joint"
    case leftArm = "left_arm_joint"
    case leftForearm = "left_forearm_joint"
    case leftHand = "left_hand_joint"
    case rightShoulder = "right_shoulder_1_joint"
    case rightArm = "right_arm_joint"
    case rightForearm = "right_forearm_joint"
    case rightHand = "right_hand_joint"
    case leftUpLeg = "left_upLeg_joint"
    case leftLeg = "left_leg_joint"
    case leftFoot = "left_foot_joint"
    case leftToeEnd = "left_toeEnd_joint"
    case rightUpLeg = "right_upLeg_joint"
    case rightLeg = "right_leg_joint"
    case rightFoot = "right_foot_joint"
    case rightToeEnd = "right_toeEnd_joint"

    /// The corresponding ARKit skeleton joint name, if available.
    var arJointName: ARSkeleton.JointName? {
        switch self {
        case .root: return .root
        case .head: return .head
        case .leftFoot: return .leftFoot
        case .leftHand: return .leftHand
        case .rightFoot: return .rightFoot
        case .rightHand: return .rightHand
        default: return nil
        }
    }

    /// The raw joint path string used by ARSkeleton3D for indexed lookup.
    var jointPath: String { rawValue }

    /// Key joints used for skeleton overlay rendering, connected in parent-child relationships.
    static let skeletonConnections: [(JointName, JointName)] = [
        (.root, .spine1), (.spine1, .spine3), (.spine3, .spine5),
        (.spine5, .spine7), (.spine7, .neck1), (.neck1, .head),
        // Arms
        (.spine7, .leftShoulder), (.leftShoulder, .leftArm),
        (.leftArm, .leftForearm), (.leftForearm, .leftHand),
        (.spine7, .rightShoulder), (.rightShoulder, .rightArm),
        (.rightArm, .rightForearm), (.rightForearm, .rightHand),
        // Legs
        (.root, .leftUpLeg), (.leftUpLeg, .leftLeg),
        (.leftLeg, .leftFoot), (.leftFoot, .leftToeEnd),
        (.root, .rightUpLeg), (.rightUpLeg, .rightLeg),
        (.rightLeg, .rightFoot), (.rightFoot, .rightToeEnd)
    ]
}
