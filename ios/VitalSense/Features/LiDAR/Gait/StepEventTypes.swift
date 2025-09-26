import Foundation
import simd

/// Identifies a foot.
@frozen enum FootSide: String, Codable { case left, right }

/// Raw per-frame foot pose sample (world coordinates, meters).
struct FootPoseSample {
    let timestamp: TimeInterval
    let leftPosition: SIMD3<Float>
    let rightPosition: SIMD3<Float>
}

/// Detected step (heel strike) event.
struct StepEvent: Identifiable, Codable {
    var id: UUID = UUID()
    let foot: FootSide
    let timestamp: TimeInterval
    let position: SIMD3<Float>
    /// Distance (m) to previous contralateral foot strike.
    let stepLength: Float?
    /// Distance (m) between two successive strikes of the same foot.
    let strideLength: Float?
    /// Duration (s) of the stance phase that just ended for this foot (if known).
    let stanceDuration: TimeInterval?
    /// Duration (s) of the swing phase that just completed for this foot (if known).
    let swingDuration: TimeInterval?
    /// Average toe clearance (m) observed during the swing that ended with this strike.
    let toeClearance: Float?
}

/// Rolling aggregate produced periodically.
struct GaitRollingAggregate {
    let generatedAt: Date = Date()
    let stepEvents: [StepEvent]
    let averageStepLength: Double?
    let averageStrideLength: Double?
    let cadence: Double? // steps per minute
    let walkingSpeed: Double? // m/s (approx)
    let walkingSpeedCV: Double? // coefficient of variation
    let strideTimeSeconds: Double? // latest stride time seconds
    let stancePercentage: Double? // % of gait cycle
    let swingPercentage: Double?
    let doubleSupportPercentage: Double?
    let stepTimeCV: Double? // coefficient of variation
    let stepLengthCV: Double? // coefficient of variation
    let asymmetryStepLength: Double? // %
    let asymmetryStepTime: Double? // %
    let averageToeClearance: Double? // meters
}
