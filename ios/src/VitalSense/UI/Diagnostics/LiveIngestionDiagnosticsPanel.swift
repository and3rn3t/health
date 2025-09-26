import SwiftUI

// Stubbed LiveIngestionDiagnosticsPanel to unblock build; original implementation disabled.
struct LiveIngestionDiagnosticsPanel: View {
    var body: some View {
        VStack(spacing: 8) {
            Text("Live Ingestion Diagnostics Disabled")
                .font(.headline)
            Text("Stub panel – instrumentation removed in this build configuration.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 140)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground).opacity(0.4))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
        )
        .padding(.horizontal, 8)
    }
}

#if DEBUG
struct LiveIngestionDiagnosticsPanel_Previews: PreviewProvider {
    static var previews: some View {
        LiveIngestionDiagnosticsPanel()
            .previewLayout(.sizeThatFits)
            .padding()
    }
}
#endif
