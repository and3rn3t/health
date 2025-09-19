import SwiftUI
import UIKit

// MARK: - Motion Preferences
public enum MotionPreferences {
    public static var reduced: Bool { UIAccessibility.isReduceMotionEnabled }

    /// Execute changes with or without animation depending on user preference.
    public static func perform(
        animation: Animation? = .default,
        _ changes: @escaping () -> Void
    ) {
        if reduced {
            let transaction = Transaction(animation: nil)
            withTransaction(transaction) { changes() }
        } else {
            withAnimation(animation, changes)
        }
    }
}

public struct ConditionalAnimated<Content: View>: View {
    let animation: Animation
    let content: () -> Content
    public init(animation: Animation = .default, @ViewBuilder content: @escaping () -> Content) {
        self.animation = animation
        self.content = content
    }
    public var body: some View {
        if MotionPreferences.reduced { content() } else { content().transition(.opacity.animation(animation)) }
    }
}
