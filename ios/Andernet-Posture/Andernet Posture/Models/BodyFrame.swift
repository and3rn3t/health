//
//  BodyFrame.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import simd

/// A single frame of body tracking data captured during a session.
/// Stores all tracked joint world positions and computed posture/gait metrics.
struct BodyFrame: Codable, Sendable {
    /// Time elapsed since session start, in seconds.
    let timestamp: TimeInterval
    /// World positions of all tracked joints at this frame.
    let joints: [String: [Float]]

    // MARK: - Posture Metrics (Tier 1)

    /// Sagittal trunk lean (forward/backward) in degrees. Positive = forward.
    var sagittalTrunkLeanDeg: Double
    /// Frontal trunk lean (side-to-side) in degrees. Positive = right.
    var frontalTrunkLeanDeg: Double
    /// Craniovertebral angle (CVA) in degrees. Normal ≈ 49–56°. Lower = more forward head.
    /// Ref: Yip CH et al., Manual Therapy, 2008.
    var craniovertebralAngleDeg: Double
    /// Sagittal Vertical Axis (SVA) in cm. Positive = head forward of pelvis. Normal < 5 cm.
    /// Ref: Glassman SD et al., Spine, 2005.
    var sagittalVerticalAxisCm: Double
    /// Shoulder height asymmetry in cm. |left - right|.
    var shoulderAsymmetryCm: Double
    /// Shoulder tilt angle in degrees.
    var shoulderTiltDeg: Double
    /// Pelvic obliquity in degrees. Positive = right hip higher.
    var pelvicObliquityDeg: Double

    // MARK: - Posture Metrics (Tier 2)

    /// Thoracic kyphosis proxy (3-point angle) in degrees. Normal 20–45°.
    /// Ref: Fon GT et al., Radiology, 1980.
    var thoracicKyphosisDeg: Double
    /// Lumbar lordosis proxy in degrees. Normal 40–60°.
    var lumbarLordosisDeg: Double
    /// Maximum coronal spine deviation (scoliosis proxy) in cm.
    var coronalSpineDeviationCm: Double
    /// Kendall postural type classification.
    var posturalType: String?

    // MARK: - Posture Metrics (Tier 3 — NYPR)

    /// Automated NYPR sub-score (of automatable items only).
    var nyprScore: Int?

    // MARK: - Composite Score

    /// Composite posture score (0–100) using literature-grounded weights.
    var postureScore: Double

    // MARK: - Gait Metrics

    /// Cadence at this point in steps per minute.
    var cadenceSPM: Double
    /// Rolling average stride length at this point.
    var avgStrideLengthM: Double
    /// Walking speed in m/s.
    var walkingSpeedMPS: Double
    /// Step width in cm.
    var stepWidthCm: Double

    // MARK: - Joint ROM (populated during gait)

    /// Hip flexion angle (degrees), left.
    var hipFlexionLeftDeg: Double
    /// Hip flexion angle (degrees), right.
    var hipFlexionRightDeg: Double
    /// Knee flexion angle (degrees), left.
    var kneeFlexionLeftDeg: Double
    /// Knee flexion angle (degrees), right.
    var kneeFlexionRightDeg: Double
    /// Pelvic tilt in degrees (sagittal, anterior positive).
    var pelvicTiltDeg: Double
    /// Trunk rotation in degrees (transverse plane).
    var trunkRotationDeg: Double
    /// Arm swing arc (sagittal), left, in degrees.
    var armSwingLeftDeg: Double
    /// Arm swing arc (sagittal), right, in degrees.
    var armSwingRightDeg: Double

    // MARK: - Balance (populated during standing)

    /// Sway velocity in mm/s (root position derivative). Zero if walking.
    var swayVelocityMMS: Double

    // MARK: - Ergonomic

    /// REBA score (1–15) if computed.
    var rebaScore: Int?

    // MARK: - Gait Pattern

    /// Detected gait pattern classification raw value.
    var gaitPatternRaw: String?

    // MARK: - Legacy Compatibility

    /// Legacy trunk lean (maps to sagittalTrunkLeanDeg).
    var trunkLeanDeg: Double { sagittalTrunkLeanDeg }
    /// Legacy lateral lean (maps to frontalTrunkLeanDeg).
    var lateralLeanDeg: Double { frontalTrunkLeanDeg }

