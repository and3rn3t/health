//
//  GaitPatternClassifier.swift
//  Andernet Posture
//
//  Classifies gait patterns using spatial-temporal and kinematic markers.
//  Detects antalgic, Trendelenburg, festinating, circumduction, ataxic,
//  and waddling gait patterns based on published clinical criteria.
//
//  References:
//  - Perry J & Burnfield JM, Gait Analysis, 2010
//  - Pirker W & Katzenschlager R, Wien Klin Wochenschr, 2017
//

import Foundation
import simd

// MARK: - Results

/// Classification result with confidence scores for each pattern.
struct GaitPatternResult: Sendable {
    /// Primary detected pattern.
    let primaryPattern: GaitPatternType
    /// Confidence for the primary pattern (0–1).
    let confidence: Double
    /// Scores for all evaluated patterns.
    let patternScores: [GaitPatternType: Double]
    /// Clinical flags that contributed to classification.
    let flags: [String]
}

// MARK: - Protocol

protocol GaitPatternClassifying: AnyObject {
    // swiftlint:disable:next orphaned_doc_comment
    /// Classify gait pattern from session-level data.
    // swiftlint:disable:next function_parameter_count
    func classify(
        stanceTimeLeftPercent: Double?,
        stanceTimeRightPercent: Double?,
        stepLengthLeftM: Double?,
        stepLengthRightM: Double?,
        cadenceSPM: Double?,
        avgStepWidthCm: Double?,
        stepWidthVariabilityCm: Double?,
        pelvicObliquityDeg: Double?,
        strideTimeCVPercent: Double?,
        walkingSpeedMPS: Double?,
        strideLengthM: Double?,
        hipFlexionROMDeg: Double?,
        armSwingAsymmetryPercent: Double?,
        kneeFlexionROMDeg: Double?
    ) -> GaitPatternResult
}

// MARK: - Default Implementation

final class DefaultGaitPatternClassifier: GaitPatternClassifying {

