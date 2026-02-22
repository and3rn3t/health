//
//  SessionAnalysisSection.swift
//  Andernet Posture
//
//  Prominently displays the overall session analysis within the session card,
//  surfacing abnormal values first with likely causes and exercise links.
//

import SwiftUI

struct SessionAnalysisSection: View {

    let analysis: SessionAnalysis
    @State private var expandedFindingID: UUID?
    @State private var showExercises = false
    @State private var exercisesForSheet: [ExerciseRecommendation] = []

    var body: some View {
        SectionCard(
            title: "Clinical Analysis",
            icon: "waveform.path.ecg.rectangle",
            accentColor: accentForSeverity(analysis.overallSeverity)
        ) {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                // Overall assessment banner
                assessmentBanner

                // Stats row
                statsRow

                // Abnormal findings list
                if !analysis.findings.isEmpty {
                    Divider()
                    
                    Text("Findings (sorted by severity)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)

                    ForEach(analysis.findings) { finding in
                        findingRow(finding)
                        if finding.id != analysis.findings.last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showExercises) {
            ExerciseListView(title: "Corrective Exercises", exercises: exercisesForSheet)
        }
    }

    // MARK: - Assessment Banner

    @ViewBuilder
    private var assessmentBanner: some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            Image(systemName: overallIcon)
                .font(.title2)
                .foregroundStyle(accentForSeverity(analysis.overallSeverity))

            Text(analysis.overallAssessment)
                .font(.subheadline)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(AppSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            accentForSeverity(analysis.overallSeverity).opacity(0.08),
            in: RoundedRectangle(cornerRadius: AppRadius.small)
        )
    }

    // MARK: - Stats Row

    @ViewBuilder
    private var statsRow: some View {
        HStack(spacing: 0) {
            statPill(
                "\(analysis.totalEvaluated)",
                label: "Evaluated",
                color: .secondary
            )
            Spacer()
            statPill(
                "\(analysis.normalCount)",
                label: "Normal",
                color: .green
            )
            Spacer()
            statPill(
                "\(analysis.abnormalCount)",
                label: "Abnormal",
                color: analysis.abnormalCount > 0 ? .orange : .green
            )
            Spacer()
            statPill(
                "\(analysis.normalPercentage)%",
                label: "In Range",
                color: analysis.normalPercentage >= 80 ? .green : .orange
            )
        }
    }

    @ViewBuilder
    private func statPill(_ value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.headline.monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Finding Row

    @ViewBuilder
    // swiftlint:disable:next function_body_length
    private func findingRow(_ finding: AbnormalFinding) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            // Header — metric, value, severity
            Button {
                withAnimation(.snappy(duration: 0.25)) {
                    expandedFindingID = expandedFindingID == finding.id ? nil : finding.id
                }
            } label: {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        if !finding.plainName.isEmpty {
                            Text(finding.plainName)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Text(finding.metric)
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        } else {
                            Text(finding.metric)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                        }

                        Text("Normal: \(finding.normalRange)")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }

                    Spacer()

                    HStack(spacing: AppSpacing.sm) {
                        Text(finding.value)
                            .font(.subheadline.bold())
                            .foregroundStyle(accentForSeverity(finding.severity))

                        SeverityBadge(severity: finding.severity, showLabel: true)

                        Image(systemName: expandedFindingID == finding.id ? "chevron.up" : "chevron.down")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
            .buttonStyle(.plain)

            // Expanded detail
            if expandedFindingID == finding.id {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    // Plain-English explanation
                    if !finding.whatItMeans.isEmpty {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "text.quote")
                                .font(.caption)
                                .foregroundStyle(.blue)
                            Text(finding.whatItMeans)
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                        .padding(AppSpacing.sm)
                        .background(.blue.opacity(0.06), in: RoundedRectangle(cornerRadius: AppRadius.small))
                    }

                    // Likely causes
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Likely Causes")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)

                        ForEach(Array(finding.likelyCauses.enumerated()), id: \.offset) { _, cause in
                            HStack(alignment: .top, spacing: 6) {
                                Text("•")
                                    .font(.caption)
                                    .foregroundStyle(accentForSeverity(finding.severity))
                                Text(cause)
                                    .font(.caption)
                                    .foregroundStyle(.primary)
                            }
                        }
                    }

                    // Recommendation
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "lightbulb.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                        Text(finding.recommendation)
                            .font(.caption)
                            .foregroundStyle(.primary)
                            .italic()
                    }
                    .padding(AppSpacing.sm)
                    .background(.yellow.opacity(0.06), in: RoundedRectangle(cornerRadius: AppRadius.small))

                    // Exercise link
                    if !finding.exercises.isEmpty {
                        Button {
                            exercisesForSheet = finding.exercises
                            showExercises = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "figure.strengthtraining.traditional")
                                Text("View \(finding.exercises.count) Corrective Exercise\(finding.exercises.count == 1 ? "" : "s")")
                            }
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.tint)
                        }
                    }
                }
                .padding(.leading, AppSpacing.md)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(.vertical, AppSpacing.xs)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(finding.plainName.isEmpty ? finding.metric : finding.plainName), "
            + "\(finding.value), \(finding.severity.rawValue) severity"
        )
        .accessibilityHint("Tap to \(expandedFindingID == finding.id ? "collapse" : "expand") details")
    }

    // MARK: - Helpers

    private func accentForSeverity(_ severity: ClinicalSeverity) -> Color {
        AppColors.severityColor(for: severity)
    }

    private var overallIcon: String {
        switch analysis.overallSeverity {
        case .normal:   return "checkmark.seal.fill"
        case .mild:     return "info.circle.fill"
        case .moderate: return "exclamationmark.triangle.fill"
        case .severe:   return "exclamationmark.octagon.fill"
        }
    }
}
