import Foundation
import simd

/// Consumes detected StepEvents and produces rolling aggregate gait metrics.
final class GaitMetricsAggregator {
    // Configuration
    private let maxStoredEvents = 40
    private let cadenceWindow: TimeInterval = 10 // seconds

    // State
    private var events: [StepEvent] = []
    private var lastLeftStrike: StepEvent?
    private var lastRightStrike: StepEvent?

    // Rolling arrays for variability
    private var recentStepTimes: [Double] = [] // between alternating feet
    private var recentStepLengths: [Double] = []
    private var recentStrideSpeeds: [Double] = [] // stride length / stride time
    private var doubleSupportDurations: [Double] = [] // seconds of overlap
    private let maxDoubleSupport = 20

    // Outlier filtering state
    private var rawStepLengths: [Double] = []
    private let physiologicMin: Double = 0.20
    private let physiologicMax: Double = 1.80

    func reset() {
        events.removeAll(); lastLeftStrike = nil; lastRightStrike = nil
        recentStepTimes.removeAll(); recentStepLengths.removeAll(); recentStrideSpeeds.removeAll()
        doubleSupportDurations.removeAll()
        rawStepLengths.removeAll()
    }

    /// Ingest raw double support overlap durations (seconds) collected by detector.
    func ingestDoubleSupportDurations(_ durations: [TimeInterval]) {
        guard !durations.isEmpty else { return }
        doubleSupportDurations.append(contentsOf: durations.map(Double.init))
        if doubleSupportDurations.count > maxDoubleSupport { doubleSupportDurations.removeFirst(doubleSupportDurations.count - maxDoubleSupport) }
    }

    /// Add a new step event and compute an updated rolling aggregate.
    @discardableResult
    func ingest(step: StepEvent) -> GaitRollingAggregate {
        events.append(step)
        if events.count > maxStoredEvents { events.removeFirst(events.count - maxStoredEvents) }

        switch step.foot {
        case .left:
            if let prev = lastRightStrike { recentStepTimes.append(step.timestamp - prev.timestamp) }
            lastLeftStrike = step
        case .right:
            if let prev = lastLeftStrike { recentStepTimes.append(step.timestamp - prev.timestamp) }
            lastRightStrike = step
        }
        if let sl = step.stepLength {
            let len = Double(sl)
            if !isOutlier(len) {
                recentStepLengths.append(len)
                rawStepLengths.append(len)
                if rawStepLengths.count > 200 { rawStepLengths.removeFirst(rawStepLengths.count - 200) }
            }
        }
        // Removed previous direct append of recentStepLengths (already handled)
        // Derive stride speed from strideLength and time between two strikes of same foot (approx)
        if let strideLen = step.strideLength, let prevStrike = (step.foot == .left ? previousStrike(for: .left, excluding: step.id) : previousStrike(for: .right, excluding: step.id))?.timestamp {
            let dt = step.timestamp - prevStrike
            if dt > 0, strideLen > 0 { recentStrideSpeeds.append(Double(strideLen) / dt) }
        }

        trimRollingArrays()

        let now = step.timestamp
        let windowEvents = events.filter { now - $0.timestamp <= cadenceWindow }
        let cadence: Double? = {
            guard windowEvents.count > 1, let first = windowEvents.first else { return nil }
            let span = windowEvents.last!.timestamp - first.timestamp
            guard span > 0 else { return nil }
            return Double(windowEvents.count - 1) / span * 60.0
        }()

        let averageStepLength = avg(recentStepLengths)
        let averageStrideLength: Double? = averageStepLength.map { $0 * 2 }

        // Stride time (same-foot consecutive strikes)
        let strideTime: Double? = strideTimeEstimate()
        let walkingSpeed: Double? = {
            guard let strideLen = averageStrideLength, let st = strideTime, st > 0 else { return nil }
            return strideLen / st
        }()

        let stanceDurations = events.compactMap { $0.stanceDuration }
        let swingDurations = events.compactMap { $0.swingDuration }
        let avgStance = avg(stanceDurations)
        let avgSwing = avg(swingDurations)
        var stancePct: Double? = nil
        var swingPct: Double? = nil
        var doubleSupportPct: Double? = nil
        if let a = avgStance, let b = avgSwing, (a + b) > 0 {
            stancePct = a / (a + b) * 100
            swingPct = b / (a + b) * 100
            doubleSupportPct = max(0, 100 - (stancePct! + swingPct!))
        }

        let stepTimeCV = coefficientOfVariation(recentStepTimes)
        let stepLengthCV = coefficientOfVariation(recentStepLengths)
        let speedCV = coefficientOfVariation(recentStrideSpeeds)

        let leftLengths = events.filter { $0.foot == .left }.compactMap { $0.stepLength }.map(Double.init)
        let rightLengths = events.filter { $0.foot == .right }.compactMap { $0.stepLength }.map(Double.init)
        let asymLength = asymmetryPercent(left: avg(leftLengths), right: avg(rightLengths))

        let leftTimes = pairwiseIntervals(events.filter { $0.foot == .left }.map { $0.timestamp }).map { $0 / 2 }
        let rightTimes = pairwiseIntervals(events.filter { $0.foot == .right }.map { $0.timestamp }).map { $0 / 2 }
        let asymTime = asymmetryPercent(left: avg(leftTimes), right: avg(rightTimes))

        let avgToeClearance: Double? = {
            let clears = events.compactMap { $0.toeClearance }.map(Double.init)
            return avg(clears)
        }()

        let strideTimeSeconds = strideTime

        // Compute double support percentage: average overlap / stride time
        let avgDoubleSupport = avg(doubleSupportDurations)
        var doubleSupportPctFinal: Double? = nil
        if let ds = avgDoubleSupport, let st = strideTimeSeconds, st > 0 { doubleSupportPctFinal = ds / st * 100 }

        return GaitRollingAggregate(
            stepEvents: events,
            averageStepLength: averageStepLength,
            averageStrideLength: averageStrideLength,
            cadence: cadence,
            walkingSpeed: walkingSpeed,
            walkingSpeedCV: speedCV,
            strideTimeSeconds: strideTimeSeconds,
            stancePercentage: stancePct,
            swingPercentage: swingPct,
            doubleSupportPercentage: doubleSupportPctFinal,
            stepTimeCV: stepTimeCV,
            stepLengthCV: stepLengthCV,
            asymmetryStepLength: asymLength,
            asymmetryStepTime: asymTime,
            averageToeClearance: avgToeClearance
        )
    }