    // swiftlint:disable:next cyclomatic_complexity function_body_length function_parameter_count
    func classify(
        stanceTimeLeftPercent: Double?,
        stanceTimeRightPercent: Double?,
        stepLengthLeftM: Double?,
        stepLengthRightM: Double?,
        cadenceSPM: Double?,
        avgStepWidthCm: Double?,
        stepWidthVariabilityCm: Double?,
        pelvicObliquityDeg: Double?,
        strideTimeCVPercent: Double?,
        walkingSpeedMPS: Double?,
        strideLengthM: Double?,
        hipFlexionROMDeg: Double?,
        armSwingAsymmetryPercent: Double?,
        kneeFlexionROMDeg: Double? = nil
    ) -> GaitPatternResult {

        var scores: [GaitPatternType: Double] = [:]
        var flags: [String] = []

        // ── Antalgic ──
        // Short stance on one side, asymmetric step length, reduced speed.
        var antalgicScore = 0.0
        if let stL = stanceTimeLeftPercent, let stR = stanceTimeRightPercent {
            let stanceAsymmetry = abs(stL - stR)
            if stanceAsymmetry > 5 {
                antalgicScore += min(1.0, stanceAsymmetry / 15.0) * 0.5
                flags.append("Stance asymmetry: \(String(format: "%.1f", stanceAsymmetry))%")
            }
        }
        if let slL = stepLengthLeftM, let slR = stepLengthRightM {
            let stepAsymmetry = abs(slL - slR)
            if stepAsymmetry > 0.05 {
                antalgicScore += min(1.0, stepAsymmetry / 0.15) * 0.3
            }
        }
        if let speed = walkingSpeedMPS, speed < 0.8 {
            antalgicScore += 0.2
        }
        scores[.antalgic] = min(1.0, antalgicScore)

        // ── Trendelenburg ──
        // Contralateral pelvic drop during single-leg stance, often with trunk lean.
        var trendelenburgScore = 0.0
        if let pelvic = pelvicObliquityDeg, abs(pelvic) > 5 {
            trendelenburgScore += min(1.0, abs(pelvic) / 12.0) * 0.7
            flags.append("Pelvic obliquity: \(String(format: "%.1f", abs(pelvic)))°")
        }
        // Unilateral pattern (asymmetric stance but not bilateral)
        if let stL = stanceTimeLeftPercent, let stR = stanceTimeRightPercent {
            let asymmetry = abs(stL - stR)
            if asymmetry > 3 && asymmetry < 15 {
                trendelenburgScore += 0.3
            }
        }
        scores[.trendelenburg] = min(1.0, trendelenburgScore)

        // ── Festinating ──
        // Rapid small steps, high cadence, short stride, acceleration pattern.
        // Screen for Parkinson's-like gait.
        var festinatingScore = 0.0
        if let cadence = cadenceSPM, cadence > 140 {
            festinatingScore += min(1.0, (cadence - 140) / 40) * 0.4
            flags.append("Elevated cadence: \(String(format: "%.0f", cadence)) SPM")
        }
        if let stride = strideLengthM, stride < 0.5 {
            festinatingScore += min(1.0, (0.5 - stride) / 0.3) * 0.4
        }
        if let armAsym = armSwingAsymmetryPercent, armAsym > 20 {
            festinatingScore += 0.2
            flags.append("Arm swing asymmetry: \(String(format: "%.0f", armAsym))%")
        }
        scores[.festinating] = min(1.0, festinatingScore)

        // ── Ataxic ──
        // Wide-based, irregular, high step width and variability.
        var ataxicScore = 0.0
        if let sw = avgStepWidthCm, sw > 15 {
            ataxicScore += min(1.0, (sw - 15) / 10) * 0.4
            flags.append("Wide base: \(String(format: "%.1f", sw)) cm")
        }
        if let swVar = stepWidthVariabilityCm, swVar > 3 {
            ataxicScore += min(1.0, (swVar - 3) / 4) * 0.3
        }
        if let cv = strideTimeCVPercent, cv > 8 {
            ataxicScore += min(1.0, (cv - 8) / 10) * 0.3
        }
        scores[.ataxic] = min(1.0, ataxicScore)

        // ── Waddling ──
        // Bilateral Trendelenburg: lateral trunk sway with large pelvic oscillation.
        var waddlingScore = 0.0
        if let pelvic = pelvicObliquityDeg, abs(pelvic) > 8 {
            waddlingScore += 0.5
        }
        if let sw = avgStepWidthCm, sw > 13 {
            waddlingScore += 0.3
        }
        // Bilateral = symmetric stance times (unlike unilateral Trendelenburg)
        if let stL = stanceTimeLeftPercent, let stR = stanceTimeRightPercent {
            if abs(stL - stR) < 3 && (stL > 63 || stR > 63) {
                waddlingScore += 0.2
            }
        }
        scores[.waddling] = min(1.0, waddlingScore)

        // ── Circumduction ──
        // Lateral arc during swing, often due to knee stiffness / reduced flexion.
        var circumductionScore = 0.0
        if let hipROM = hipFlexionROMDeg, hipROM < 25 {
            circumductionScore += min(1.0, (25 - hipROM) / 15) * 0.5
        }
        if let sw = avgStepWidthCm, sw > 13 {
            circumductionScore += 0.3
        }
        if let speed = walkingSpeedMPS, speed < 0.7 {
            circumductionScore += 0.2
        }
        scores[.circumduction] = min(1.0, circumductionScore)

        // ── Stiff-Knee ──
        // Reduced knee flexion ROM during swing phase, common in spastic/neurological gait.
        // Normal swing-phase knee flexion ≈ 60–70° (Perry & Burnfield, 2010).
        var stiffKneeScore = 0.0
        if let kneeROM = kneeFlexionROMDeg, kneeROM < 50 {
            stiffKneeScore += min(1.0, (50 - kneeROM) / 30) * 0.5
            flags.append("Reduced knee flexion ROM: \(String(format: "%.0f", kneeROM))°")
        }
        if let hipROM = hipFlexionROMDeg, hipROM < 25 {
            stiffKneeScore += 0.2  // hip compensation for stiff knee
        }
        if let speed = walkingSpeedMPS, speed < 0.8 {
            stiffKneeScore += 0.2
        }
        // Circumduction often accompanies stiff knee; limit overlap
        if circumductionScore > 0.3 {
            stiffKneeScore += 0.1
        }
        scores[.stiffKnee] = min(1.0, stiffKneeScore)

        // ── Normal ──
        // Inverse of all pathological scores.
        let maxPathological = scores.values.max() ?? 0
        scores[.normal] = max(0, 1.0 - maxPathological)

        // Select primary pattern
        let sorted = scores.sorted { $0.value > $1.value }
        let primary = sorted.first?.key ?? .normal
        let confidence = sorted.first?.value ?? 1.0

        return GaitPatternResult(
            primaryPattern: primary,
            confidence: confidence,
            patternScores: scores,
            flags: flags
        )
    }
}
