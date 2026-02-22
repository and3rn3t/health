//
//  HelpView.swift
//  Andernet Posture
//
//  In-app help and FAQ view.
//

import SwiftUI

struct HelpView: View {
    var body: some View {
        NavigationStack {
            List {
                gettingStartedSection
                understandingMetricsSection
                clinicalTestsSection
                accuracySection
                healthKitSection
                troubleshootingSection
            }
            .navigationTitle("Help & FAQ")
        }
    }

    // MARK: - Getting Started

    @ViewBuilder
    private var gettingStartedSection: some View {
        Section("Getting Started") {
            faqItem(
                question: "How should I position my device?",
                icon: "iphone.and.arrow.forward",
                answer: "Position your device on a stable surface "
                    + "(table, tripod) with the rear camera facing you. "
                    + "Stand 1.5–2 meters from the camera for optimal "
                    + "full-body tracking. Ensure your entire body is "
                    + "visible in the frame from head to feet."
            )
            faqItem(
                question: "What lighting conditions are best?",
                icon: "sun.max.fill",
                answer: "Use a well-lit environment with even lighting. "
                    + "Avoid strong backlighting (e.g., standing in front "
                    + "of a window). Natural daylight or bright indoor "
                    + "lighting works best. The AR body tracking system "
                    + "needs clear visibility of your body outline."
            )
            faqItem(
                question: "What should I wear?",
                icon: "tshirt.fill",
                answer: "Wear form-fitting clothing when possible. "
                    + "Loose or baggy clothing can obscure joint positions "
                    + "and reduce tracking accuracy. Avoid clothing that "
                    + "matches the background color."
            )
        }
    }

    // MARK: - Understanding Metrics

    @ViewBuilder
    private var understandingMetricsSection: some View {
        Section("Understanding Metrics") {
            faqItem(
                question: "Posture",
                icon: "figure.stand",
                answer: "Posture metrics include Craniovertebral Angle "
                    + "(CVA), Sagittal Vertical Axis (SVA), trunk lean, "
                    + "and shoulder/hip alignment. The composite posture "
                    + "score (0–100) aggregates these into a single "
                    + "indicator where higher is better."
            )
            faqItem(
                question: "Gait",
                icon: "figure.walk",
                answer: "Gait metrics capture walking speed, cadence "
                    + "(steps per minute), stride length, step symmetry "
                    + "(Robinson SI), and gait pattern classification. "
                    + "Walking speed below 0.8 m/s is a key sarcopenia "
                    + "screening cutoff."
            )
            faqItem(
                question: "Range of Motion",
                icon: "arrow.triangle.branch",
                answer: "ROM tracks joint flexibility across major joints. "
                    + "Measurements are compared against age- and "
                    + "sex-stratified normative data when demographics "
                    + "are configured in Settings."
            )
            faqItem(
                question: "Balance",
                icon: "scale.3d",
                answer: "Balance is assessed via center-of-mass sway "
                    + "velocity, mediolateral excursion, and postural "
                    + "stability indices. Higher sway velocities indicate "
                    + "reduced balance control."
            )
            faqItem(
                question: "Risk Scores",
                icon: "exclamationmark.triangle",
                answer: "Risk scores include Fall Risk, REBA ergonomic "
                    + "assessment, fatigue index, and Fried frailty "
                    + "phenotype screening. These are screening "
                    + "tools — not diagnostic instruments."
            )
        }
    }

    // MARK: - Clinical Tests

    @ViewBuilder
    private var clinicalTestsSection: some View {
        Section("Clinical Tests") {
            faqItem(
                question: "When should I use each test?",
                icon: "stethoscope",
                answer: "TUG: Stand from a chair, walk 3m, turn, return, "
                    + "sit. Normal <12s.\n\nRomberg: Stand with feet "
                    + "together, eyes closed, 30s. Assesses "
                    + "proprioceptive balance.\n\n6MWT: Walk as far as "
                    + "possible in 6 minutes. Measures functional "
                    + "exercise capacity."
            )
            faqItem(
                question: "How do I interpret results?",
                icon: "chart.bar.xaxis",
                answer: "Results are compared against published normative "
                    + "data. Green = normal, yellow = mild deviation, "
                    + "orange = moderate concern, red = significant. "
                    + "Always discuss abnormal results with a provider."
            )
        }
    }

    // MARK: - Accuracy

    @ViewBuilder
    private var accuracySection: some View {
        Section("Accuracy & Limitations") {
            faqItem(
                question: "How accurate is the tracking?",
                icon: "scope",
                answer: "ARKit body tracking provides joint angle estimates "
                    + "with ~5–10° accuracy compared to marker-based "
                    + "motion capture. Suitable for screening and trend "
                    + "monitoring but does not replace lab-grade "
                    + "instrumentation."
            )
            faqItem(
                question: "Proxy vs. gold-standard measurements",
                icon: "info.circle",
                answer: "Clinical measurements are proxy estimates from "
                    + "camera-based tracking. They approximate but do "
                    + "not replicate gold-standard measurements from "
                    + "force plates, EMG, or radiographic imaging. "
                    + "Use for personal awareness and screening only."
            )
        }
    }

    // MARK: - HealthKit

    @ViewBuilder
    private var healthKitSection: some View {
        Section("HealthKit Integration") {
            faqItem(
                question: "What data is synced to HealthKit?",
                icon: "heart.fill",
                answer: "Walking speed, step count, and walking asymmetry "
                    + "can be synced to Apple Health. No data is sent to "
                    + "external servers. You can toggle HealthKit sync "
                    + "at any time in Settings."
            )
        }
    }

    // MARK: - Troubleshooting

    @ViewBuilder
    private var troubleshootingSection: some View {
        Section("Troubleshooting") {
            faqItem(
                question: "Body not detected",
                icon: "person.fill.questionmark",
                answer: "Stand 1.5–2m from the camera with full body "
                    + "visible. Ensure adequate lighting and sufficient "
                    + "contrast between your body and the background."
            )
            faqItem(
                question: "Poor tracking quality",
                icon: "exclamationmark.triangle.fill",
                answer: "Can result from: insufficient lighting, reflective "
                    + "surfaces, fast movements, loose clothing, or "
                    + "partial body occlusion. Slow your movements "
                    + "and improve lighting."
            )
            faqItem(
                question: "Data or saving issues",
                icon: "externaldrive.badge.exclamationmark",
                answer: "Check available device storage. Manage stored "
                    + "sessions in Settings > Manage Data. In-memory "
                    + "fallback mode means data will not persist "
                    + "between launches."
            )
        }
    }

    // MARK: - Reusable FAQ Item

    @ViewBuilder
    private func faqItem(
        question: String,
        icon: String,
        answer: String
    ) -> some View {
        DisclosureGroup {
            Text(answer)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        } label: {
            Label(question, systemImage: icon)
        }
    }
}

#Preview {
    HelpView()
}
