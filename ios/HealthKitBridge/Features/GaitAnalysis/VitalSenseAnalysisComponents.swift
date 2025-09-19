import SwiftUI

// MARK: - VitalSense Analysis Components

struct VitalSenseAnalysisCard: View {
    let icon: String
    let title: String
    let content: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: VitalSenseBrand.Layout.medium) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.small) {
                Text(title)
                    .font(VitalSenseBrand.Typography.body)
                    .fontWeight(.semibold)
                    .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                Text(content)
                    .font(VitalSenseBrand.Typography.body)
                    .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                    .lineLimit(nil)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(color.opacity(0.1))
        .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: VitalSenseBrand.Layout.cornerRadius)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

struct VitalSenseRecommendationsCard: View {
    let recommendations: [String]
    let metricType: GaitMetricType
    var isLoading: Bool = false
    var error: Error? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(VitalSenseBrand.Colors.warning)
                    .font(.title3)

                Text(loc("gait_recommendations_title"))
                    .font(VitalSenseBrand.Typography.heading3)
                    .foregroundStyle(VitalSenseBrand.Colors.textPrimary)
            }

            if let error {
                ErrorStateView(onRetry: { /* TODO: inject retry callback */ })
            } else if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
            } else if recommendations.isEmpty {
                EmptyStateView(titleKey: "empty_no_data", messageKey: "empty_tap_retry", icon: "lightbulb")
            } else {
                VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.small) {
                    ForEach(recommendations.indices, id: \.self) { index in
                        HStack(alignment: .top, spacing: VitalSenseBrand.Layout.small) {
                            Circle()
                                .fill(metricType.vitalSenseColor)
                                .frame(width: 6, height: 6)
                                .padding(.top, 6)

                            Text(recommendations[index])
                                .font(VitalSenseBrand.Typography.body)
                                .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                                .lineLimit(nil)
                        }
                    }
                }
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(VitalSenseBrand.Colors.warning.opacity(0.05))
        .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: VitalSenseBrand.Layout.cornerRadius)
                .stroke(VitalSenseBrand.Colors.warning.opacity(0.2), lineWidth: 1)
        )
    }
}

struct VitalSenseProgressIndicator: View {
    let value: Double
    let target: Double
    let metric: GaitMetricType
    @State private var animateProgress = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var progressPercentage: Double {
        value / target
    }

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Image(systemName: "target")
                    .foregroundStyle(metric.vitalSenseGradient)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(loc("gait_progress_title"))
                        .font(VitalSenseBrand.Typography.body)
                        .fontWeight(.semibold)
                        .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                    Text(String(format: loc("gait_progress_optimal_format"), Int(progressPercentage * 100)))
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }

                Spacer()

                Text("\(Int(progressPercentage * 100))%")
                    .font(VitalSenseBrand.Typography.heading2)
                    .fontWeight(.bold)
                    .foregroundStyle(metric.vitalSenseGradient)
            }

            // Progress Ring
            ZStack {
                Circle()
                    .stroke(metric.vitalSenseColor.opacity(0.2), lineWidth: 8)
                    .frame(width: 80, height: 80)

                Circle()
                    .trim(from: 0, to: (reduceMotion ? progressPercentage : (animateProgress ? progressPercentage : 0)))
                    .stroke(metric.vitalSenseGradient, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 80, height: 80)
                    .rotationEffect(.degrees(-90))
                    .animation(reduceMotion ? nil : VitalSenseBrand.Animations.spring.delay(0.5), value: animateProgress)

                Image(systemName: metric.vitalSenseIcon)
                    .foregroundStyle(metric.vitalSenseColor)
                    .font(.title2)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(VitalSenseBrand.Colors.cardBackground)
        .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
        .onAppear { animateProgress = true }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text("\(metric.displayName) \(Int(progressPercentage * 100))%"))
    }
}

// MARK: - Gait Analysis Container
struct VitalSenseAnalysisContainer: View {
    @ObservedObject var viewModel: GaitAnalysisViewModel
    var retry: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.large) {
            switch viewModel.state {
            case .idle, .loading:
                ProgressView()
                    .frame(maxWidth: .infinity)
            case .error:
                ErrorStateView(onRetry: { retry?() ?? viewModel.retry() })
            case .empty:
                EmptyStateView(titleKey: "empty_no_data", messageKey: "empty_tap_retry", icon: "chart.line.uptrend.xyaxis")
            case .ready:
                VitalSenseProgressIndicator(value: viewModel.value, target: viewModel.target, metric: viewModel.metric)
                VitalSenseRecommendationsCard(recommendations: viewModel.recommendations, metricType: viewModel.metric)
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
    }
}

