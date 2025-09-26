import SwiftUI

// Stubbed TelemetryDiagnosticsView to unblock build; full diagnostics UI disabled.
struct TelemetryDiagnosticsView: View {
    var body: some View {
        VStack(spacing: 8) {
            Text("Telemetry Diagnostics Disabled")
                .font(.headline)
            Text("Stub view – original instrumentation removed in this build configuration.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground).opacity(0.5))
        )
        .padding(.horizontal)
        .navigationTitle("Telemetry")
    }
}

#if DEBUG
struct TelemetryDiagnosticsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack { TelemetryDiagnosticsView() }
            .previewLayout(.sizeThatFits)
            .padding()
    }
}
#endif
