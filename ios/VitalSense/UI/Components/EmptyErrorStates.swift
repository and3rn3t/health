import SwiftUI

// MARK: - Canonical Empty & Error States (VitalSense)
// Unified implementations (public) replacing duplicate legacy versions.

public struct EmptyStateView: View {
    let titleKey: String
    let messageKey: String?
    let icon: String?
    let action: (() -> Void)?
    let actionLabelKey: String?

    /// Primary initializer (modern variant)
    public init(titleKey: String = "empty_no_data", messageKey: String? = "empty_tap_retry", icon: String? = "tray", action: (() -> Void)? = nil, actionLabelKey: String? = nil) {
        self.titleKey = titleKey
        self.messageKey = messageKey
        self.icon = icon
        self.action = action
        self.actionLabelKey = actionLabelKey
    }

    /// Legacy convenience initializer (kept for backward source compatibility with older call sites)
    public init(titleKey: String, messageKey: String? = nil, icon: String = "exclamationmark.circle", actionTitleKey: String? = nil, action: (() -> Void)? = nil) {
        self.titleKey = titleKey
        self.messageKey = messageKey
        self.icon = icon
        self.actionLabelKey = actionTitleKey
        self.action = action
    }

    public var body: some View {
        VStack(spacing: 12) {
            if let icon { Image(systemName: icon).font(.system(size: 40)).foregroundStyle(.secondary).accessibilityHidden(true) }
            Text(loc(titleKey)).font(.headline).multilineTextAlignment(.center)
            if let messageKey { Text(loc(messageKey)).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center) }
            if let action, let actionLabelKey {
                Button(loc(actionLabelKey)) { action() }
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text("\(loc(titleKey)). \(messageKey != nil ? loc(messageKey!) : "")"))
        .onAppear { Telemetry.shared.record(.emptyShown(kind: titleKey)) }
    }
}

public struct ErrorStateView: View {
    let titleKey: String
    let message: String?
    let retry: (() -> Void)?
    let icon: String

    /// Modern initializer
    public init(titleKey: String = "error_generic_title", message: String? = nil, retry: (() -> Void)? = nil, icon: String = "exclamationmark.triangle.fill") {
        self.titleKey = titleKey
        self.message = message
        self.retry = retry
        self.icon = icon
    }

    /// Legacy initializer compatibility (retryKey param collapsed) – maps to modern signature.
    public init(titleKey: String = "error_generic_title", retryKey: String = "error_retry_button", icon: String = "exclamationmark.triangle", onRetry: @escaping () -> Void) {
        self.titleKey = titleKey
        self.message = nil
        self.retry = onRetry
        self.icon = icon
    }

    public var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 42))
                .foregroundStyle(.orange)
                .accessibilityHidden(true)
            Text(loc(titleKey)).font(.headline).multilineTextAlignment(.center)
            if let message { Text(message).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center) }
            if let retry { Button(loc("error_retry_button")) { retry() }.buttonStyle(.borderedProminent) }
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text(loc(titleKey)))
        .onAppear { Telemetry.shared.record(.errorShown(kind: titleKey)) }
    }
}

#if DEBUG
struct EmptyErrorStates_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            EmptyStateView()
                .previewDisplayName("Empty Default")
            ErrorStateView(message: "Network timeout") { }
                .previewDisplayName("Error Default")
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
#endif
