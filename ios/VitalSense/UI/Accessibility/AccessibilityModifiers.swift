import SwiftUI
import UIKit

// MARK: - Accessibility Helpers
// Lightweight, reusable accessibility modifiers so Views remain uncluttered.
// Keep line lengths <150 and avoid force unwraps per SwiftLint guidelines.

public struct AccessibilitySummary: ViewModifier {
    let label: String
    let value: String?
    let hint: String?
    let traits: AccessibilityTraits

    public func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .combine)
            .accessibilityLabel(Text(label))
            .accessibilityValue(Text(value ?? ""))
            .accessibilityHint(Text(hint ?? ""))
            .accessibilityAddTraits(traits)
    }
}

public extension View {
    func accessibilitySummary(
        label: String,
        value: String? = nil,
        hint: String? = nil,
        traits: AccessibilityTraits = [.isStaticText]
    ) -> some View {
        modifier(
            AccessibilitySummary(
                label: label,
                value: value,
                hint: hint,
                traits: traits
            )
        )
    }
}

// MARK: - Dynamic Type Stress Preview (DEBUG only)
#if DEBUG
struct AccessibilityPreviewGroup<Content: View>: View {
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    var body: some View {
        Group {
            ForEach(dynamicSizes, id: \.self) { size in
                content()
                    .environment(\.dynamicTypeSize, size)
                    .previewDisplayName("DT: \(size.description)")
            }
        }
    }

    private var dynamicSizes: [DynamicTypeSize] {
        [
            .xSmall, .small, .medium, .large, .xLarge, .xxLarge, .xxxLarge,
            .accessibility1, .accessibility2, .accessibility3
        ]
    }
}
#endif
