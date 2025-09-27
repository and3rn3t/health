import SwiftUI
import WidgetKit

struct VitalSenseWatchComplication: View {
    @Environment(\.widgetFamily) var widgetFamily
    let gaitMetrics: WatchGaitMetrics?

    @State private var animationTrigger = false

    var body: some View {
        switch widgetFamily {
        case .accessoryCorner:
            cornerView
        case .accessoryCircular:
            circularView
        default:
            EmptyView()
        }
    }

    private var cornerView: some View {
        VStack {
            if #available(iOS 26.0, watchOS 13.0, *) {
                // iOS 26 Enhanced corner complication
                Image(systemName: "figure.walk")
                    .foregroundStyle(iOS26Integration.gradientStyle(for: .activity))
                    .symbolEffect(
                        .variableColor.iterative.dimInactiveLayers.nonReversing,
                        options: .speed(1.2),
                        value: animationTrigger
                    )
                    .symbolEffect(
                        .pulse.byLayer,
                        options: .repeat(.continuous).speed(0.6),
                        value: animationTrigger
                    )
            } else {
                Image(systemName: "figure.walk")
                    .foregroundColor(.green)
            }

            Text(gaitMetrics?.speed.formatted(.number.precision(.fractionLength(1))) ?? "1.2")
                .font(.caption)
                .contentTransition(.numericText(value: gaitMetrics?.speed ?? 1.2))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8).delay(0.3)) {
                animationTrigger = true
            }
        }
    }

    private var circularView: some View {
        VStack {
            if #available(iOS 26.0, watchOS 13.0, *) {
                // iOS 26 Enhanced circular complication
                VStack(spacing: 2) {
                    Text(gaitMetrics?.speed.formatted(.number.precision(.fractionLength(1))) ?? "1.2")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundStyle(iOS26Integration.gradientStyle(for: .activity))
                        .contentTransition(.numericText(value: gaitMetrics?.speed ?? 1.2))

                    Text("m/s")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .background {
                    Circle()
                        .fill(iOS26Integration.liquidGlassMaterial().opacity(0.3))
                        .frame(width: 40, height: 40)
                }
            } else {
                VStack {
                    Text(gaitMetrics?.speed.formatted(.number.precision(.fractionLength(1))) ?? "1.2")
                        .font(.title2)
                    Text("m/s")
                        .font(.caption)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).delay(0.5)) {
                animationTrigger = true
            }
        }
    }
}
