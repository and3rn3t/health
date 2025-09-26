import SwiftUI

struct VitalSenseFallRiskContainer: View {
    @ObservedObject var viewModel: FallRiskViewModel
    let showDetails: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:
                loadingView
            case .error:
                ErrorStateView(retry: { viewModel.retry() })
            case .empty:
                EmptyStateView(titleKey: "empty_no_data", messageKey: "empty_tap_retry", icon: "figure.fall", action: { viewModel.retry() }, actionLabelKey: "retry_button")
            case .ready:
                content
            }
        }
        .onAppear { if viewModel.state == .idle { viewModel.load(simulated: true) } }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text(loc("loading_generic"))
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text(loc("loading_generic")))
    }

    private var content: some View {
        VStack(spacing: 20) {
            hero
            if !viewModel.recommendations.isEmpty {
                recommendationsSection
            }
        }
        .frame(maxWidth: .infinity, alignment: .top)
        .transition(.opacity.animation(.easeInOut(duration: 0.25)))
    }

    private var hero: some View {
        VStack(spacing: 12) {
            VitalSenseProgressRing(
                progress: viewModel.riskLevel.progressValue,
                title: viewModel.riskLevel.vitalSenseDescription,
                subtitle: loc("fall_risk_title"),
                gradient: viewModel.riskLevel.vitalSenseGradient,
                size: 140
            )
            .accessibilityLabel(
                AccessibilityHelpers.fallRiskSummary(
                    levelName: viewModel.riskLevel.vitalSenseTitle,
                    subtitle: viewModel.riskLevel.vitalSenseSubtitle
                )
            )
            if let last = viewModel.lastUpdated {
                Text(String(format: loc("last_updated_format"), last as CVarArg))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel(Text(loc("last_updated_a11y")))
            }
        }
        .padding(16)
        .vitalSenseCard()
    }

    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(loc("recommendations_title"))
                    .font(.headline)
                Spacer()
                Button(loc("view_all_button")) { showDetails() }
                    .font(.caption)
            }
            ForEach(viewModel.recommendations.prefix(3), id: \.self) { reco in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "lightbulb")
                        .foregroundColor(viewModel.riskLevel.vitalSenseColor)
                        .font(.caption)
                    Text(reco)
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.leading)
                        .accessibilityLabel(Text(reco))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            if viewModel.recommendations.count > 3 {
                Text(String(format: loc("more_recommendations_format"), viewModel.recommendations.count - 3))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .vitalSenseCard()
        .accessibilityElement(children: .contain)
    }
}

#if DEBUG
struct VitalSenseFallRiskContainer_Previews: PreviewProvider {
    static var previews: some View {
        VitalSenseFallRiskContainer(viewModel: { let vm = FallRiskViewModel(); vm.load(simulated: true); return vm }(), showDetails: {})
            .padding()
    }
}
#endif
