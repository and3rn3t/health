//
//  MetricExplainerView.swift
//  Andernet Posture
//
//  Tappable info popup for clinical metrics.
//

import SwiftUI

// MARK: - Data Model

struct MetricExplainer: Identifiable {
    let id = UUID()
    let metric: String
    let definition: String
    let normalRange: String
    let clinicalSignificance: String
    let icon: String
    /// Key into ExerciseLibrary for relevant corrective exercises.
    var exerciseConditionKey: String?
}

// MARK: - Metric Library

// swiftlint:disable line_length
extension MetricExplainer {
    static let library: [String: MetricExplainer] = [
        "cva": MetricExplainer(
            metric: "Craniovertebral Angle (CVA)",
            definition: "The angle between a horizontal line through C7 and a line from C7 to the tragus of the ear. Measures forward head posture.",
            normalRange: "49–56°",
            clinicalSignificance: "A CVA below 49° indicates forward head posture, which is associated with neck pain, cervicogenic headaches, and upper crossed syndrome. Lower values indicate more severe forward head positioning.",
            icon: "angle",
            exerciseConditionKey: "forwardHeadPosture"
        ),
        "sva": MetricExplainer(
            metric: "Sagittal Vertical Axis (SVA)",
            definition: "The horizontal distance between a vertical plumb line from C7 and the posterior superior corner of S1. Measures overall sagittal balance.",
            normalRange: "< 5 cm",
            clinicalSignificance: "SVA greater than 5 cm indicates positive sagittal imbalance, which increases energy expenditure during standing and walking. Values >9.5 cm are associated with significant disability and pain.",
            icon: "arrow.up.and.down.text.horizontal",
            exerciseConditionKey: "sagittalImbalance"
        ),
        "postureScore": MetricExplainer(
            metric: "Composite Posture Score",
            definition: "A weighted composite score (0–100) integrating CVA, SVA, trunk lean, shoulder tilt, and other postural parameters.",
            normalRange: "70–100 (Good to Excellent)",
            clinicalSignificance: "Provides a single at-a-glance postural quality indicator. Scores below 50 suggest significant postural deviation warranting clinical evaluation. Useful for tracking improvement over time.",
            icon: "figure.stand"
        ),
        "walkingSpeed": MetricExplainer(
            metric: "Walking Speed",
            definition: "Average velocity during the gait cycle, measured in meters per second (m/s).",
            normalRange: "1.0–1.4 m/s (adults)",
            clinicalSignificance: "Walking speed below 0.8 m/s is a key sarcopenia screening cutoff and an independent predictor of mortality in older adults. Often called the 'sixth vital sign' in geriatric medicine.",
            icon: "speedometer",
            exerciseConditionKey: "lowWalkingSpeed"
        ),
        "cadence": MetricExplainer(
            metric: "Cadence",
            definition: "The number of steps taken per minute (SPM) during walking.",
            normalRange: "100–120 SPM (adults)",
            clinicalSignificance: "Abnormally low cadence may indicate guarded gait, pain, or neurological impairment. Very high cadence with short strides can suggest compensatory gait patterns.",
            icon: "metronome"
        ),
        "fallRisk": MetricExplainer(
            metric: "Fall Risk Score",
            definition: "A composite fall risk estimate integrating gait speed, stride variability, sway velocity, step symmetry, and postural stability.",
            normalRange: "Low Risk (score < 30)",
            clinicalSignificance: "Elevated fall risk scores (moderate 30–60, high >60) warrant clinical balance assessment. Falls are the leading cause of injury-related death in adults 65+. This is a screening tool, not a diagnostic instrument.",
            icon: "exclamationmark.triangle",
            exerciseConditionKey: "fallRisk"
        ),
        "reba": MetricExplainer(
            metric: "REBA Score",
            definition: "Rapid Entire Body Assessment — an ergonomic evaluation tool scoring whole-body posture risk from 1 (negligible) to 15 (very high).",
            normalRange: "1–3 (Low risk)",
            clinicalSignificance: "REBA scores of 4–7 indicate medium risk requiring further assessment. Scores 8–10 indicate high risk, and 11+ indicate very high risk requiring immediate ergonomic intervention.",
            icon: "person.badge.shield.checkmark",
            exerciseConditionKey: "ergonomicRisk"
        ),
        "fatigue": MetricExplainer(
            metric: "Fatigue Index",
            definition: "A composite metric tracking postural degradation over time during a session, based on increasing trunk lean, sway, and decreased postural control.",
            normalRange: "< 30 (Low fatigue)",
            clinicalSignificance: "Rising fatigue indices during a session indicate declining neuromuscular control. Useful for monitoring endurance during rehabilitation or occupational assessments.",
            icon: "battery.25percent",
            exerciseConditionKey: "fatigue"
        ),
        "gaitSymmetry": MetricExplainer(
            metric: "Gait Symmetry (Robinson SI)",
            definition: "The Robinson Symmetry Index compares left and right step lengths. A value of 0% indicates perfect symmetry.",
            normalRange: "< 10% asymmetry",
            clinicalSignificance: "Asymmetry values above 10% may indicate limb-length discrepancy, unilateral weakness, pain avoidance, or neurological impairment. Persistent asymmetry warrants clinical gait analysis.",
            icon: "arrow.left.arrow.right",
            exerciseConditionKey: "gaitAsymmetry"
        ),
        "strideLength": MetricExplainer(
            metric: "Stride Length",
            definition: "The distance covered in one full gait cycle (two consecutive steps by the same foot), measured in meters.",
            normalRange: "1.2–1.6 m (varies by height)",
            clinicalSignificance: "Shortened stride length can indicate pain, fear of falling, hip flexor weakness, or neurological conditions such as Parkinson's disease. Stride length naturally decreases with age.",
            icon: "shoeprints.fill"
        ),
        "swayVelocity": MetricExplainer(
            metric: "Sway Velocity",
            definition: "The speed of center-of-mass displacement during quiet standing, measured in mm/s.",
            normalRange: "< 15 mm/s (quiet standing)",
            clinicalSignificance: "Elevated sway velocity indicates reduced postural control and increased fall risk. Values increase with age, vestibular dysfunction, peripheral neuropathy, and cerebellar pathology.",
            icon: "waveform.path"
        ),
        "kendall": MetricExplainer(
            metric: "Kendall Postural Classification",
            definition: "Classification of standing posture into one of four types based on the Kendall system: Ideal, Kyphotic-Lordotic, Flat-Back, or Sway-Back.",
            normalRange: "Ideal alignment",
            clinicalSignificance: "Each non-ideal postural type is associated with specific muscle imbalances. Kyphotic-Lordotic: tight hip flexors and weak abdominals. Flat-Back: tight hamstrings. Sway-Back: weak external obliques.",
            icon: "person.fill"
        )
    ]
}
// swiftlint:enable line_length

