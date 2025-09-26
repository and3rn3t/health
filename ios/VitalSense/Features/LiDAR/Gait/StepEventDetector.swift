import Foundation
import simd
#if canImport(ARKit)
import ARKit

/// Detects heel-strike (step) events from sequential foot poses.
final class StepEventDetector {
    private struct FootState {
        var lastPos: SIMD3<Float>?
        var lastVel: SIMD3<Float> = .zero
        var lastTimestamp: TimeInterval?
        var phase: Phase = .swing
        var lastStrikeTime: TimeInterval?
        var lastToeOffTime: TimeInterval?
        var stanceStartTime: TimeInterval?
        var currentSwingMaxY: Float = -.infinity
        enum Phase { case stance, swing }
    }

    private var left = FootState()
    private var right = FootState()

    // Double support tracking
    private var overlapStart: TimeInterval?
    private var pendingOverlapDurations: [TimeInterval] = []

    // Tunable thresholds
    private let verticalVelEpsilon: Float = 0.05 // m/s
    private let horizontalSpeedThreshold: Float = 0.25 // m/s
    private let swingHorizontalMin: Float = 0.15 // m/s
    private let minStepInterval: TimeInterval = 0.25 // 240 spm upper bound
    private let maxStepInterval: TimeInterval = 2.5 // ignore very long gaps
    private let maxFootHeightForStrike: Float = 0.045 // 4.5 cm
    private let minToeClearanceToRecord: Float = 0.005

    // Forward heading estimation
    private var lastMidpoint: SIMD2<Float>?
    private var heading: SIMD2<Float>? // normalized
    private let headingAlpha: Float = 0.2

#if DEBUG
    // Test helper: inject a heading vector (normalized internally)
    func _testSetHeading(_ h: SIMD2<Float>) { heading = simd_length(h) > 0 ? simd_normalize(h) : nil }
    // Test helper: compute projected step length using current (possibly injected) heading
    func _testProjectedLength(current: SIMD3<Float>, other: SIMD3<Float>) -> Float? { computeStepLength(currentFoot: current, otherFoot: other) }
#endif

    /// Drain and return newly computed double support durations (seconds) since last call.
    func drainDoubleSupportDurations() -> [TimeInterval] {
        let d = pendingOverlapDurations
        pendingOverlapDurations.removeAll()
        return d
    }

    /// Process new foot positions producing zero or one step event per call.
    func process(timestamp: TimeInterval, leftPos: SIMD3<Float>, rightPos: SIMD3<Float>, floorY: Float?) -> StepEvent? {
        let leftEvent = update(foot: .left, state: &left, other: &right, position: leftPos, otherPos: rightPos, timestamp: timestamp, floorY: floorY)
        let rightEvent = update(foot: .right, state: &right, other: &left, position: rightPos, otherPos: leftPos, timestamp: timestamp, floorY: floorY)
        return leftEvent ?? rightEvent
    }

