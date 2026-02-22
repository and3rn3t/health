//
//  NormativeData.swift
//  Andernet Posture
//
//  Age- and sex-stratified normative reference tables for gait and posture parameters.
//  Used to color-code measurements against population norms.
//

import Foundation
import HealthKit

// MARK: - Normative Metric

enum NormativeMetric: String, CaseIterable, Sendable {
    case gaitSpeed
    case cadence
    case strideLength
    case craniovertebralAngle
    case thoracicKyphosis
}

// MARK: - Normative Band

/// A single normative range for a specific age/sex/metric combination.
struct NormativeBand: Sendable {
    let metric: NormativeMetric
    let ageRange: ClosedRange<Int>
    let sex: HKBiologicalSex      // .male, .female, or .notSet for combined
    let normalRange: ClosedRange<Double>
    let mildLow: Double?          // below-normal mild boundary
    let mildHigh: Double?         // above-normal mild boundary
}

// MARK: - Lookup

enum NormativeData {

    /// Look up the normal range for a given metric, age, and sex.
    /// Falls back to nearest available age band if exact match not found.
    static func normalRange(
        for metric: NormativeMetric,
        age: Int?,
        sex: HKBiologicalSex = .notSet
    ) -> ClosedRange<Double>? {
        let table = bands(for: metric)
        guard let age else { return table.first?.normalRange }

        // Prefer sex-matched first, then fall back to any sex match
        let sexMatched = table.filter { $0.sex == sex || $0.sex == .notSet }
        let pool = sexMatched.isEmpty ? table : sexMatched

        if let exact = pool.first(where: { $0.ageRange.contains(age) }) {
            return exact.normalRange
        }
        // Nearest age band
        return pool.min(by: { abs(midpoint($0.ageRange) - age) < abs(midpoint($1.ageRange) - age) })?.normalRange
    }

    /// Classify a value relative to its normative range.
    static func classify(
        value: Double,
        metric: NormativeMetric,
        age: Int?,
        sex: HKBiologicalSex = .notSet
    ) -> ClinicalSeverity {
        guard let range = normalRange(for: metric, age: age, sex: sex) else { return .normal }

        if range.contains(value) { return .normal }

        let deviation: Double
        if value < range.lowerBound {
            deviation = range.lowerBound - value
        } else {
            deviation = value - range.upperBound
        }

        let span = range.upperBound - range.lowerBound
        let relativeDeviation = span > 0 ? deviation / span : deviation

        if relativeDeviation <= 0.25 { return .mild }
        if relativeDeviation <= 0.75 { return .moderate }
        return .severe
    }

    // MARK: - Tables

    /// Gait speed normative data by age decade and sex.
    /// Ref: Bohannon RW & Williams Andrews A, Age & Ageing, 2011.
    private static func gaitSpeedBands() -> [NormativeBand] {
        [
            NormativeBand(metric: .gaitSpeed, ageRange: 20...29, sex: .male, normalRange: 1.10...1.36, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 20...29, sex: .female, normalRange: 1.10...1.34, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 30...39, sex: .male, normalRange: 1.10...1.43, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 30...39, sex: .female, normalRange: 1.10...1.34, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 40...49, sex: .male, normalRange: 1.10...1.43, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 40...49, sex: .female, normalRange: 1.10...1.39, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 50...59, sex: .male, normalRange: 1.00...1.31, mildLow: 0.8, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 50...59, sex: .female, normalRange: 1.00...1.27, mildLow: 0.8, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 60...69, sex: .male, normalRange: 1.00...1.24, mildLow: 0.8, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 60...69, sex: .female, normalRange: 1.00...1.24, mildLow: 0.8, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 70...79, sex: .male, normalRange: 0.90...1.13, mildLow: 0.7, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 70...79, sex: .female, normalRange: 0.90...1.13, mildLow: 0.7, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 80...99, sex: .male, normalRange: 0.70...0.94, mildLow: 0.5, mildHigh: nil),
            NormativeBand(metric: .gaitSpeed, ageRange: 80...99, sex: .female, normalRange: 0.70...0.94, mildLow: 0.5, mildHigh: nil)
        ]
    }

