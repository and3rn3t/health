// swiftlint:disable file_length
//
//  InsightsEngine.swift
//  Andernet Posture
//
//  Generates natural-language clinical insight cards from session history.
//

import Foundation
import SwiftData
import os

// MARK: - InsightCategory

/// Classification of insight types for filtering and grouping.
enum InsightCategory: String, Sendable, CaseIterable {
    case posture
    case gait
    case balance
    case risk
    case progress
    case recommendation
}

// MARK: - Insight

/// A single clinical insight card displayed on the dashboard.
struct Insight: Identifiable, Sendable {
    let id: UUID
    let icon: String
    let title: String
    let body: String
    let severity: ClinicalSeverity
    let category: InsightCategory
    let exercises: [ExerciseRecommendation]

    init(
        id: UUID = UUID(),
        icon: String,
        title: String,
        body: String,
        severity: ClinicalSeverity,
        category: InsightCategory,
        exercises: [ExerciseRecommendation] = []
    ) {
        self.id = id
        self.icon = icon
        self.title = title
        self.body = body
        self.severity = severity
        self.category = category
        self.exercises = exercises
    }

    /// Whether this insight has actionable exercise recommendations.
    var hasExercises: Bool { !exercises.isEmpty }
}

// MARK: - InsightsEngine Protocol

/// Generates actionable insights from captured session data.
protocol InsightsEngine: Sendable {
    func generateInsights(from sessions: [GaitSession]) -> [Insight]
}

// MARK: - DefaultInsightsEngine

/// Production implementation that analyses GaitSession history and produces insight cards.
final class DefaultInsightsEngine: InsightsEngine {

    private let calendar = Calendar.current

    func generateInsights(from sessions: [GaitSession]) -> [Insight] {
        let insightToken = PerformanceMonitor.begin(.insightsGeneration)
        defer { PerformanceMonitor.end(insightToken) }

        guard !sessions.isEmpty else { return [] }

        let sorted = sessions.sorted { $0.date < $1.date }
        var insights: [Insight] = []

        // 1. Posture trend (last 7 days vs prior 7 days)
        if let insight = postureTrendInsight(sorted) {
            insights.append(insight)
        }

        // 2. Walking speed — sarcopenia threshold
        if let insight = walkingSpeedInsight(sorted) {
            insights.append(insight)
        }

        // 3. CVA deterioration
        if let insight = cvaDeteriorationInsight(sorted) {
            insights.append(insight)
        }

        // 4. Fall risk escalation
        if let insight = fallRiskEscalationInsight(sorted) {
            insights.append(insight)
        }

        // 5. Fatigue pattern
        if let insight = fatiguePatternInsight(sorted) {
            insights.append(insight)
        }

        // 6. Session frequency
        if let insight = sessionFrequencyInsight(sorted) {
            insights.append(insight)
        }

        // 7. Stride symmetry
        if let insight = strideSymmetryInsight(sorted) {
            insights.append(insight)
        }

        // 8. REBA improvement
        if let insight = rebaImprovementInsight(sorted) {
            insights.append(insight)
        }

        // 9. CVA-based recommendation
        if let insight = cvaRecommendationInsight(sorted) {
            insights.append(insight)
        }

        // 10. Session milestone
        if let insight = milestoneInsight(sorted) {
            insights.append(insight)
        }

        // 11. SVA / Sagittal imbalance
        if let insight = svaInsight(sorted) {
            insights.append(insight)
        }

        // 12. Thoracic kyphosis
        if let insight = kyphosisInsight(sorted) {
            insights.append(insight)
        }

        // 13. Shoulder / Pelvic asymmetry
        if let insight = asymmetryInsight(sorted) {
            insights.append(insight)
        }

        // 14. Trunk forward lean
        if let insight = trunkLeanInsight(sorted) {
            insights.append(insight)
        }

        AppLogger.analysis.debug("InsightsEngine generated \(insights.count) insights from \(sessions.count) sessions")
        return filterContradictions(insights)
    }

    // MARK: - Contradiction Filter