// MARK: - Explainer View

struct MetricExplainerView: View {
    let explainer: MetricExplainer
    @Environment(\.dismiss) private var dismiss
    @State private var showExercises = false

    /// Exercises relevant to this metric (if any).
    private var exercises: [ExerciseRecommendation] {
        guard let key = explainer.exerciseConditionKey else { return [] }
        return ExerciseLibrary.exercises(for: key)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    HStack {
                        Image(systemName: explainer.icon)
                            .font(.system(size: 36))
                            .foregroundStyle(.tint)
                        Spacer()
                    }

                    Text(explainer.metric)
                        .font(.title2.bold())

                    // Definition
                    sectionBlock(title: "Definition", content: explainer.definition)

                    // Normal Range
                    sectionBlock(title: "Normal Range", content: explainer.normalRange, highlight: true)

                    // Clinical Significance
                    sectionBlock(title: "Clinical Significance", content: explainer.clinicalSignificance)

                    // Corrective Exercises
                    if !exercises.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("When Out of Range")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.secondary)

                            VStack(alignment: .leading, spacing: 8) {
                                Text("If this metric falls outside the normal range, the following exercises may help:")
                                    .font(.callout)
                                    .foregroundStyle(.secondary)

                                ForEach(exercises.prefix(3)) { exercise in
                                    HStack(spacing: 10) {
                                        Image(systemName: exercise.icon)
                                            .font(.caption)
                                            .foregroundStyle(.tint)
                                            .frame(width: 24, height: 24)
                                            .background(.tint.opacity(0.1), in: Circle())

                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(exercise.name)
                                                .font(.subheadline.weight(.medium))
                                            Text(exercise.duration + " • " + exercise.frequency)
                                                .font(.caption2)
                                                .foregroundStyle(.secondary)
                                        }

                                        Spacer()
                                    }
                                }

                                Button {
                                    showExercises = true
                                } label: {
                                    HStack {
                                        Image(systemName: "figure.strengthtraining.traditional")
                                            .font(.caption)
                                        Text("View All \(exercises.count) Exercises")
                                            .font(.subheadline.weight(.semibold))
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption2)
                                    }
                                    .padding(.vertical, 10)
                                    .padding(.horizontal, 12)
                                    .background(.tint.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color.blue.opacity(0.05))
                            )
                        }
                    }

                    Spacer(minLength: 20)
                }
                .padding()
            }
            .navigationTitle("Metric Info")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showExercises) {
                ExerciseListView(
                    title: explainer.metric,
                    exercises: exercises
                )
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private func sectionBlock(title: String, content: String, highlight: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            Text(content)
                .font(.body)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(highlight ? Color.green.opacity(0.1) : Color(.systemGray6))
                )
        }
    }
}

#Preview {
    MetricExplainerView(explainer: MetricExplainer.library["cva"]!)
}
