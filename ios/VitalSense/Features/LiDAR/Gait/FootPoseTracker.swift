import Foundation
import simd
#if canImport(ARKit)
import ARKit

/// Extracts and smooths foot positions each AR frame.
final class FootPoseTracker {
    struct Output {
        let timestamp: TimeInterval
        let left: SIMD3<Float>
        let right: SIMD3<Float>
    }

    // Exponential smoothing factor
    private let alpha: Float = 0.25
    private var lastLeft: SIMD3<Float>?
    private var lastRight: SIMD3<Float>?

    func process(bodyAnchor: ARBodyAnchor, frameTimestamp: TimeInterval) -> Output? {
        let skeleton = bodyAnchor.skeleton
        guard let leftFoot = skeleton.joint(.leftFoot)?.anchorFromJointTransform,
              let rightFoot = skeleton.joint(.rightFoot)?.anchorFromJointTransform else { return nil }

        let leftWorld = worldPosition(parent: bodyAnchor.transform, joint: leftFoot)
        let rightWorld = worldPosition(parent: bodyAnchor.transform, joint: rightFoot)

        let smoothLeft = smooth(prev: lastLeft, current: leftWorld)
        let smoothRight = smooth(prev: lastRight, current: rightWorld)
        lastLeft = smoothLeft
        lastRight = smoothRight

        return Output(timestamp: frameTimestamp, left: smoothLeft, right: smoothRight)
    }

    private func worldPosition(parent: simd_float4x4, joint: simd_float4x4) -> SIMD3<Float> {
        let m = parent * joint
        return SIMD3<Float>(m.columns.3.x, m.columns.3.y, m.columns.3.z)
    }

    private func smooth(prev: SIMD3<Float>?, current: SIMD3<Float>) -> SIMD3<Float> {
        guard let p = prev else { return current }
        return p + alpha * (current - p)
    }
}
#endif