    /// Cadence normative data.
    /// Ref: Hollman JH et al., Gait & Posture, 2011.
    private static func cadenceBands() -> [NormativeBand] {
        [
            NormativeBand(metric: .cadence, ageRange: 20...39, sex: .male, normalRange: 112...120, mildLow: 95, mildHigh: 135),
            NormativeBand(metric: .cadence, ageRange: 20...39, sex: .female, normalRange: 115...125, mildLow: 100, mildHigh: 140),
            NormativeBand(metric: .cadence, ageRange: 40...59, sex: .male, normalRange: 105...115, mildLow: 90, mildHigh: 130),
            NormativeBand(metric: .cadence, ageRange: 40...59, sex: .female, normalRange: 110...120, mildLow: 95, mildHigh: 135),
            NormativeBand(metric: .cadence, ageRange: 60...79, sex: .male, normalRange: 98...110, mildLow: 80, mildHigh: 125),
            NormativeBand(metric: .cadence, ageRange: 60...79, sex: .female, normalRange: 100...115, mildLow: 85, mildHigh: 130)
        ]
    }

    /// Stride length normative data (meters).
    /// Ref: Oberg T et al., J Rehab Res Dev, 1993.
    private static func strideLengthBands() -> [NormativeBand] {
        [
            NormativeBand(metric: .strideLength, ageRange: 20...29, sex: .male, normalRange: 1.25...1.46, mildLow: 1.0, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 20...29, sex: .female, normalRange: 1.10...1.28, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 30...39, sex: .male, normalRange: 1.22...1.46, mildLow: 1.0, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 30...39, sex: .female, normalRange: 1.08...1.28, mildLow: 0.88, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 40...49, sex: .male, normalRange: 1.20...1.44, mildLow: 1.0, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 40...49, sex: .female, normalRange: 1.05...1.26, mildLow: 0.85, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 60...69, sex: .male, normalRange: 1.10...1.32, mildLow: 0.9, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 60...69, sex: .female, normalRange: 0.95...1.18, mildLow: 0.75, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 70...79, sex: .male, normalRange: 1.00...1.22, mildLow: 0.8, mildHigh: nil),
            NormativeBand(metric: .strideLength, ageRange: 70...79, sex: .female, normalRange: 0.85...1.08, mildLow: 0.65, mildHigh: nil)
        ]
    }

    /// CVA normative data (degrees).
    /// Ref: Nemmers TM et al., J Geriatr Phys Ther, 2009; Yip CH et al., 2008.
    private static func cvaBands() -> [NormativeBand] {
        [
            NormativeBand(metric: .craniovertebralAngle, ageRange: 20...39, sex: .notSet, normalRange: 48...56, mildLow: 40, mildHigh: nil),
            NormativeBand(metric: .craniovertebralAngle, ageRange: 40...59, sex: .notSet, normalRange: 44...54, mildLow: 38, mildHigh: nil),
            NormativeBand(metric: .craniovertebralAngle, ageRange: 60...99, sex: .notSet, normalRange: 40...50, mildLow: 35, mildHigh: nil)
        ]
    }

    /// Thoracic kyphosis by age (proxy Cobb equivalent).
    /// Ref: Fon GT et al., Radiology, 1980.
    private static func kyphosisBands() -> [NormativeBand] {
        [
            NormativeBand(metric: .thoracicKyphosis, ageRange: 20...29, sex: .notSet, normalRange: 20...30, mildLow: nil, mildHigh: 40),
            NormativeBand(metric: .thoracicKyphosis, ageRange: 30...49, sex: .notSet, normalRange: 25...40, mildLow: nil, mildHigh: 50),
            NormativeBand(metric: .thoracicKyphosis, ageRange: 50...69, sex: .notSet, normalRange: 30...50, mildLow: nil, mildHigh: 60),
            NormativeBand(metric: .thoracicKyphosis, ageRange: 70...99, sex: .notSet, normalRange: 35...55, mildLow: nil, mildHigh: 65)
        ]
    }

    private static func bands(for metric: NormativeMetric) -> [NormativeBand] {
        switch metric {
        case .gaitSpeed:             return gaitSpeedBands()
        case .cadence:               return cadenceBands()
        case .strideLength:          return strideLengthBands()
        case .craniovertebralAngle:  return cvaBands()
        case .thoracicKyphosis:      return kyphosisBands()
        }
    }

    private static func midpoint(_ range: ClosedRange<Int>) -> Int {
        (range.lowerBound + range.upperBound) / 2
    }
}
