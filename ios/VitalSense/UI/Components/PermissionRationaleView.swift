import SwiftUI

// MARK: - PermissionRationaleView
/// Educates user before triggering HealthKit permission dialogs.
/// Provide required sample types & a short purpose description for transparency.
struct PermissionRationaleView: View {
    struct RequiredType: Identifiable, Hashable {
        let id = UUID()
        let title: String
        let description: String
        let systemImage: String
    }

    let types: [RequiredType]
    let onContinue: () -> Void
    let onDismiss: (() -> Void)?

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    ForEach(types) { item in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: item.systemImage)
                                .foregroundColor(.accentColor)
                                .font(.title3)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.title)
                                    .font(.headline)
                                Text(item.description)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                    Spacer(minLength: 8)
                    Button(action: onContinue) {
                        Text(loc("perm_continue_button"))
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("perm_rationale_continue")
                }
                .padding(24)
            }
            .navigationTitle(Text(loc("perm_rationale_nav_title")))
            .toolbar { if let onDismiss { ToolbarItem(placement: .cancellationAction) { Button(loc("close_button")) { onDismiss(); dismiss() } } } }
        }
        .accessibilityElement(children: .contain)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(loc("perm_rationale_title"))
                .font(.title2.bold())
            Text(loc("perm_rationale_intro"))
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

#if DEBUG
struct PermissionRationaleView_Previews: PreviewProvider {
    static var previews: some View {
        PermissionRationaleView(
            types: [
                .init(title: "Heart Rate", description: "Helps calculate exertion & recovery trends.", systemImage: "heart.fill"),
                .init(title: "Steps", description: "Supports activity insights and mobility analytics.", systemImage: "figure.walk"),
                .init(title: "Sleep", description: "Improves recovery and readiness recommendations.", systemImage: "bed.double.fill")
            ],
            onContinue: {},
            onDismiss: {}
        )
    }
}
#endif
