#!/usr/bin/env swift
//
//  generate_training_data.swift
//  Andernet Posture – ML Training Data Generator
//
//  Generates Create ML–compatible JSON training datasets using
//  knowledge distillation from the app's rule-based analyzers.
//  Each dataset replicates the exact scoring logic from its
//  corresponding Default* analyzer, producing labeled samples
//  that can train CoreML tabular/classifier models.
//
//  Usage:
//      swift MLTraining/generate_training_data.swift
//
//  Output (in MLTraining/Data/):
//      - GaitPatternClassifier_training.json   (10,000 samples)
//      - PostureScorer_training.json           (10,000 samples)
//      - FallRiskPredictor_training.json       (10,000 samples)
//      - CrossedSyndromeDetector_training.json (10,000 samples)
//      - FatiguePredictor_training.json        ( 5,000 samples)
//
//  These JSON files can be dragged directly into Create ML:
//      1. Open Create ML → New Document → Tabular Regressor/Classifier
//      2. Set the "target" column to the label/score field
//      3. Train, evaluate, export .mlmodel
//      4. Compile to .mlmodelc and add to the app bundle
//

import Foundation

// MARK: - Utilities

/// Seeded random number generator for reproducible datasets.
struct SeededRNG: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) { state = seed }

    mutating func next() -> UInt64 {
        // xorshift64
        state ^= state << 13
        state ^= state >> 7
        state ^= state << 17
        return state
    }
}

var rng = SeededRNG(seed: 42)

/// Random Double in range.
func randomDouble(in range: ClosedRange<Double>) -> Double {
    let raw = Double(rng.next() % 1_000_000) / 1_000_000.0
    return range.lowerBound + raw * (range.upperBound - range.lowerBound)
}

/// Normal distribution via Box-Muller transform.
func randomNormal(mean: Double, sd: Double) -> Double {
    let u1 = max(1e-10, randomDouble(in: 0...1))
    let u2 = randomDouble(in: 0...1)
    let z = (-2.0 * log(u1)).squareRoot() * cos(2.0 * .pi * u2)
    return mean + sd * z
}

/// Clamp a value to a range.
func clamp(_ value: Double, _ lo: Double, _ hi: Double) -> Double {
    min(hi, max(lo, value))
}

/// Optional value — returns nil with given probability.
func optionalValue(_ value: Double, nilProbability: Double = 0.15) -> Double? {
    randomDouble(in: 0...1) < nilProbability ? nil : value
}

/// Linear regression on an index-based series [0, 1, 2, ...].
func linearRegression(_ ys: [Double]) -> (slope: Double, intercept: Double, rSquared: Double) {
    let n = Double(ys.count)
    guard n >= 2 else { return (0, ys.first ?? 0, 0) }

    var sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0
    for (i, y) in ys.enumerated() {
        let x = Double(i)
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
    }

    let denom = n * sumX2 - sumX * sumX
    guard abs(denom) > 1e-12 else { return (0, sumY / n, 0) }

    let slope = (n * sumXY - sumX * sumY) / denom
    let intercept = (sumY - slope * sumX) / n

    let meanY = sumY / n
    var ssTot = 0.0, ssRes = 0.0
    for (i, y) in ys.enumerated() {
        ssTot += (y - meanY) * (y - meanY)
        let predicted = intercept + slope * Double(i)
        ssRes += (y - predicted) * (y - predicted)
    }

    let r2 = ssTot > 1e-12 ? max(0, 1.0 - ssRes / ssTot) : 0
    return (slope, intercept, r2)
}

/// Standard deviation (Bessel-corrected, n-1).
func standardDeviation(_ values: [Double]) -> Double {
    guard values.count >= 2 else { return 0 }
    let mean = values.reduce(0, +) / Double(values.count)
    let variance = values.map { ($0 - mean) * ($0 - mean) }.reduce(0, +) / Double(values.count - 1)
    return variance.squareRoot()
}

func average(_ values: [Double]) -> Double {
    guard !values.isEmpty else { return 0 }
    return values.reduce(0, +) / Double(values.count)
}

// MARK: - JSON Helpers

func toJSON(_ array: [[String: Any]]) -> Data {
    try! JSONSerialization.data(withJSONObject: array, options: [.prettyPrinted, .sortedKeys])
}

