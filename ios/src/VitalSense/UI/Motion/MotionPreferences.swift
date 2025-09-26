import Foundation
#if canImport(UIKit)
import UIKit
#endif
import SwiftUI

// MARK: - Motion Preferences
public enum MotionPreferences {
    public static var reduced: Bool {
        #if canImport(UIKit)
        return UIAccessibility.isReduceMotionEnabled
        #else
        return false // Default to no motion reduction on non-iOS platforms
        #endif
    }

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
