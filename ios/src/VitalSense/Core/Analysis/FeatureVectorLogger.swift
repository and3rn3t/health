import Foundation

/// Represents a snapshot of engineered + core gait features suitable for offline analysis / shadow ML.
struct GaitFeatureVector: Codable, Equatable {
    let timestamp: Date
    let speed: Double?
    let stepLength: Double?
    let cadence: Double?
    let doubleSupport: Double?
    let speedCV: Double?
    let stepLengthCV: Double?
    let strideTimeCV: Double?
    let harmonicRatio: Double?
    let swayProxy: Double?
    let toeClearance: Double?
    let nearTripEvents: Int?
    let stabilityIndex: Double?
    let riskScore: Double?
    let riskLevel: String?
    let riskConfidence: Double?
}

/// In-memory ring buffer logger (DEBUG+runtime) for capturing feature vectors.
final class FeatureVectorLogger {
    static let shared = FeatureVectorLogger()
    private init() {}

    private let maxCapacity = 250
    private var buffer: [GaitFeatureVector] = []
    private let lock = NSLock()

    func log(from metrics: GaitMetrics?, risk: GaitRiskAssessment?) {
        guard let m = metrics else { return }
        let vec = GaitFeatureVector(
            timestamp: Date(),
            speed: m.averageWalkingSpeed,
            stepLength: m.averageStepLength,
            cadence: m.stepFrequency,
            doubleSupport: m.doubleSupportTime,
            speedCV: m.walkingSpeedVariability,
            stepLengthCV: m.stepLengthVariability,
            strideTimeCV: m.strideTimeVariability,
            harmonicRatio: m.harmonicRatio,
            swayProxy: m.mediolateralSwayProxy,
            toeClearance: m.averageToeClearance,
            nearTripEvents: m.nearTripEvents,
            stabilityIndex: nil, // available in LiDARSessionManager meta; could be plumbed if needed
            riskScore: risk?.score,
            riskLevel: risk?.level.rawValue,
            riskConfidence: risk?.confidence
        )
        lock.lock(); defer { lock.unlock() }
        buffer.append(vec)
        if buffer.count > maxCapacity { buffer.removeFirst(buffer.count - maxCapacity) }
    }

    func exportJSON() -> Data? {
        lock.lock(); defer { lock.unlock() }
        return try? JSONEncoder().encode(buffer)
    }

#if DEBUG
    func _reset() { lock.lock(); buffer.removeAll(); lock.unlock() }
    func _count() -> Int { lock.lock(); defer { lock.unlock() }; return buffer.count }
    func _last() -> GaitFeatureVector? { lock.lock(); defer { lock.unlock() }; return buffer.last }
#endif
}