    /// Remove contradictory insights (e.g., "Posture Improving" and "Forward Head Posture Increasing"
    /// appearing simultaneously). When both a positive and negative insight exist for the same
    /// clinical domain, keep the more severe one for patient safety.
    private func filterContradictions(_ insights: [Insight]) -> [Insight] {
        var result = insights

        // NOTE: Contradiction pairs must use the same localized strings as the
        // insight titles so comparisons work in any locale.
        let contradictions: [(String, String)] = [
            (String(localized: "Posture Improving"), String(localized: "Posture Declining")),
            (String(localized: "Head Posture Improving"), String(localized: "Forward Head Posture Increasing")),
            (String(localized: "Ergonomic Risk Improved"), String(localized: "Ergonomic Risk Increased"))
        ]

        for (positive, negative) in contradictions {
            let hasPositive = result.contains { $0.title == positive }
            let hasNegative = result.contains { $0.title == negative }
            if hasPositive && hasNegative {
                // Keep the negative (more clinically conservative) and remove positive
                result.removeAll { $0.title == positive }
            }
        }

        return result
    }

    // MARK: - Individual Insight Generators

    // 1. Posture trend — compare last 7 days vs prior 7 days
    private func postureTrendInsight(_ sessions: [GaitSession]) -> Insight? {
        let now = Date()
        guard let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: now),
              let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: now) else { return nil }

        let thisWeek = sessions.filter { $0.date >= oneWeekAgo && $0.postureScore != nil }
        let lastWeek = sessions.filter { $0.date >= twoWeeksAgo && $0.date < oneWeekAgo && $0.postureScore != nil }

        guard !thisWeek.isEmpty, !lastWeek.isEmpty else { return nil }

        let thisAvg = thisWeek.compactMap(\.postureScore).reduce(0, +) / Double(thisWeek.count)
        let lastAvg = lastWeek.compactMap(\.postureScore).reduce(0, +) / Double(lastWeek.count)

        guard lastAvg > 0 else { return nil }
        let change = ((thisAvg - lastAvg) / lastAvg) * 100

        if abs(change) < 2 { return nil } // ignore trivial changes

        let improved = change > 0
        let pct = String(format: "%.0f", abs(change))
        return Insight(
            icon: improved ? "arrow.up.right.circle.fill" : "arrow.down.right.circle.fill",
            title: improved ? String(localized: "Posture Improving") : String(localized: "Posture Declining"),
            body: "Your posture score \(improved ? "improved" : "declined") "
                + "\(pct)% this week compared to the previous week."
                + "\(improved ? "" : " Try the exercises below to help improve your alignment.")",
            severity: improved ? .normal : .moderate,
            category: .posture,
            exercises: improved ? [] : ExerciseLibrary.exercises(for: "postureDecline")
        )
    }

    // 2. Walking speed — sarcopenia cutoff at 0.8 m/s
    private func walkingSpeedInsight(_ sessions: [GaitSession]) -> Insight? {
        let withSpeed = sessions.filter { $0.averageWalkingSpeedMPS != nil }
        guard let latest = withSpeed.last, let speed = latest.averageWalkingSpeedMPS else { return nil }

        if speed < 0.8 {
            return Insight(
                icon: "exclamationmark.triangle.fill",
                title: String(localized: "Low Walking Speed"),
                body: String(
                    format: "Your walking speed of %.2f m/s is below the 0.8 m/s clinical threshold. "
                        + "Declining gait speed may indicate sarcopenia risk. "
                        + "See recommended exercises to help improve.",
                    speed),
                severity: .severe,
                category: .gait,
                exercises: ExerciseLibrary.exercises(for: "lowWalkingSpeed")
            )
        }

        // Check for declining trend over last 5 sessions
        let recentSpeeds = withSpeed.suffix(5).compactMap(\.averageWalkingSpeedMPS)
        if recentSpeeds.count >= 3 {
            let firstHalf = Array(recentSpeeds.prefix(recentSpeeds.count / 2))
            let secondHalf = Array(recentSpeeds.suffix(recentSpeeds.count / 2))
            let firstAvg = firstHalf.reduce(0, +) / Double(firstHalf.count)
            let secondAvg = secondHalf.reduce(0, +) / Double(secondHalf.count)
            if secondAvg < firstAvg * 0.95 {
                return Insight(
                    icon: "arrow.down.circle.fill",
                    title: String(localized: "Walking Speed Declining"),
                    body: String(
                        format: "Your walking speed is trending downward (%.2f → %.2f m/s). "
                            + "Consider discussing with your healthcare provider "
                            + "and try the recommended exercises.",
                        firstAvg, secondAvg),
                    severity: .moderate,
                    category: .gait,
                    exercises: ExerciseLibrary.exercises(for: "lowWalkingSpeed")
                )
            }
        }

        return nil
    }

    // 3. CVA deterioration over last 5 sessions
    private func cvaDeteriorationInsight(_ sessions: [GaitSession]) -> Insight? {
        let withCVA = sessions.filter { $0.averageCVADeg != nil }
        guard withCVA.count >= 5 else { return nil }

        let recent = withCVA.suffix(5)
        let cvaValues = recent.compactMap(\.averageCVADeg)
        guard let first = cvaValues.first, let last = cvaValues.last else { return nil }

        // Lower CVA = worse forward head posture (normal ~45-50°)
        let change = first - last // positive = deterioration (angle decreased)
        if change >= 3 {
            return Insight(
                icon: "person.fill.questionmark",
                title: String(localized: "Forward Head Posture Increasing"),
                body: String(
                    format: "Your craniovertebral angle decreased by %.0f° over the last 5 sessions, "
                        + "indicating increasing forward head posture. "
                        + "Targeted exercises can help correct this.",
                    change),
                severity: .moderate,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "forwardHeadPosture")
            )
        } else if change <= -3 {
            return Insight(
                icon: "person.fill.checkmark",
                title: String(localized: "Head Posture Improving"),
                body: String(format: "Your craniovertebral angle improved by %.0f° over the last 5 sessions. Great progress!", abs(change)),
                severity: .normal,
                category: .posture
            )
        }
        return nil
    }

    // 4. Fall risk escalation
    private func fallRiskEscalationInsight(_ sessions: [GaitSession]) -> Insight? {
        let withRisk = sessions.filter { $0.fallRiskLevel != nil }
        guard withRisk.count >= 2 else { return nil }

        let recent = Array(withRisk.suffix(2))
        let previousLevel = recent[0].fallRiskLevel ?? ""
        let currentLevel = recent[1].fallRiskLevel ?? ""

        let riskOrder = ["low": 0, "moderate": 1, "high": 2]
        guard let prevRank = riskOrder[previousLevel],
              let currRank = riskOrder[currentLevel],
              currRank > prevRank else { return nil }

        if currentLevel == "high" {
            return Insight(
                icon: "exclamationmark.octagon.fill",
                title: String(localized: "Fall Risk Escalated"),
                body: "Your fall risk increased from \(previousLevel) to \(currentLevel). "
                    + "Consider consulting your healthcare provider and reviewing home safety measures. "
                    + "Balance exercises are strongly recommended.",
                severity: .severe,
                category: .risk,
                exercises: ExerciseLibrary.exercises(for: "fallRisk")
            )
        } else {
            return Insight(
                icon: "exclamationmark.triangle.fill",
                title: String(localized: "Fall Risk Increasing"),
                body: "Your fall risk moved from \(previousLevel) to \(currentLevel). The recommended balance exercises below can help reduce your fall risk.",
                severity: .moderate,
                category: .risk,
                exercises: ExerciseLibrary.exercises(for: "fallRisk")
            )
        }
    }

    // 5. Fatigue pattern
    private func fatiguePatternInsight(_ sessions: [GaitSession]) -> Insight? {
        let withFatigue = sessions.filter { $0.fatigueIndex != nil && $0.duration > 0 }
        guard withFatigue.count >= 3 else { return nil }

        let durations = withFatigue.compactMap { session -> Double? in
            guard let fatigue = session.fatigueIndex, fatigue > 50 else { return nil }
            return session.duration
        }

        guard !durations.isEmpty else { return nil }
        let avgFatigueOnsetSec = durations.reduce(0, +) / Double(durations.count)
        let avgMinutes = avgFatigueOnsetSec / 60

        if avgMinutes < 10 {
            return Insight(
                icon: "battery.25percent",
                title: String(localized: "Early Fatigue Pattern"),
                body: String(
                    format: "You tend to show fatigue signs after ~%.0f minutes. " +
                        "Consider shorter, more frequent sessions and try the endurance exercises below.",
                    avgMinutes
                ),
                severity: .mild,
                category: .progress,
                exercises: ExerciseLibrary.exercises(for: "fatigue")
            )
        }
        return nil
    }

    // 6. Session frequency
    private func sessionFrequencyInsight(_ sessions: [GaitSession]) -> Insight? {
        guard sessions.count >= 3 else { return nil }

        let now = Date()
        guard let fourWeeksAgo = calendar.date(byAdding: .day, value: -28, to: now) else { return nil }

        let recentSessions = sessions.filter { $0.date >= fourWeeksAgo }
        let weeksTracked = max(1, calendar.dateComponents([.weekOfYear], from: fourWeeksAgo, to: now).weekOfYear ?? 1)
        let avgPerWeek = Double(recentSessions.count) / Double(weeksTracked)

        let severity: ClinicalSeverity
        let message: String
        if avgPerWeek >= 5 {
            severity = .normal
            message = String(format: "Excellent! You've averaged %.0f sessions/week over the past month. Keep up the consistency!", avgPerWeek)
        } else if avgPerWeek >= 3 {
            severity = .mild
            message = String(format: "You've averaged %.0f sessions/week. Aim for 5 for optimal tracking and trend analysis.", avgPerWeek)
        } else {
            severity = .moderate
            message = String(format: "You've averaged %.0f sessions/week. More frequent sessions help detect trends earlier.", avgPerWeek)
        }

        return Insight(
            icon: "calendar.badge.clock",
            title: String(localized: "Session Frequency"),
            body: message,
            severity: severity,
            category: .progress
        )
    }

    // 7. Stride symmetry
    private func strideSymmetryInsight(_ sessions: [GaitSession]) -> Insight? {
        let withSymmetry = sessions.filter { $0.gaitAsymmetryPercent != nil }
        guard let latest = withSymmetry.last, let asymmetry = latest.gaitAsymmetryPercent else { return nil }

        if asymmetry > 10 {
            let severity: ClinicalSeverity = asymmetry > 20 ? .severe : .moderate
            return Insight(
                icon: "figure.walk.motion",
                title: String(localized: "Stride Asymmetry Detected"),
                body: String(
                    format: "Left-right stride asymmetry of %.0f%% detected. "
                        + "Values above 10%% may indicate compensatory gait patterns. "
                        + "Try the symmetry exercises below to help balance your gait.",
                    asymmetry),
                severity: severity,
                category: .gait,
                exercises: ExerciseLibrary.exercises(for: "gaitAsymmetry")
            )
        }
        return nil
    }

    // 8. REBA improvement
    private func rebaImprovementInsight(_ sessions: [GaitSession]) -> Insight? {
        let now = Date()
        guard let oneMonthAgo = calendar.date(byAdding: .month, value: -1, to: now) else { return nil }

        let withReba = sessions.filter { $0.rebaScore != nil }
        let oldSessions = withReba.filter { $0.date < oneMonthAgo }
        let recentSessions = withReba.filter { $0.date >= oneMonthAgo }

        guard !oldSessions.isEmpty, !recentSessions.isEmpty else { return nil }

        let oldAvg = Double(oldSessions.compactMap(\.rebaScore).reduce(0, +)) / Double(oldSessions.count)
        let recentAvg = Double(recentSessions.compactMap(\.rebaScore).reduce(0, +)) / Double(recentSessions.count)

        let oldScore = Int(oldAvg.rounded())
        let recentScore = Int(recentAvg.rounded())

        if recentScore < oldScore {
            return Insight(
                icon: "arrow.down.forward.circle.fill",
                title: String(localized: "Ergonomic Risk Improved"),
                body: "Your REBA ergonomic risk score improved from \(oldScore) to \(recentScore) this month. Lower scores indicate safer postures.",
                severity: .normal,
                category: .posture
            )
        } else if recentScore > oldScore + 1 {
            return Insight(
                icon: "arrow.up.forward.circle.fill",
                title: String(localized: "Ergonomic Risk Increased"),
                body: "Your REBA score increased from \(oldScore) to \(recentScore). Review the ergonomic recommendations below to reduce your risk.",
                severity: .moderate,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "ergonomicRisk")
            )
        }
        return nil
    }

    // 9. CVA-based recommendation
    private func cvaRecommendationInsight(_ sessions: [GaitSession]) -> Insight? {
        let withCVA = sessions.filter { $0.averageCVADeg != nil }
        guard let latest = withCVA.last, let cva = latest.averageCVADeg else { return nil }

        if cva < 40 {
            return Insight(
                icon: "text.book.closed.fill",
                title: String(localized: "Exercise Recommendation"),
                body: String(
                    format: "Based on your CVA of %.0f°, targeted neck and upper back exercises are recommended. " +
                        "Tap to see detailed instructions for each exercise.",
                    cva
                ),
                severity: .moderate,
                category: .recommendation,
                exercises: ExerciseLibrary.exercises(for: "forwardHeadPosture")
            )
        } else if cva < 45 {
            return Insight(
                icon: "text.book.closed.fill",
                title: String(localized: "Posture Tip"),
                body: String(
                    format: "Your CVA of %.0f° is slightly below ideal (≥50°). " +
                        "Gentle chin tucks throughout the day can help. See exercises below for detailed guidance.",
                    cva
                ),
                severity: .mild,
                category: .recommendation,
                exercises: ExerciseLibrary.exercises(for: "forwardHeadPosture").filter { $0.difficulty == .beginner }
            )
        }
        return nil
    }

    // 10. Session milestones
    private func milestoneInsight(_ sessions: [GaitSession]) -> Insight? {
        let milestones = [100, 50, 25, 10]
        for milestone in milestones {
            if sessions.count >= milestone && sessions.count < milestone + 3 {
                return Insight(
                    icon: "star.circle.fill",
                    title: String(localized: "Milestone Reached!"),
                    body: "Congratulations! You've completed \(milestone) sessions. Consistent tracking leads to better health outcomes.",
                    severity: .normal,
                    category: .progress
                )
            }
        }
        return nil
    }

    // 11. SVA / Sagittal imbalance
    private func svaInsight(_ sessions: [GaitSession]) -> Insight? {
        let withSVA = sessions.filter { $0.averageSVACm != nil }
        guard let latest = withSVA.last, let sva = latest.averageSVACm else { return nil }

        let absSVA = abs(sva)
        if absSVA >= 9.5 {
            return Insight(
                icon: "arrow.up.and.down.text.horizontal",
                title: String(localized: "Significant Sagittal Imbalance"),
                body: String(
                    format: "Your sagittal vertical axis of %.1f cm is well above the 5 cm threshold. "
                        + "This level of forward shift is associated with disability "
                        + "and increased energy expenditure. Exercises to strengthen "
                        + "your back extensors and stretch hip flexors can help.",
                    absSVA),
                severity: .severe,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "sagittalImbalance")
            )
        } else if absSVA >= 5.0 {
            return Insight(
                icon: "arrow.up.and.down.text.horizontal",
                title: String(localized: "Forward Sagittal Shift"),
                body: String(
                    format: "Your SVA of %.1f cm exceeds the normal range (< 5 cm). " +
                        "Targeted core and back extension exercises can help restore sagittal balance.",
                    absSVA
                ),
                severity: .moderate,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "sagittalImbalance")
            )
        }
        return nil
    }

    // 12. Thoracic kyphosis
    private func kyphosisInsight(_ sessions: [GaitSession]) -> Insight? {
        let withKyphosis = sessions.filter { $0.averageThoracicKyphosisDeg != nil }
        guard let latest = withKyphosis.last, let kyphosis = latest.averageThoracicKyphosisDeg else { return nil }

        if kyphosis > 55 {
            let severity: ClinicalSeverity = kyphosis > 70 ? .severe : .moderate
            return Insight(
                icon: "figure.stand",
                title: String(localized: "Increased Thoracic Kyphosis"),
                body: String(
                    format: "Your thoracic curvature of %.0f° exceeds the normal range (20–45°). "
                        + "Excessive rounding of the upper back can contribute to shoulder pain "
                        + "and breathing restrictions. "
                        + "Try the exercises below to improve thoracic extension.",
                    kyphosis),
                severity: severity,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "thoracicKyphosis")
            )
        } else if kyphosis < 15 {
            return Insight(
                icon: "figure.stand",
                title: String(localized: "Reduced Thoracic Kyphosis"),
                body: String(
                    format: "Your thoracic curvature of %.0f° is below the normal range (20–45°), "
                        + "indicating a flattened upper back. "
                        + "Spinal mobility exercises can help restore natural curvature.",
                    kyphosis),
                severity: .mild,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "postureDecline")
            )
        }
        return nil
    }

    // 13. Shoulder / Pelvic asymmetry
    private func asymmetryInsight(_ sessions: [GaitSession]) -> Insight? {
        let withShoulder = sessions.filter { $0.averageShoulderAsymmetryCm != nil }
        let withPelvic = sessions.filter { $0.averagePelvicObliquityDeg != nil }

        // Check shoulder asymmetry first
        if let latest = withShoulder.last, let shoulderCm = latest.averageShoulderAsymmetryCm, shoulderCm > 3.0 {
            let severity: ClinicalSeverity = shoulderCm > 5.0 ? .severe : .moderate
            return Insight(
                icon: "arrow.left.arrow.right",
                title: String(localized: "Shoulder Level Imbalance"),
                body: String(
                    format: "Your shoulders differ in height by %.1f cm (normal < 1.5 cm). "
                        + "Uneven shoulders may indicate muscle imbalances or habitual patterns. "
                        + "Corrective exercises can help restore symmetry.",
                    shoulderCm),
                severity: severity,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "shoulderAsymmetry")
            )
        }

        // Then pelvic obliquity
        if let latest = withPelvic.last, let pelvicDeg = latest.averagePelvicObliquityDeg, abs(pelvicDeg) > 3.0 {
            let severity: ClinicalSeverity = abs(pelvicDeg) > 5.0 ? .severe : .moderate
            return Insight(
                icon: "arrow.left.arrow.right",
                title: String(localized: "Pelvic Obliquity Detected"),
                body: String(
                    format: "Your pelvis tilts %.1f° from level (normal < 1°). "
                        + "Pelvic imbalance can affect gait symmetry and contribute to lower back pain. "
                        + "Hip stabilization exercises are recommended.",
                    abs(pelvicDeg)),
                severity: severity,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "pelvicObliquity")
            )
        }

        return nil
    }

    // 14. Trunk forward lean (posture-related, distinct from SVA)
    private func trunkLeanInsight(_ sessions: [GaitSession]) -> Insight? {
        let withLean = sessions.filter { $0.averageTrunkLeanDeg != nil }
        guard let latest = withLean.last, let lean = latest.averageTrunkLeanDeg else { return nil }

        let absLean = abs(lean)
        if absLean > 10 {
            let severity: ClinicalSeverity = absLean > 20 ? .severe : .moderate
            return Insight(
                icon: "figure.stand",
                title: String(localized: "Excessive Trunk Lean"),
                body: String(
                    format: "Your average trunk lean of %.0f° exceeds the normal threshold (< 5°). "
                        + "Forward trunk lean increases spinal loading and fall risk. "
                        + "Core strengthening and hip flexibility exercises can help.",
                    absLean),
                severity: severity,
                category: .posture,
                exercises: ExerciseLibrary.exercises(for: "sagittalImbalance")
            )
        }
        return nil
    }
}