    private func previousStrike(for foot: FootSide, excluding id: UUID) -> StepEvent? {
        return events.reversed().first { $0.foot == foot && $0.id != id }
    }

    private func strideTimeEstimate() -> Double? {
        let leftStrikes = events.filter { $0.foot == .left }
        if leftStrikes.count >= 2 {
            let pair = leftStrikes.suffix(2)
            return pair.last!.timestamp - pair.first!.timestamp
        }
        let rightStrikes = events.filter { $0.foot == .right }
        if rightStrikes.count >= 2 {
            let pair = rightStrikes.suffix(2)
            return pair.last!.timestamp - pair.first!.timestamp
        }
        return nil
    }

    private func trimRollingArrays() {
        if recentStepTimes.count > maxStoredEvents { recentStepTimes.removeFirst(recentStepTimes.count - maxStoredEvents) }
        if recentStepLengths.count > maxStoredEvents { recentStepLengths.removeFirst(recentStepLengths.count - maxStoredEvents) }
        if recentStrideSpeeds.count > maxStoredEvents { recentStrideSpeeds.removeFirst(recentStrideSpeeds.count - maxStoredEvents) }
    }

    private func avg(_ arr: [Double]) -> Double? { guard !arr.isEmpty else { return nil }; return arr.reduce(0,+)/Double(arr.count) }
    private func coefficientOfVariation(_ arr: [Double]) -> Double? {
        guard let mean = avg(arr), mean > 0, arr.count > 1 else { return nil }
        let variance = arr.reduce(0) { $0 + pow($1 - mean, 2) } / Double(arr.count - 1)
        return sqrt(variance) / mean
    }
    private func asymmetryPercent(left: Double?, right: Double?) -> Double? {
        guard let l = left, let r = right, (l + r) > 0 else { return nil }
        return abs(l - r) / ((l + r)/2) * 100
    }
    private func pairwiseIntervals(_ times: [TimeInterval]) -> [Double] {
        guard times.count > 1 else { return [] }
        return zip(times.dropFirst(), times).map { $0 - $1 }
    }
    private func isOutlier(_ length: Double) -> Bool {
        if length < physiologicMin || length > physiologicMax { return true }
        guard rawStepLengths.count >= 6 else { return false }
        let mean = rawStepLengths.reduce(0,+)/Double(rawStepLengths.count)
        let varSum = rawStepLengths.reduce(0){ $0 + pow($1-mean,2) }
        let std = sqrt(varSum / Double(rawStepLengths.count))
        return abs(length - mean) > 3 * std
    }
}
