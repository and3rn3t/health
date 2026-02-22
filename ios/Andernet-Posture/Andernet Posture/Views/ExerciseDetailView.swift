//
//  ExerciseDetailView.swift
//  Andernet Posture
//
//  Displays detailed exercise recommendations with step-by-step instructions,
//  difficulty level, evidence basis, and frequency guidance.
//

import SwiftUI

// MARK: - Exercise List View (Sheet)

/// Presents a list of recommended exercises for a specific insight.
struct ExerciseListView: View {
    let title: String
    let exercises: [ExerciseRecommendation]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    // Disclaimer
                    HStack(spacing: AppSpacing.sm) {
                        Image(systemName: "heart.text.square.fill")
                            .foregroundStyle(.red)
                        Text("Always consult your healthcare provider before starting new exercises, especially if you have pain or medical conditions.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(AppSpacing.md)
                    .background(.red.opacity(0.05), in: RoundedRectangle(cornerRadius: AppRadius.small))

                    ForEach(exercises) { exercise in
                        ExerciseCard(exercise: exercise)
                    }
                }
                .padding()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Exercise Card

/// Expandable card showing a single exercise with full instructions.
struct ExerciseCard: View {
    let exercise: ExerciseRecommendation
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header — always visible
            Button {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: AppSpacing.md) {
                    Image(systemName: exercise.icon)
                        .font(.title3)
                        .foregroundStyle(.tint)
                        .frame(width: 36, height: 36)
                        .background(.tint.opacity(0.1), in: Circle())

                    VStack(alignment: .leading, spacing: 2) {
                        Text(exercise.name)
                            .font(.subheadline.bold())
                            .foregroundStyle(.primary)
                            .multilineTextAlignment(.leading)

                        HStack(spacing: AppSpacing.sm) {
                            difficultyPill
                            Text("•")
                                .foregroundStyle(.tertiary)
                            Text(exercise.targetArea)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                }
                .padding(AppSpacing.md)
            }
            .buttonStyle(.plain)

            // Expanded content
            if isExpanded {
                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    Divider()

                    // Description
                    Text(exercise.description)
                        .font(.callout)
                        .foregroundStyle(.secondary)

                    // Duration & Frequency
                    HStack(spacing: AppSpacing.lg) {
                        miniInfoBlock(icon: "clock.fill", label: "Duration", value: exercise.duration)
                        miniInfoBlock(icon: "repeat", label: "Frequency", value: exercise.frequency)
                    }

                    // Step-by-step instructions
                    VStack(alignment: .leading, spacing: AppSpacing.sm) {
                        Text("Instructions")
                            .font(.subheadline.weight(.semibold))

                        ForEach(Array(exercise.instructions.enumerated()), id: \.offset) { index, step in
                            HStack(alignment: .top, spacing: AppSpacing.sm) {
                                Text("\(index + 1)")
                                    .font(.caption.bold())
                                    .foregroundStyle(.white)
                                    .frame(width: 22, height: 22)
                                    .background(.tint, in: Circle())

                                Text(step)
                                    .font(.callout)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }

                    // Evidence basis
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Evidence")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                        Text(exercise.evidenceBasis)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                            .italic()
                    }
                    .padding(AppSpacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: AppRadius.small))
                }
                .padding([.horizontal, .bottom], AppSpacing.md)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(exercise.name) exercise, \(exercise.difficulty.label) difficulty, targets \(exercise.targetArea)")
        .accessibilityHint(isExpanded ? "Double tap to collapse" : "Double tap to expand instructions")
    }

    // MARK: - Sub-components

    private var difficultyPill: some View {
        HStack(spacing: 2) {
            Image(systemName: exercise.difficulty.icon)
                .font(.system(size: 9))
            Text(exercise.difficulty.label)
                .font(.caption2.weight(.medium))
        }
        .foregroundStyle(difficultyColor)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(difficultyColor.opacity(0.12), in: Capsule())
    }

    private var difficultyColor: Color {
        switch exercise.difficulty {
        case .beginner: return .green
        case .intermediate: return .orange
        case .advanced: return .red
        }
    }

    @ViewBuilder
    private func miniInfoBlock(icon: String, label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.caption)
                .foregroundStyle(.primary)
        }
    }
}

// MARK: - Previews

#Preview("Exercise List") {
    ExerciseListView(
        title: "Recommended Exercises",
        exercises: ExerciseLibrary.forwardHeadPosture
    )
}

#Preview("Single Card") {
    ExerciseCard(exercise: ExerciseLibrary.forwardHeadPosture[0])
        .padding()
}