func writeJSON(_ data: Data, to filename: String, outputDir: String) {
    let path = "\(outputDir)/\(filename)"
    FileManager.default.createFile(atPath: path, contents: data)
    print("  ✓ \(filename) — \(data.count / 1024) KB")
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - 1. Gait Pattern Classifier Training Data
// ═══════════════════════════════════════════════════════════════════

/// Replicates DefaultGaitPatternClassifier scoring logic.
func generateGaitPatternData(count: Int) -> [[String: Any]] {
    let patternsToGenerate = [
        "normal", "antalgic", "trendelenburg", "festinating",
        "circumduction", "ataxic", "waddling", "stiffKnee"
    ]
    let samplesPerClass = count / patternsToGenerate.count

    var samples: [[String: Any]] = []

    for targetPattern in patternsToGenerate {
        for _ in 0..<samplesPerClass {
            // Generate biased inputs for each target pattern
            let params = generateGaitParams(biasedToward: targetPattern)

            // Run through classifier logic
            let result = classifyGaitPattern(params)

            var sample: [String: Any] = [:]
            // Features (14)
            sample["stanceTimeLeftPct"] = params.stanceTimeLeftPct
            sample["stanceTimeRightPct"] = params.stanceTimeRightPct
            sample["stepLengthLeftM"] = params.stepLengthLeftM
            sample["stepLengthRightM"] = params.stepLengthRightM
            sample["cadenceSPM"] = params.cadenceSPM
            sample["stepWidthCm"] = params.stepWidthCm
            sample["stepWidthVariabilityCm"] = params.stepWidthVariabilityCm
            sample["pelvicObliquityDeg"] = params.pelvicObliquityDeg
            sample["strideTimeCVPercent"] = params.strideTimeCVPercent
            sample["walkingSpeedMPS"] = params.walkingSpeedMPS
            sample["strideLengthM"] = params.strideLengthM
            sample["hipFlexionROMDeg"] = params.hipFlexionROMDeg
            sample["kneeFlexionROMDeg"] = params.kneeFlexionROMDeg
            sample["armSwingAsymmetryPct"] = params.armSwingAsymmetryPct

            // Target
            sample["label"] = result.primaryPattern
            sample["confidence"] = result.confidence
            // Per-class probabilities for soft targets
            for (pattern, score) in result.patternScores {
                sample["score_\(pattern)"] = score
            }

            samples.append(sample)
        }
    }

    return samples.shuffled(using: &rng)
}

struct GaitParams {
    var stanceTimeLeftPct: Double
    var stanceTimeRightPct: Double
    var stepLengthLeftM: Double
    var stepLengthRightM: Double
    var cadenceSPM: Double
    var stepWidthCm: Double
    var stepWidthVariabilityCm: Double
    var pelvicObliquityDeg: Double
    var strideTimeCVPercent: Double
    var walkingSpeedMPS: Double
    var strideLengthM: Double
    var hipFlexionROMDeg: Double
    var kneeFlexionROMDeg: Double
    var armSwingAsymmetryPct: Double
}

func generateGaitParams(biasedToward pattern: String) -> GaitParams {
    // Normal baseline ranges
    var p = GaitParams(
        stanceTimeLeftPct: randomNormal(mean: 60, sd: 3),
        stanceTimeRightPct: randomNormal(mean: 60, sd: 3),
        stepLengthLeftM: randomNormal(mean: 0.65, sd: 0.08),
        stepLengthRightM: randomNormal(mean: 0.65, sd: 0.08),
        cadenceSPM: randomNormal(mean: 110, sd: 12),
        stepWidthCm: randomNormal(mean: 10, sd: 2),
        stepWidthVariabilityCm: randomNormal(mean: 1.5, sd: 0.5),
        pelvicObliquityDeg: randomNormal(mean: 0, sd: 2),
        strideTimeCVPercent: randomNormal(mean: 3, sd: 1),
        walkingSpeedMPS: randomNormal(mean: 1.2, sd: 0.15),
        strideLengthM: randomNormal(mean: 1.3, sd: 0.15),
        hipFlexionROMDeg: randomNormal(mean: 35, sd: 5),
        kneeFlexionROMDeg: randomNormal(mean: 60, sd: 8),
        armSwingAsymmetryPct: randomNormal(mean: 8, sd: 4)
    )

    // Bias toward target pattern
    switch pattern {
    case "antalgic":
        let asymmetry = randomNormal(mean: 12, sd: 4)
        p.stanceTimeLeftPct = 60 - asymmetry / 2
        p.stanceTimeRightPct = 60 + asymmetry / 2
        p.stepLengthLeftM = randomNormal(mean: 0.50, sd: 0.08)
        p.walkingSpeedMPS = randomNormal(mean: 0.65, sd: 0.12)

    case "trendelenburg":
        p.pelvicObliquityDeg = randomNormal(mean: 9, sd: 3)
        let asymmetry = randomNormal(mean: 7, sd: 2)
        p.stanceTimeLeftPct = 60 - asymmetry / 2
        p.stanceTimeRightPct = 60 + asymmetry / 2

    case "festinating":
        p.cadenceSPM = randomNormal(mean: 160, sd: 15)
        p.strideLengthM = randomNormal(mean: 0.35, sd: 0.10)
        p.armSwingAsymmetryPct = randomNormal(mean: 30, sd: 8)

    case "ataxic":
        p.stepWidthCm = randomNormal(mean: 20, sd: 4)
        p.stepWidthVariabilityCm = randomNormal(mean: 5, sd: 1.5)
        p.strideTimeCVPercent = randomNormal(mean: 12, sd: 3)

    case "waddling":
        p.pelvicObliquityDeg = randomNormal(mean: 12, sd: 3)
        p.stepWidthCm = randomNormal(mean: 17, sd: 3)
        p.stanceTimeLeftPct = randomNormal(mean: 65, sd: 2)
        p.stanceTimeRightPct = randomNormal(mean: 65, sd: 2)

    case "circumduction":
        p.hipFlexionROMDeg = randomNormal(mean: 18, sd: 5)
        p.stepWidthCm = randomNormal(mean: 16, sd: 3)
        p.walkingSpeedMPS = randomNormal(mean: 0.55, sd: 0.10)

    case "stiffKnee":
        p.kneeFlexionROMDeg = randomNormal(mean: 35, sd: 8)
        p.hipFlexionROMDeg = randomNormal(mean: 20, sd: 5)
        p.walkingSpeedMPS = randomNormal(mean: 0.60, sd: 0.12)

    default: // normal — use baseline
        break
    }

    // Clamp to realistic ranges
    p.stanceTimeLeftPct = clamp(p.stanceTimeLeftPct, 40, 85)
    p.stanceTimeRightPct = clamp(p.stanceTimeRightPct, 40, 85)
    p.stepLengthLeftM = clamp(p.stepLengthLeftM, 0.1, 1.0)
    p.stepLengthRightM = clamp(p.stepLengthRightM, 0.1, 1.0)
    p.cadenceSPM = clamp(p.cadenceSPM, 40, 200)
    p.stepWidthCm = clamp(p.stepWidthCm, 3, 35)
    p.stepWidthVariabilityCm = clamp(p.stepWidthVariabilityCm, 0.2, 10)
    p.pelvicObliquityDeg = clamp(p.pelvicObliquityDeg, -15, 15)
    p.strideTimeCVPercent = clamp(p.strideTimeCVPercent, 0.5, 25)
    p.walkingSpeedMPS = clamp(p.walkingSpeedMPS, 0.1, 2.0)
    p.strideLengthM = clamp(p.strideLengthM, 0.15, 2.0)
    p.hipFlexionROMDeg = clamp(p.hipFlexionROMDeg, 5, 60)
    p.kneeFlexionROMDeg = clamp(p.kneeFlexionROMDeg, 10, 80)
    p.armSwingAsymmetryPct = clamp(p.armSwingAsymmetryPct, 0, 60)

    return p
}

struct GaitClassResult {
    let primaryPattern: String
    let confidence: Double
    let patternScores: [String: Double]
}

func classifyGaitPattern(_ p: GaitParams) -> GaitClassResult {
    let stanceAsymmetry = abs(p.stanceTimeLeftPct - p.stanceTimeRightPct)
    let stepLengthAsymmetry = abs(p.stepLengthLeftM - p.stepLengthRightM)

    // Antalgic
    var antalgic = 0.0
    if stanceAsymmetry > 5 { antalgic += min(1, stanceAsymmetry / 15) * 0.5 }
    if stepLengthAsymmetry > 0.05 { antalgic += min(1, stepLengthAsymmetry / 0.15) * 0.3 }
    if p.walkingSpeedMPS < 0.8 { antalgic += 0.2 }

    // Trendelenburg
    var trendelenburg = 0.0
    if abs(p.pelvicObliquityDeg) > 5 { trendelenburg += min(1, abs(p.pelvicObliquityDeg) / 12) * 0.7 }
    if stanceAsymmetry > 3 && stanceAsymmetry < 15 { trendelenburg += 0.3 }

    // Festinating
    var festinating = 0.0
    if p.cadenceSPM > 140 { festinating += min(1, (p.cadenceSPM - 140) / 40) * 0.4 }
    if p.strideLengthM < 0.5 { festinating += min(1, (0.5 - p.strideLengthM) / 0.3) * 0.4 }
    if p.armSwingAsymmetryPct > 20 { festinating += 0.2 }

    // Ataxic
    var ataxic = 0.0
    if p.stepWidthCm > 15 { ataxic += min(1, (p.stepWidthCm - 15) / 10) * 0.4 }
    if p.stepWidthVariabilityCm > 3 { ataxic += min(1, (p.stepWidthVariabilityCm - 3) / 4) * 0.3 }
    if p.strideTimeCVPercent > 8 { ataxic += min(1, (p.strideTimeCVPercent - 8) / 10) * 0.3 }

    // Waddling
    var waddling = 0.0
    if abs(p.pelvicObliquityDeg) > 8 { waddling += 0.5 }
    if p.stepWidthCm > 13 { waddling += 0.3 }
    if stanceAsymmetry < 3 && (p.stanceTimeLeftPct > 63 || p.stanceTimeRightPct > 63) { waddling += 0.2 }

    // Circumduction
    var circumduction = 0.0
    if p.hipFlexionROMDeg < 25 { circumduction += min(1, (25 - p.hipFlexionROMDeg) / 15) * 0.5 }
    if p.stepWidthCm > 13 { circumduction += 0.3 }
    if p.walkingSpeedMPS < 0.7 { circumduction += 0.2 }

    // Stiff Knee
    var stiffKnee = 0.0
    if p.kneeFlexionROMDeg < 50 { stiffKnee += min(1, (50 - p.kneeFlexionROMDeg) / 30) * 0.5 }
    if p.hipFlexionROMDeg < 25 { stiffKnee += 0.2 }
    if p.walkingSpeedMPS < 0.8 { stiffKnee += 0.2 }
    if circumduction > 0.3 { stiffKnee += 0.1 }

    // Normal
    let maxPathological = max(antalgic, trendelenburg, festinating, ataxic, waddling, circumduction, stiffKnee)
    let normal = max(0, 1.0 - maxPathological)

    let scores: [String: Double] = [
        "normal": normal,
        "antalgic": antalgic,
        "trendelenburg": trendelenburg,
        "festinating": festinating,
        "ataxic": ataxic,
        "waddling": waddling,
        "circumduction": circumduction,
        "stiffKnee": stiffKnee
    ]

    let primary = scores.max(by: { $0.value < $1.value })!
    return GaitClassResult(
        primaryPattern: primary.key,
        confidence: primary.value,
        patternScores: scores
    )
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - 2. Posture Scorer Training Data
// ═══════════════════════════════════════════════════════════════════

func generatePostureScorerData(count: Int) -> [[String: Any]] {
    var samples: [[String: Any]] = []

    // Generate samples across severity spectrum
    let profiles: [(String, Double)] = [
        ("ideal", 0.35),     // 35% ideal posture
        ("mild", 0.25),      // 25% mild deviations
        ("moderate", 0.25),  // 25% moderate
        ("severe", 0.15)     // 15% severe
    ]

    for (profile, fraction) in profiles {
        let n = Int(Double(count) * fraction)
        for _ in 0..<n {
            let raw = generatePostureMetrics(severity: profile)

            // Compute normalized ML features (CoreMLPostureAnalyzer format)
            let f0 = normalizeAngle(raw.cvaDeg, ideal: 52, maxDev: 20)
            let f1 = normalizeSVA(raw.svaCm)
            let f2 = normalizeAngle(abs(raw.sagittalLeanDeg), ideal: 0, maxDev: 15)
            let f3 = normalizeAngle(abs(raw.frontalLeanDeg), ideal: 0, maxDev: 10)
            let f4 = normalizeDistance(abs(raw.shoulderAsymmetryCm), maxDev: 5)
            let f5 = normalizeAngle(raw.kyphosisDeg, ideal: 35, maxDev: 25)
            let f6 = normalizeAngle(abs(raw.pelvicObliquityDeg), ideal: 0, maxDev: 8)
            let f7 = normalizeAngle(raw.lordosisDeg, ideal: 45, maxDev: 25)
            let f8 = normalizeDistance(abs(raw.coronalDeviationCm), maxDev: 4)

            // Compute composite score (DefaultPostureAnalyzer weights)
            let subScores = [
                postureSubScore(raw.cvaDeg, ideal: 52.5, maxDev: 25),
                postureSubScore(abs(raw.svaCm), ideal: 0, maxDev: 12),
                postureSubScore(abs(raw.sagittalLeanDeg), ideal: 0, maxDev: 25),
                postureSubScore(abs(raw.frontalLeanDeg), ideal: 0, maxDev: 15),
                postureSubScore(abs(raw.shoulderAsymmetryCm), ideal: 0, maxDev: 6),
                postureSubScore(raw.kyphosisDeg, ideal: 32.5, maxDev: 40),
                postureSubScore(abs(raw.pelvicObliquityDeg), ideal: 0, maxDev: 8),
                postureSubScore(raw.lordosisDeg, ideal: 50, maxDev: 35),
                postureSubScore(abs(raw.coronalDeviationCm), ideal: 0, maxDev: 6)
            ]
            let weights = [0.22, 0.22, 0.13, 0.08, 0.08, 0.10, 0.05, 0.07, 0.05]
            let composite = clamp(zip(subScores, weights).map(*).reduce(0, +), 0, 100)

            // Classify Kendall type
            let kendall = classifyKendall(
                kyphosis: raw.kyphosisDeg, lordosis: raw.lordosisDeg,
                headForward: raw.headForwardCm, shoulderForward: raw.shoulderForwardCm,
                pelvicTilt: raw.pelvicTiltDeg
            )

            var sample: [String: Any] = [:]
            // 9 ML features
            sample["f_cva"] = round(f0 * 100) / 100
            sample["f_sva"] = round(f1 * 100) / 100
            sample["f_trunkLean"] = round(f2 * 100) / 100
            sample["f_lateralLean"] = round(f3 * 100) / 100
            sample["f_shoulderAsym"] = round(f4 * 100) / 100
            sample["f_kyphosis"] = round(f5 * 100) / 100
            sample["f_pelvicObliq"] = round(f6 * 100) / 100
            sample["f_lordosis"] = round(f7 * 100) / 100
            sample["f_coronalDev"] = round(f8 * 100) / 100
            // Raw metrics (useful for analysis)
            sample["raw_cvaDeg"] = round(raw.cvaDeg * 10) / 10
            sample["raw_svaCm"] = round(raw.svaCm * 10) / 10
            sample["raw_kyphosisDeg"] = round(raw.kyphosisDeg * 10) / 10
            sample["raw_lordosisDeg"] = round(raw.lordosisDeg * 10) / 10
            // Targets
            sample["compositeScore"] = round(composite * 10) / 10
            sample["kendallType"] = kendall

            samples.append(sample)
        }
    }

    return samples.shuffled(using: &rng)
}

struct RawPostureMetrics {
    var cvaDeg: Double
    var svaCm: Double
    var sagittalLeanDeg: Double
    var frontalLeanDeg: Double
    var shoulderAsymmetryCm: Double
    var kyphosisDeg: Double
    var pelvicObliquityDeg: Double
    var lordosisDeg: Double
    var coronalDeviationCm: Double
    // For Kendall classification
    var headForwardCm: Double
    var shoulderForwardCm: Double
    var pelvicTiltDeg: Double
}

func generatePostureMetrics(severity: String) -> RawPostureMetrics {
    switch severity {
    case "ideal":
        return RawPostureMetrics(
            cvaDeg: randomNormal(mean: 52, sd: 3),
            svaCm: randomNormal(mean: 0, sd: 1.5),
            sagittalLeanDeg: randomNormal(mean: 0, sd: 2),
            frontalLeanDeg: randomNormal(mean: 0, sd: 1),
            shoulderAsymmetryCm: randomNormal(mean: 0, sd: 0.5),
            kyphosisDeg: randomNormal(mean: 33, sd: 5),
            pelvicObliquityDeg: randomNormal(mean: 0, sd: 0.5),
            lordosisDeg: randomNormal(mean: 50, sd: 5),
            coronalDeviationCm: randomNormal(mean: 0, sd: 0.3),
            headForwardCm: randomNormal(mean: 1, sd: 0.8),
            shoulderForwardCm: randomNormal(mean: 0.5, sd: 0.5),
            pelvicTiltDeg: randomNormal(mean: 5, sd: 3)
        )
    case "mild":
        return RawPostureMetrics(
            cvaDeg: randomNormal(mean: 44, sd: 4),
            svaCm: randomNormal(mean: 4, sd: 2),
            sagittalLeanDeg: randomNormal(mean: 7, sd: 3),
            frontalLeanDeg: randomNormal(mean: 3, sd: 2),
            shoulderAsymmetryCm: randomNormal(mean: 2, sd: 1),
            kyphosisDeg: randomNormal(mean: 48, sd: 6),
            pelvicObliquityDeg: randomNormal(mean: 2, sd: 1.5),
            lordosisDeg: randomNormal(mean: 62, sd: 6),
            coronalDeviationCm: randomNormal(mean: 1.2, sd: 0.5),
            headForwardCm: randomNormal(mean: 3.5, sd: 1),
            shoulderForwardCm: randomNormal(mean: 2.5, sd: 1),
            pelvicTiltDeg: randomNormal(mean: 8, sd: 4)
        )
    case "moderate":
        return RawPostureMetrics(
            cvaDeg: randomNormal(mean: 36, sd: 5),
            svaCm: randomNormal(mean: 7, sd: 2),
            sagittalLeanDeg: randomNormal(mean: 14, sd: 4),
            frontalLeanDeg: randomNormal(mean: 6, sd: 3),
            shoulderAsymmetryCm: randomNormal(mean: 3.5, sd: 1.5),
            kyphosisDeg: randomNormal(mean: 58, sd: 8),
            pelvicObliquityDeg: randomNormal(mean: 4, sd: 2),
            lordosisDeg: randomNormal(mean: 72, sd: 8),
            coronalDeviationCm: randomNormal(mean: 2.5, sd: 0.8),
            headForwardCm: randomNormal(mean: 5, sd: 1.5),
            shoulderForwardCm: randomNormal(mean: 4, sd: 1.5),
            pelvicTiltDeg: randomNormal(mean: 14, sd: 5)
        )
    default: // severe
        return RawPostureMetrics(
            cvaDeg: randomNormal(mean: 26, sd: 5),
            svaCm: randomNormal(mean: 11, sd: 3),
            sagittalLeanDeg: randomNormal(mean: 22, sd: 5),
            frontalLeanDeg: randomNormal(mean: 10, sd: 4),
            shoulderAsymmetryCm: randomNormal(mean: 5.5, sd: 2),
            kyphosisDeg: randomNormal(mean: 72, sd: 10),
            pelvicObliquityDeg: randomNormal(mean: 6, sd: 3),
            lordosisDeg: randomNormal(mean: 82, sd: 10),
            coronalDeviationCm: randomNormal(mean: 4, sd: 1.5),
            headForwardCm: randomNormal(mean: 7, sd: 2),
            shoulderForwardCm: randomNormal(mean: 6, sd: 2),
            pelvicTiltDeg: randomNormal(mean: 20, sd: 6)
        )
    }
}

func postureSubScore(_ measured: Double, ideal: Double, maxDev: Double) -> Double {
    clamp(100 * (1 - abs(measured - ideal) / maxDev), 0, 100)
}

func normalizeAngle(_ value: Double, ideal: Double, maxDev: Double) -> Double {
    clamp((1 - abs(value - ideal) / maxDev) * 100, 0, 100)
}

func normalizeSVA(_ cm: Double) -> Double {
    clamp((1 - abs(cm) / 8) * 100, 0, 100)
}

func normalizeDistance(_ cm: Double, maxDev: Double) -> Double {
    clamp((1 - abs(cm) / maxDev) * 100, 0, 100)
}

func classifyKendall(kyphosis: Double, lordosis: Double,
                     headForward: Double, shoulderForward: Double,
                     pelvicTilt: Double) -> String {
    let forwardHead = headForward > 3
    let forwardShoulder = shoulderForward > 2
    let highKyphosis = kyphosis > 45
    let highLordosis = lordosis > 55
    let lowLordosis = lordosis < 35
    let posteriorPelvic = pelvicTilt < -5

    if forwardHead && forwardShoulder && highKyphosis && highLordosis {
        return "kyphosisLordosis"
    } else if lowLordosis && !highKyphosis {
        return "flatBack"
    } else if forwardHead && (posteriorPelvic || lowLordosis) && !forwardShoulder {
        return "swayBack"
    } else {
        return "ideal"
    }
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - 3. Fall Risk Predictor Training Data
// ═══════════════════════════════════════════════════════════════════

func generateFallRiskData(count: Int) -> [[String: Any]] {
    var samples: [[String: Any]] = []

    // Generate across risk spectrum
    let profiles: [(String, Double)] = [
        ("low", 0.35), ("moderate", 0.35), ("high", 0.30)
    ]

    for (profile, fraction) in profiles {
        let n = Int(Double(count) * fraction)
        for _ in 0..<n {
            let params = generateFallRiskParams(riskProfile: profile)

            // Run through scoring logic
            let result = scoreFallRisk(params)

            var sample: [String: Any] = [:]
            // Features (8) — use sentinel -1 for nil
            sample["walkingSpeedMPS"] = params.walkingSpeedMPS ?? -1
            sample["strideTimeCVPercent"] = params.strideTimeCVPercent ?? -1
            sample["doubleSupportPercent"] = params.doubleSupportPercent ?? -1
            sample["stepWidthVariabilityCm"] = params.stepWidthVariabilityCm ?? -1
            sample["swayVelocityMMS"] = params.swayVelocityMMS ?? -1
            sample["stepAsymmetryPercent"] = params.stepAsymmetryPercent ?? -1
            sample["tugTimeSec"] = params.tugTimeSec ?? -1
            sample["footClearanceM"] = params.footClearanceM ?? -1
            // Targets
            sample["riskScore"] = round(result.score * 10) / 10
            sample["riskLevel"] = result.level

            samples.append(sample)
        }
    }

    return samples.shuffled(using: &rng)
}

struct FallRiskParams {
    var walkingSpeedMPS: Double?
    var strideTimeCVPercent: Double?
    var doubleSupportPercent: Double?
    var stepWidthVariabilityCm: Double?
    var swayVelocityMMS: Double?
    var stepAsymmetryPercent: Double?
    var tugTimeSec: Double?
    var footClearanceM: Double?
}

func generateFallRiskParams(riskProfile: String) -> FallRiskParams {
    switch riskProfile {
    case "low":
        return FallRiskParams(
            walkingSpeedMPS: optionalValue(randomNormal(mean: 1.2, sd: 0.15)),
            strideTimeCVPercent: optionalValue(randomNormal(mean: 2.5, sd: 1)),
            doubleSupportPercent: optionalValue(randomNormal(mean: 22, sd: 3)),
            stepWidthVariabilityCm: optionalValue(randomNormal(mean: 1.2, sd: 0.5)),
            swayVelocityMMS: optionalValue(randomNormal(mean: 12, sd: 5)),
            stepAsymmetryPercent: optionalValue(randomNormal(mean: 4, sd: 2)),
            tugTimeSec: optionalValue(randomNormal(mean: 8, sd: 2)),
            footClearanceM: optionalValue(randomNormal(mean: 0.04, sd: 0.01))
        )
    case "moderate":
        return FallRiskParams(
            walkingSpeedMPS: optionalValue(randomNormal(mean: 0.85, sd: 0.15)),
            strideTimeCVPercent: optionalValue(randomNormal(mean: 5.5, sd: 2)),
            doubleSupportPercent: optionalValue(randomNormal(mean: 30, sd: 5)),
            stepWidthVariabilityCm: optionalValue(randomNormal(mean: 2.8, sd: 1)),
            swayVelocityMMS: optionalValue(randomNormal(mean: 22, sd: 7)),
            stepAsymmetryPercent: optionalValue(randomNormal(mean: 10, sd: 4)),
            tugTimeSec: optionalValue(randomNormal(mean: 12, sd: 3)),
            footClearanceM: optionalValue(randomNormal(mean: 0.025, sd: 0.008))
        )
    default: // high
        return FallRiskParams(
            walkingSpeedMPS: optionalValue(randomNormal(mean: 0.55, sd: 0.15)),
            strideTimeCVPercent: optionalValue(randomNormal(mean: 9, sd: 3)),
            doubleSupportPercent: optionalValue(randomNormal(mean: 40, sd: 7)),
            stepWidthVariabilityCm: optionalValue(randomNormal(mean: 4.5, sd: 1.5)),
            swayVelocityMMS: optionalValue(randomNormal(mean: 35, sd: 10)),
            stepAsymmetryPercent: optionalValue(randomNormal(mean: 18, sd: 6)),
            tugTimeSec: optionalValue(randomNormal(mean: 18, sd: 5)),
            footClearanceM: optionalValue(randomNormal(mean: 0.012, sd: 0.005))
        )
    }
}

struct FallRiskResult {
    let score: Double
    let level: String
}

func scoreFallRisk(_ p: FallRiskParams) -> FallRiskResult {
    struct Factor {
        let score: Double
        let weight: Double
        let isRisk: Bool
    }

    var factors: [Factor] = []

    // Gait speed
    if let v = p.walkingSpeedMPS {
        let s: Double
        if v < 0.8 { s = min(100, (1 - v / 0.8) * 100) }
        else { s = max(0, (1 - (v - 0.8) / 0.6) * 30) }
        factors.append(Factor(score: s, weight: 0.25, isRisk: s >= 50))
    }

    // Stride time CV
    if let cv = p.strideTimeCVPercent {
        let s: Double
        if cv > 5 { s = min(100, (cv - 5) / 5 * 100 + 50) }
        else { s = cv / 5 * 50 }
        factors.append(Factor(score: s, weight: 0.20, isRisk: s >= 50))
    }

    // Double support
    if let ds = p.doubleSupportPercent {
        let s: Double
        if ds > 30 { s = min(100, (ds - 30) / 20 * 100 + 50) }
        else { s = max(0, (ds - 20) / 10 * 50) }
        factors.append(Factor(score: s, weight: 0.10, isRisk: s >= 50))
    }

    // Step width variability
    if let sw = p.stepWidthVariabilityCm {
        let s: Double
        if sw > 2.5 { s = min(100, (sw - 2.5) / 2.5 * 100 + 50) }
        else { s = sw / 2.5 * 50 }
        factors.append(Factor(score: s, weight: 0.10, isRisk: s >= 50))
    }

    // Trunk sway
    if let sway = p.swayVelocityMMS {
        let s: Double
        if sway > 25 { s = min(100, (sway - 25) / 25 * 100 + 50) }
        else { s = sway / 25 * 50 }
        factors.append(Factor(score: s, weight: 0.10, isRisk: s >= 50))
    }

    // Step asymmetry
    if let asym = p.stepAsymmetryPercent {
        let s: Double
        if asym > 10 { s = min(100, (asym - 10) / 20 * 100 + 50) }
        else { s = asym / 10 * 50 }
        factors.append(Factor(score: s, weight: 0.10, isRisk: s >= 50))
    }

    // TUG time
    if let tug = p.tugTimeSec {
        let s: Double
        if tug > 13.5 { s = min(100, (tug - 13.5) / 10 * 100 + 50) }
        else { s = tug / 13.5 * 50 }
        factors.append(Factor(score: s, weight: 0.10, isRisk: s >= 50))
    }

    // Foot clearance
    if let fc = p.footClearanceM {
        let s: Double
        if fc < 0.02 { s = min(100, (1 - fc / 0.02) * 100) }
        else { s = max(0, (1 - (fc - 0.02) / 0.05) * 30) }
        factors.append(Factor(score: s, weight: 0.05, isRisk: s >= 50))
    }

    guard !factors.isEmpty else {
        return FallRiskResult(score: 0, level: "low")
    }

    let totalWeight = factors.map(\.weight).reduce(0, +)
    let rawComposite = factors.map { $0.score * $0.weight }.reduce(0, +) / totalWeight
    let coverage = min(1, Double(factors.count) / 3.0)
    let composite = clamp(rawComposite * coverage, 0, 100)
    let riskFactorCount = factors.filter(\.isRisk).count

    let level: String
    if composite >= 60 || riskFactorCount >= 4 { level = "high" }
    else if composite >= 30 || riskFactorCount >= 2 { level = "moderate" }
    else { level = "low" }

    return FallRiskResult(score: composite, level: level)
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - 4. Crossed Syndrome Detector Training Data
// ═══════════════════════════════════════════════════════════════════

func generateCrossedSyndromeData(count: Int) -> [[String: Any]] {
    var samples: [[String: Any]] = []

    // Generate across syndrome spectrum
    let profiles: [(String, Double)] = [
        ("none", 0.30),
        ("upperOnly", 0.20),
        ("lowerOnly", 0.20),
        ("both", 0.15),
        ("borderline", 0.15)
    ]

    for (profile, fraction) in profiles {
        let n = Int(Double(count) * fraction)
        for _ in 0..<n {
            let params = generateCrossedParams(profile: profile)

            // Score using rule-based logic
            let upper = scoreCrossedUpper(params)
            let lower = scoreCrossedLower(params)

            var sample: [String: Any] = [:]
            // Features (7) — sentinel -1 for nil
            sample["craniovertebralAngleDeg"] = round(params.cvaDeg * 10) / 10
            sample["shoulderProtractionCm"] = round(params.shoulderProtractionCm * 10) / 10
            sample["thoracicKyphosisDeg"] = round(params.kyphosisDeg * 10) / 10
            sample["cervicalLordosisDeg"] = params.cervicalLordosisDeg.map { round($0 * 10) / 10 } ?? -1
            sample["pelvicTiltDeg"] = round(params.pelvicTiltDeg * 10) / 10
            sample["lumbarLordosisDeg"] = round(params.lordosisDeg * 10) / 10
            sample["hipFlexionRestDeg"] = params.hipFlexionRestDeg.map { round($0 * 10) / 10 } ?? -1
            // Targets
            sample["upperCrossedScore"] = round(upper * 10) / 10
            sample["lowerCrossedScore"] = round(lower * 10) / 10
            sample["hasUpperCrossed"] = upper >= 40 ? "yes" : "no"
            sample["hasLowerCrossed"] = lower >= 40 ? "yes" : "no"

            samples.append(sample)
        }
    }

    return samples.shuffled(using: &rng)
}

struct CrossedParams {
    var cvaDeg: Double
    var shoulderProtractionCm: Double
    var kyphosisDeg: Double
    var cervicalLordosisDeg: Double?
    var pelvicTiltDeg: Double
    var lordosisDeg: Double
    var hipFlexionRestDeg: Double?
}

func generateCrossedParams(profile: String) -> CrossedParams {
    switch profile {
    case "upperOnly":
        return CrossedParams(
            cvaDeg: randomNormal(mean: 38, sd: 5),
            shoulderProtractionCm: randomNormal(mean: 5, sd: 2),
            kyphosisDeg: randomNormal(mean: 55, sd: 8),
            cervicalLordosisDeg: optionalValue(randomNormal(mean: 25, sd: 5)),
            pelvicTiltDeg: randomNormal(mean: 5, sd: 3),
            lordosisDeg: randomNormal(mean: 50, sd: 5),
            hipFlexionRestDeg: optionalValue(randomNormal(mean: 2, sd: 1.5))
        )
    case "lowerOnly":
        return CrossedParams(
            cvaDeg: randomNormal(mean: 52, sd: 4),
            shoulderProtractionCm: randomNormal(mean: 1, sd: 0.5),
            kyphosisDeg: randomNormal(mean: 35, sd: 5),
            cervicalLordosisDeg: optionalValue(randomNormal(mean: 15, sd: 4)),
            pelvicTiltDeg: randomNormal(mean: 18, sd: 5),
            lordosisDeg: randomNormal(mean: 72, sd: 8),
            hipFlexionRestDeg: optionalValue(randomNormal(mean: 12, sd: 4))
        )
    case "both":
        return CrossedParams(
            cvaDeg: randomNormal(mean: 35, sd: 5),
            shoulderProtractionCm: randomNormal(mean: 6, sd: 2),
            kyphosisDeg: randomNormal(mean: 58, sd: 8),
            cervicalLordosisDeg: optionalValue(randomNormal(mean: 28, sd: 5)),
            pelvicTiltDeg: randomNormal(mean: 20, sd: 5),
            lordosisDeg: randomNormal(mean: 75, sd: 8),
            hipFlexionRestDeg: optionalValue(randomNormal(mean: 14, sd: 4))
        )
    case "borderline":
        return CrossedParams(
            cvaDeg: randomNormal(mean: 44, sd: 3),
            shoulderProtractionCm: randomNormal(mean: 3, sd: 1.5),
            kyphosisDeg: randomNormal(mean: 47, sd: 5),
            cervicalLordosisDeg: optionalValue(randomNormal(mean: 20, sd: 4)),
            pelvicTiltDeg: randomNormal(mean: 11, sd: 3),
            lordosisDeg: randomNormal(mean: 61, sd: 5),
            hipFlexionRestDeg: optionalValue(randomNormal(mean: 6, sd: 2))
        )
    default: // none
        return CrossedParams(
            cvaDeg: randomNormal(mean: 52, sd: 3),
            shoulderProtractionCm: randomNormal(mean: 1, sd: 0.5),
            kyphosisDeg: randomNormal(mean: 35, sd: 5),
            cervicalLordosisDeg: optionalValue(randomNormal(mean: 12, sd: 4)),
            pelvicTiltDeg: randomNormal(mean: 5, sd: 3),
            lordosisDeg: randomNormal(mean: 50, sd: 5),
            hipFlexionRestDeg: optionalValue(randomNormal(mean: 2, sd: 1.5))
        )
    }
}

func scoreCrossedUpper(_ p: CrossedParams) -> Double {
    var score = 0.0
    if p.cvaDeg < 45 { score += min(30, (45 - p.cvaDeg) * 2) }
    if p.shoulderProtractionCm > 2 { score += min(25, (p.shoulderProtractionCm - 2) * 5) }
    if p.kyphosisDeg > 45 { score += min(25, (p.kyphosisDeg - 45) * 2) }
    if let cervLord = p.cervicalLordosisDeg, cervLord > 20 { score += min(20, (cervLord - 20) * 2) }
    return min(100, score)
}

func scoreCrossedLower(_ p: CrossedParams) -> Double {
    var score = 0.0
    if p.pelvicTiltDeg > 10 { score += min(35, (p.pelvicTiltDeg - 10) * 3) }
    if p.lordosisDeg > 60 { score += min(35, (p.lordosisDeg - 60) * 2.5) }
    if let hipFlex = p.hipFlexionRestDeg, hipFlex > 5 { score += min(30, (hipFlex - 5) * 3) }
    return min(100, score)
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - 5. Fatigue Predictor Training Data
// ═══════════════════════════════════════════════════════════════════

func generateFatigueData(count: Int) -> [[String: Any]] {
    var samples: [[String: Any]] = []

    let profiles: [(String, Double)] = [
        ("notFatigued", 0.40),
        ("mildFatigue", 0.25),
        ("moderateFatigue", 0.20),
        ("severeFatigue", 0.15)
    ]

    for (profile, fraction) in profiles {
        let n = Int(Double(count) * fraction)
        for _ in 0..<n {
            // Simulate a time-series session, then extract trend features
            let series = generateFatigueTimeSeries(profile: profile)
            let features = extractFatigueFeatures(series)

            var sample: [String: Any] = [:]
            // 8 features (meta-trends)
            sample["postureTrendSlope"] = round(features.postureTrendSlope * 10000) / 10000
            sample["postureTrendR2"] = round(features.postureTrendR2 * 10000) / 10000
            sample["postureVariabilitySD"] = round(features.postureVariabilitySD * 100) / 100
            sample["cadenceTrendSlope"] = round(features.cadenceTrendSlope * 10000) / 10000
            sample["speedTrendSlope"] = round(features.speedTrendSlope * 10000) / 10000
            sample["forwardLeanTrendSlope"] = round(features.forwardLeanTrendSlope * 10000) / 10000
            sample["lateralSwayTrendSlope"] = round(features.lateralSwayTrendSlope * 10000) / 10000
            sample["ruleBasedFatigueIndex"] = round(features.ruleBasedFatigueIndex * 10) / 10
            // Targets
            sample["fatigueIndex"] = round(features.ruleBasedFatigueIndex * 10) / 10
            sample["isFatigued"] = features.isFatigued ? "true" : "false"

            samples.append(sample)
        }
    }

    return samples.shuffled(using: &rng)
}

struct FatigueTimeSeries {
    var postureScores: [Double]
    var trunkLeans: [Double]
    var lateralLeans: [Double]
    var cadences: [Double]
    var speeds: [Double]
}

func generateFatigueTimeSeries(profile: String) -> FatigueTimeSeries {
    // Generate 40–100 time points (at 2-sec intervals = 80–200 sec session)
    let numPoints = Int(randomDouble(in: 40...100))

    var postureScores: [Double] = []
    var trunkLeans: [Double] = []
    var lateralLeans: [Double] = []
    var cadences: [Double] = []
    var speeds: [Double] = []

    // Base values
    let basePosture: Double
    let postureDriftPerPoint: Double
    let postureNoise: Double
    let baseLean: Double
    let leanDrift: Double
    let baseLateral: Double
    let lateralDrift: Double
    let baseCadence: Double
    let cadenceDrift: Double
    let baseSpeed: Double
    let speedDrift: Double

    switch profile {
    case "mildFatigue":
        basePosture = randomNormal(mean: 75, sd: 5)
        postureDriftPerPoint = randomNormal(mean: -0.08, sd: 0.03)
        postureNoise = 3
        baseLean = randomNormal(mean: 4, sd: 1)
        leanDrift = randomNormal(mean: 0.03, sd: 0.01)
        baseLateral = randomNormal(mean: 2, sd: 0.5)
        lateralDrift = randomNormal(mean: 0.01, sd: 0.005)
        baseCadence = randomNormal(mean: 110, sd: 5)
        cadenceDrift = randomNormal(mean: -0.05, sd: 0.02)
        baseSpeed = randomNormal(mean: 1.1, sd: 0.1)
        speedDrift = randomNormal(mean: -0.001, sd: 0.0005)
    case "moderateFatigue":
        basePosture = randomNormal(mean: 70, sd: 5)
        postureDriftPerPoint = randomNormal(mean: -0.18, sd: 0.05)
        postureNoise = 4
        baseLean = randomNormal(mean: 6, sd: 2)
        leanDrift = randomNormal(mean: 0.06, sd: 0.02)
        baseLateral = randomNormal(mean: 3, sd: 1)
        lateralDrift = randomNormal(mean: 0.03, sd: 0.01)
        baseCadence = randomNormal(mean: 105, sd: 5)
        cadenceDrift = randomNormal(mean: -0.12, sd: 0.04)
        baseSpeed = randomNormal(mean: 1.0, sd: 0.1)
        speedDrift = randomNormal(mean: -0.003, sd: 0.001)
    case "severeFatigue":
        basePosture = randomNormal(mean: 65, sd: 5)
        postureDriftPerPoint = randomNormal(mean: -0.35, sd: 0.08)
        postureNoise = 6
        baseLean = randomNormal(mean: 8, sd: 3)
        leanDrift = randomNormal(mean: 0.12, sd: 0.03)
        baseLateral = randomNormal(mean: 4, sd: 1.5)
        lateralDrift = randomNormal(mean: 0.06, sd: 0.02)
        baseCadence = randomNormal(mean: 100, sd: 8)
        cadenceDrift = randomNormal(mean: -0.2, sd: 0.06)
        baseSpeed = randomNormal(mean: 0.9, sd: 0.1)
        speedDrift = randomNormal(mean: -0.005, sd: 0.002)
    default: // notFatigued
        basePosture = randomNormal(mean: 80, sd: 6)
        postureDriftPerPoint = randomNormal(mean: 0, sd: 0.02)
        postureNoise = 2
        baseLean = randomNormal(mean: 3, sd: 1)
        leanDrift = randomNormal(mean: 0, sd: 0.005)
        baseLateral = randomNormal(mean: 1.5, sd: 0.5)
        lateralDrift = randomNormal(mean: 0, sd: 0.003)
        baseCadence = randomNormal(mean: 115, sd: 5)
        cadenceDrift = randomNormal(mean: 0, sd: 0.02)
        baseSpeed = randomNormal(mean: 1.2, sd: 0.1)
        speedDrift = randomNormal(mean: 0, sd: 0.0003)
    }

    for i in 0..<numPoints {
        let t = Double(i)
        postureScores.append(clamp(basePosture + postureDriftPerPoint * t + randomNormal(mean: 0, sd: postureNoise), 0, 100))
        trunkLeans.append(max(0, baseLean + leanDrift * t + randomNormal(mean: 0, sd: 1)))
        lateralLeans.append(max(0, baseLateral + lateralDrift * t + randomNormal(mean: 0, sd: 0.5)))
        cadences.append(max(40, baseCadence + cadenceDrift * t + randomNormal(mean: 0, sd: 2)))
        speeds.append(max(0.1, baseSpeed + speedDrift * t + randomNormal(mean: 0, sd: 0.03)))
    }

    return FatigueTimeSeries(
        postureScores: postureScores,
        trunkLeans: trunkLeans,
        lateralLeans: lateralLeans,
        cadences: cadences,
        speeds: speeds
    )
}

struct FatigueFeatures {
    var postureTrendSlope: Double
    var postureTrendR2: Double
    var postureVariabilitySD: Double
    var cadenceTrendSlope: Double
    var speedTrendSlope: Double
    var forwardLeanTrendSlope: Double
    var lateralSwayTrendSlope: Double
    var ruleBasedFatigueIndex: Double
    var isFatigued: Bool
}

func extractFatigueFeatures(_ series: FatigueTimeSeries) -> FatigueFeatures {
    let postureScores = series.postureScores
    let n = postureScores.count

    // Trends
    let postureTrend = linearRegression(postureScores)
    let postureSD = standardDeviation(postureScores)
    let cadenceTrend = linearRegression(series.cadences)
    let speedTrend = linearRegression(series.speeds)
    let leanTrend = linearRegression(series.trunkLeans)
    let lateralTrend = linearRegression(series.lateralLeans)

    // Thirds comparison
    let thirdSize = n / 3
    let firstThirdAvg = average(Array(postureScores.prefix(thirdSize)))
    let lastThirdAvg = average(Array(postureScores.suffix(thirdSize)))
    let firstThirdSD = standardDeviation(Array(postureScores.prefix(thirdSize)))
    let lastThirdSD = standardDeviation(Array(postureScores.suffix(thirdSize)))

    // Compute fatigue index
    var fatigueIndex = 0.0

    // Posture degradation (40%)
    let postureDrop = firstThirdAvg - lastThirdAvg
    if postureDrop > 0 { fatigueIndex += min(40, postureDrop * 4) }

    // Variability increase (20%)
    let sdIncrease = lastThirdSD - firstThirdSD
    if sdIncrease > 0 { fatigueIndex += min(20, sdIncrease * 10) }

    // Forward lean increase (15%)
    if leanTrend.slope > 0 { fatigueIndex += min(15, leanTrend.slope * 50) }

    // Speed decrease (10%)
    if speedTrend.slope < 0 { fatigueIndex += min(10, abs(speedTrend.slope) * 100) }

    // Cadence change (10%)
    let cadenceFirstAvg = average(Array(series.cadences.prefix(thirdSize)))
    let cadenceLastAvg = average(Array(series.cadences.suffix(thirdSize)))
    let cadenceChangePct = cadenceFirstAvg > 0 ? abs(cadenceLastAvg - cadenceFirstAvg) / cadenceFirstAvg * 100 : 0
    if cadenceChangePct > 5 { fatigueIndex += min(10, cadenceChangePct * 1.5) }

    // Lateral sway increase (5%)
    if lateralTrend.slope > 0 { fatigueIndex += min(5, lateralTrend.slope * 25) }

    let isFatigued = fatigueIndex > 25 ||
        (postureDrop > 5 && postureTrend.rSquared > 0.3)

    return FatigueFeatures(
        postureTrendSlope: postureTrend.slope,
        postureTrendR2: postureTrend.rSquared,
        postureVariabilitySD: postureSD,
        cadenceTrendSlope: cadenceTrend.slope,
        speedTrendSlope: speedTrend.slope,
        forwardLeanTrendSlope: leanTrend.slope,
        lateralSwayTrendSlope: lateralTrend.slope,
        ruleBasedFatigueIndex: clamp(fatigueIndex, 0, 100),
        isFatigued: isFatigued
    )
}

// ═══════════════════════════════════════════════════════════════════
// MARK: - Main
// ═══════════════════════════════════════════════════════════════════

func main() {
    let scriptDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
    let outputDir = "\(scriptDir)/Data"

    // Create output directory
    try? FileManager.default.createDirectory(
        atPath: outputDir, withIntermediateDirectories: true
    )

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Andernet Posture — ML Training Data Generator          ║")
    print("║  Knowledge distillation from rule-based analyzers       ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    // 1. Gait Pattern Classifier
    print("⚙ Generating Gait Pattern Classifier data (10,000 samples)...")
    let gaitData = generateGaitPatternData(count: 10_000)
    writeJSON(toJSON(gaitData), to: "GaitPatternClassifier_training.json", outputDir: outputDir)
    printDistribution(gaitData, labelKey: "label", name: "Gait patterns")

    // 2. Posture Scorer
    print("\n⚙ Generating Posture Scorer data (10,000 samples)...")
    let postureData = generatePostureScorerData(count: 10_000)
    writeJSON(toJSON(postureData), to: "PostureScorer_training.json", outputDir: outputDir)
    printDistribution(postureData, labelKey: "kendallType", name: "Kendall types")
    printScoreStats(postureData, scoreKey: "compositeScore", name: "Composite score")

    // 3. Fall Risk Predictor
    print("\n⚙ Generating Fall Risk Predictor data (10,000 samples)...")
    let fallRiskData = generateFallRiskData(count: 10_000)
    writeJSON(toJSON(fallRiskData), to: "FallRiskPredictor_training.json", outputDir: outputDir)
    printDistribution(fallRiskData, labelKey: "riskLevel", name: "Risk levels")
    printScoreStats(fallRiskData, scoreKey: "riskScore", name: "Risk score")

    // 4. Crossed Syndrome Detector
    print("\n⚙ Generating Crossed Syndrome Detector data (10,000 samples)...")
    let crossedData = generateCrossedSyndromeData(count: 10_000)
    writeJSON(toJSON(crossedData), to: "CrossedSyndromeDetector_training.json", outputDir: outputDir)
    printDistribution(crossedData, labelKey: "hasUpperCrossed", name: "Upper crossed")
    printDistribution(crossedData, labelKey: "hasLowerCrossed", name: "Lower crossed")

    // 5. Fatigue Predictor
    print("\n⚙ Generating Fatigue Predictor data (5,000 samples)...")
    let fatigueData = generateFatigueData(count: 5_000)
    writeJSON(toJSON(fatigueData), to: "FatiguePredictor_training.json", outputDir: outputDir)
    printDistribution(fatigueData, labelKey: "isFatigued", name: "Fatigued")
    printScoreStats(fatigueData, scoreKey: "fatigueIndex", name: "Fatigue index")

    print()
    print("═══════════════════════════════════════════════════════════")
    print("✅ All datasets generated in: \(outputDir)")
    print()
    print("Next steps:")
    print("  1. Open Create ML (Xcode → Open Developer Tool → Create ML)")
    print("  2. New Document → Tabular Classifier or Tabular Regressor")
    print("  3. Drag the JSON file into Training Data")
    print("  4. Set the 'Target' column:")
    print("     • GaitPatternClassifier → target: \"label\"")
    print("     • PostureScorer → target: \"compositeScore\" (regressor)")
    print("     • FallRiskPredictor → target: \"riskScore\" (regressor)")
    print("     • CrossedSyndromeDetector → target: \"upperCrossedScore\" + \"lowerCrossedScore\"")
    print("     • FatiguePredictor → target: \"fatigueIndex\" (regressor)")
    print("  5. Train, evaluate, Export → .mlmodel")
    print("  6. Compile: xcrun coremlcompiler compile Model.mlmodel .")
    print("  7. Add .mlmodelc to the app bundle")
    print("═══════════════════════════════════════════════════════════")
}

// MARK: - Reporting Helpers

func printDistribution(_ data: [[String: Any]], labelKey: String, name: String) {
    var counts: [String: Int] = [:]
    for sample in data {
        let label = sample[labelKey] as? String ?? "unknown"
        counts[label, default: 0] += 1
    }
    let sorted = counts.sorted { $0.value > $1.value }
    print("  \(name) distribution:")
    for (label, count) in sorted {
        let pct = String(format: "%.1f%%", Double(count) / Double(data.count) * 100)
        let bar = String(repeating: "█", count: max(1, count * 30 / data.count))
        print("    \(label.padding(toLength: 20, withPad: " ", startingAt: 0)) \(String(count).padding(toLength: 6, withPad: " ", startingAt: 0)) (\(pct)) \(bar)")
    }
}

func printScoreStats(_ data: [[String: Any]], scoreKey: String, name: String) {
    let scores = data.compactMap { ($0[scoreKey] as? Double) ?? ($0[scoreKey] as? Int).map(Double.init) }
    guard !scores.isEmpty else { return }
    let mean = scores.reduce(0, +) / Double(scores.count)
    let sorted = scores.sorted()
    let median = sorted[sorted.count / 2]
    let min = sorted.first!
    let max = sorted.last!
    print("  \(name): mean=\(String(format: "%.1f", mean)), median=\(String(format: "%.1f", median)), range=[\(String(format: "%.1f", min))–\(String(format: "%.1f", max))]")
}

// Run
main()
