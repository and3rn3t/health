import SwiftUI

// Stubbed GaitAROverlayView to unblock build; AR implementation disabled.
struct GaitAROverlayView: View {
    let protocolName: String
    let goalDistanceMeters: Double
    private let onStabilityIndex: (Double) -> Void

    init(protocolName: String, goalDistanceMeters: Double, onStabilityIndex: @escaping (Double) -> Void) {
        self.protocolName = protocolName
        self.goalDistanceMeters = goalDistanceMeters
        self.onStabilityIndex = onStabilityIndex
    }

    var body: some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.blue.opacity(0.08))
                .overlay(
                    VStack(spacing: 6) {
                        Text("AR Overlay Disabled")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(protocolName)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                        Text(String(format: "Goal: %.0f m", goalDistanceMeters))
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(8)
                )
        }
        .frame(maxWidth: .infinity, minHeight: 140, maxHeight: 160)
        .onAppear { // Provide a neutral stability index once so downstream UI has a value
            onStabilityIndex(0.0)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("AR gait overlay disabled placeholder")
    }
}