    private func update(foot: FootSide, state: inout FootState, other: inout FootState, position: SIMD3<Float>, otherPos: SIMD3<Float>, timestamp: TimeInterval, floorY: Float?) -> StepEvent? {
        if let lastPos = state.lastPos, let lastTime = state.lastTimestamp {
            let dt = Float(timestamp - lastTime)
            if dt > 0 { state.lastVel = (position - lastPos) / max(dt, 1e-4) }
        }
        state.lastPos = position
        state.lastTimestamp = timestamp

        if state.phase == .swing, position.y > state.currentSwingMaxY { state.currentSwingMaxY = position.y }

        let floor = floorY ?? 0
        let horizontalSpeed = hypotf(state.lastVel.x, state.lastVel.z)
        let verticalSpeed = state.lastVel.y
        let footHeightAboveFloor = position.y - floor
        let isNearFloor = footHeightAboveFloor < maxFootHeightForStrike
        let isLowVertical = abs(verticalSpeed) < verticalVelEpsilon
        let isSlowHorizontal = horizontalSpeed < horizontalSpeedThreshold

        var produced: StepEvent? = nil

        switch state.phase {
        case .swing:
            if isNearFloor && isLowVertical && isSlowHorizontal { // potential heel strike
                if let lastStrike = state.lastStrikeTime {
                    let interval = timestamp - lastStrike
                    if interval < minStepInterval || interval > maxStepInterval { /* still transition */ }
                }
                // Heel strike -> stance begins
                state.phase = .stance
                let prevStrike = state.lastStrikeTime
                state.lastStrikeTime = timestamp
                state.stanceStartTime = timestamp

                // If other foot already in stance, start or continue double support
                if other.phase == .stance { overlapStart = overlapStart ?? timestamp }

                let stepLength = computeStepLength(currentFoot: position, otherFoot: otherPos)
                let strideLength: Float? = {
                    guard let prev = prevStrike, let sl = stepLength else { return nil }
                    let strideT = timestamp - prev
                    return strideT > 0 ? sl * 2 : nil
                }()

                var swingDuration: TimeInterval? = nil
                var toeClearance: Float? = nil
                if let toeOff = state.lastToeOffTime { // just finished swing
                    swingDuration = timestamp - toeOff
                    let clearance = state.currentSwingMaxY - floor
                    toeClearance = clearance > minToeClearanceToRecord ? clearance : nil
                }
                state.currentSwingMaxY = -.infinity

                produced = StepEvent(
                    foot: foot,
                    timestamp: timestamp,
                    position: position,
                    stepLength: stepLength,
                    strideLength: strideLength,
                    stanceDuration: nil,
                    swingDuration: swingDuration,
                    toeClearance: toeClearance
                )
            }
        case .stance:
            // Toe-off detection
            if footHeightAboveFloor > maxFootHeightForStrike && (verticalSpeed > verticalVelEpsilon || horizontalSpeed > swingHorizontalMin) {
                // Ending stance
                if let start = state.stanceStartTime { // close potential overlap
                    if other.phase == .stance, let overlapBegin = overlapStart {
                        let overlapEnd = timestamp
                        if overlapEnd > overlapBegin { pendingOverlapDurations.append(overlapEnd - overlapBegin) }
                        overlapStart = nil // reset; may restart if other foot remains stance and this foot returns to stance (unlikely immediately)
                    }
                }
                state.phase = .swing
                state.lastToeOffTime = timestamp
                state.currentSwingMaxY = position.y
            }
        }

        // Update heading from midpoint displacement
        let midpoint = SIMD2<Float>((position.x + otherPos.x) * 0.5, (position.z + otherPos.z) * 0.5)
        if let last = lastMidpoint {
            var disp = midpoint - last
            let len = simd_length(disp)
            if len > 0.01 { // ignore tiny jitter
                disp /= len
                if var h = heading { h = simd_normalize(h * (1 - headingAlpha) + disp * headingAlpha); heading = h } else { heading = disp }
            }
        }
        lastMidpoint = midpoint

        // If both feet are stance and overlapStart not set, we missed start due to ordering; set now
        if left.phase == .stance && right.phase == .stance && overlapStart == nil {
            overlapStart = max(left.stanceStartTime ?? timestamp, right.stanceStartTime ?? timestamp)
        }

        return produced
    }

    private func computeStepLength(currentFoot: SIMD3<Float>, otherFoot: SIMD3<Float>) -> Float? {
        let delta = currentFoot - otherFoot
        let horizontal = SIMD2<Float>(delta.x, delta.z)
        let euclid = simd_length(horizontal)
        if euclid < 0.05 || euclid > 2.5 { return nil }
        if let h = heading, simd_length(h) > 0.1 {
            // Project onto heading; ensure non-negative
            let proj = max(0, simd_dot(horizontal, h))
            // Fallback if projection unreasonably small compared to euclid (e.g., turning)
            return proj < 0.3 * euclid ? euclid : proj
        }
        return euclid
    }
}
#endif