    // MARK: - Coding Keys

    enum CodingKeys: String, CodingKey {
        case timestamp, joints
        case sagittalTrunkLeanDeg, frontalTrunkLeanDeg
        case craniovertebralAngleDeg, sagittalVerticalAxisCm
        case shoulderAsymmetryCm, shoulderTiltDeg, pelvicObliquityDeg
        case thoracicKyphosisDeg, lumbarLordosisDeg, coronalSpineDeviationCm
        case posturalType, nyprScore, postureScore
        case cadenceSPM, avgStrideLengthM, walkingSpeedMPS, stepWidthCm
        case hipFlexionLeftDeg, hipFlexionRightDeg
        case kneeFlexionLeftDeg, kneeFlexionRightDeg
        case pelvicTiltDeg, trunkRotationDeg
        case armSwingLeftDeg, armSwingRightDeg
        case swayVelocityMMS, rebaScore, gaitPatternRaw
    }

    // MARK: - Decodable (backward compatible)

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        timestamp = try c.decode(TimeInterval.self, forKey: .timestamp)
        joints = try c.decode([String: [Float]].self, forKey: .joints)

        sagittalTrunkLeanDeg = try c.decodeIfPresent(Double.self, forKey: .sagittalTrunkLeanDeg) ?? 0
        frontalTrunkLeanDeg = try c.decodeIfPresent(Double.self, forKey: .frontalTrunkLeanDeg) ?? 0
        craniovertebralAngleDeg = try c.decodeIfPresent(Double.self, forKey: .craniovertebralAngleDeg) ?? 52.0  // ideal CVA default, not 0 (pathological)
        sagittalVerticalAxisCm = try c.decodeIfPresent(Double.self, forKey: .sagittalVerticalAxisCm) ?? 0
        shoulderAsymmetryCm = try c.decodeIfPresent(Double.self, forKey: .shoulderAsymmetryCm) ?? 0
        shoulderTiltDeg = try c.decodeIfPresent(Double.self, forKey: .shoulderTiltDeg) ?? 0
        pelvicObliquityDeg = try c.decodeIfPresent(Double.self, forKey: .pelvicObliquityDeg) ?? 0
        thoracicKyphosisDeg = try c.decodeIfPresent(Double.self, forKey: .thoracicKyphosisDeg) ?? 0
        lumbarLordosisDeg = try c.decodeIfPresent(Double.self, forKey: .lumbarLordosisDeg) ?? 0
        coronalSpineDeviationCm = try c.decodeIfPresent(Double.self, forKey: .coronalSpineDeviationCm) ?? 0
        posturalType = try c.decodeIfPresent(String.self, forKey: .posturalType)
        nyprScore = try c.decodeIfPresent(Int.self, forKey: .nyprScore)
        postureScore = try c.decodeIfPresent(Double.self, forKey: .postureScore) ?? 0
        cadenceSPM = try c.decodeIfPresent(Double.self, forKey: .cadenceSPM) ?? 0
        avgStrideLengthM = try c.decodeIfPresent(Double.self, forKey: .avgStrideLengthM) ?? 0
        walkingSpeedMPS = try c.decodeIfPresent(Double.self, forKey: .walkingSpeedMPS) ?? 0
        stepWidthCm = try c.decodeIfPresent(Double.self, forKey: .stepWidthCm) ?? 0
        hipFlexionLeftDeg = try c.decodeIfPresent(Double.self, forKey: .hipFlexionLeftDeg) ?? 0
        hipFlexionRightDeg = try c.decodeIfPresent(Double.self, forKey: .hipFlexionRightDeg) ?? 0
        kneeFlexionLeftDeg = try c.decodeIfPresent(Double.self, forKey: .kneeFlexionLeftDeg) ?? 0
        kneeFlexionRightDeg = try c.decodeIfPresent(Double.self, forKey: .kneeFlexionRightDeg) ?? 0
        pelvicTiltDeg = try c.decodeIfPresent(Double.self, forKey: .pelvicTiltDeg) ?? 0
        trunkRotationDeg = try c.decodeIfPresent(Double.self, forKey: .trunkRotationDeg) ?? 0
        armSwingLeftDeg = try c.decodeIfPresent(Double.self, forKey: .armSwingLeftDeg) ?? 0
        armSwingRightDeg = try c.decodeIfPresent(Double.self, forKey: .armSwingRightDeg) ?? 0
        swayVelocityMMS = try c.decodeIfPresent(Double.self, forKey: .swayVelocityMMS) ?? 0
        rebaScore = try c.decodeIfPresent(Int.self, forKey: .rebaScore)
        gaitPatternRaw = try c.decodeIfPresent(String.self, forKey: .gaitPatternRaw)
    }

    // MARK: - Convenience Init

    /// Full initializer from SIMD3<Float> joint dictionary.
    init(
        timestamp: TimeInterval,
        joints: [JointName: SIMD3<Float>],
        sagittalTrunkLeanDeg: Double = 0,
        frontalTrunkLeanDeg: Double = 0,
        craniovertebralAngleDeg: Double = 0,
        sagittalVerticalAxisCm: Double = 0,
        shoulderAsymmetryCm: Double = 0,
        shoulderTiltDeg: Double = 0,
        pelvicObliquityDeg: Double = 0,
        thoracicKyphosisDeg: Double = 0,
        lumbarLordosisDeg: Double = 0,
        coronalSpineDeviationCm: Double = 0,
        posturalType: String? = nil,
        nyprScore: Int? = nil,
        postureScore: Double = 0,
        cadenceSPM: Double = 0,
        avgStrideLengthM: Double = 0,
        walkingSpeedMPS: Double = 0,
        stepWidthCm: Double = 0,
        hipFlexionLeftDeg: Double = 0,
        hipFlexionRightDeg: Double = 0,
        kneeFlexionLeftDeg: Double = 0,
        kneeFlexionRightDeg: Double = 0,
        pelvicTiltDeg: Double = 0,
        trunkRotationDeg: Double = 0,
        armSwingLeftDeg: Double = 0,
        armSwingRightDeg: Double = 0,
        swayVelocityMMS: Double = 0,
        rebaScore: Int? = nil,
        gaitPatternRaw: String? = nil
    ) {
        self.timestamp = timestamp
        self.sagittalTrunkLeanDeg = sagittalTrunkLeanDeg
        self.frontalTrunkLeanDeg = frontalTrunkLeanDeg
        self.craniovertebralAngleDeg = craniovertebralAngleDeg
        self.sagittalVerticalAxisCm = sagittalVerticalAxisCm
        self.shoulderAsymmetryCm = shoulderAsymmetryCm
        self.shoulderTiltDeg = shoulderTiltDeg
        self.pelvicObliquityDeg = pelvicObliquityDeg
        self.thoracicKyphosisDeg = thoracicKyphosisDeg
        self.lumbarLordosisDeg = lumbarLordosisDeg
        self.coronalSpineDeviationCm = coronalSpineDeviationCm
        self.posturalType = posturalType
        self.nyprScore = nyprScore
        self.postureScore = postureScore
        self.cadenceSPM = cadenceSPM
        self.avgStrideLengthM = avgStrideLengthM
        self.walkingSpeedMPS = walkingSpeedMPS
        self.stepWidthCm = stepWidthCm
        self.hipFlexionLeftDeg = hipFlexionLeftDeg
        self.hipFlexionRightDeg = hipFlexionRightDeg
        self.kneeFlexionLeftDeg = kneeFlexionLeftDeg
        self.kneeFlexionRightDeg = kneeFlexionRightDeg
        self.pelvicTiltDeg = pelvicTiltDeg
        self.trunkRotationDeg = trunkRotationDeg
        self.armSwingLeftDeg = armSwingLeftDeg
        self.armSwingRightDeg = armSwingRightDeg
        self.swayVelocityMMS = swayVelocityMMS
        self.rebaScore = rebaScore
        self.gaitPatternRaw = gaitPatternRaw

        var encoded: [String: [Float]] = [:]
        for (name, pos) in joints {
            encoded[name.rawValue] = [pos.x, pos.y, pos.z]
        }
        self.joints = encoded
    }

    /// Decode joint positions back to SIMD3<Float>.
    func decodedJoints() -> [JointName: SIMD3<Float>] {
        var result: [JointName: SIMD3<Float>] = [:]
        for (key, arr) in joints {
            guard arr.count == 3, let name = JointName(rawValue: key) else { continue }
            result[name] = SIMD3<Float>(arr[0], arr[1], arr[2])
        }
        return result
    }
}
