import Foundation
import UIKit

// MARK: - Haptic Events
/// Semantic haptic events used across the app. Extend as new feedback types are needed.
public enum HapticEvent {
    case selection
    case success
    case warning
    case error
    case impactLight
    case impactMedium
    case impactHeavy
}

// MARK: - Haptics Manager
/// Centralized haptics manager with user preference + Reduce Motion gating.
/// Uses lightweight UIKit feedback generators (safe on device & simulator; no CoreHaptics dependency needed here).
final class Haptics {
    static let shared = Haptics()
    private init() {}

    private let preferenceKey = "enableHaptics"

    /// Returns whether the user has enabled haptics (default = true if unset) and Reduce Motion is disabled.
    private var isEnabled: Bool {
        let defaults = UserDefaults.standard
        let userSetting = defaults.object(forKey: preferenceKey) == nil ? true : defaults.bool(forKey: preferenceKey)
        // Respect reduce motion – treat it as an implicit opt-out of haptics to reduce sensory load.
        if UIAccessibility.isReduceMotionEnabled { return false }
        return userSetting
    }

    /// Update stored preference (invoked from Settings UI).
    func setEnabled(_ value: Bool) {
        UserDefaults.standard.set(value, forKey: preferenceKey)
    }

    /// Trigger a semantic haptic if enabled.
    func trigger(_ event: HapticEvent) {
        guard isEnabled else { return }
        switch event {
        case .selection:
            UISelectionFeedbackGenerator().selectionChanged()
        case .success:
            let gen = UINotificationFeedbackGenerator(); gen.notificationOccurred(.success)
        case .warning:
            let gen = UINotificationFeedbackGenerator(); gen.notificationOccurred(.warning)
        case .error:
            let gen = UINotificationFeedbackGenerator(); gen.notificationOccurred(.error)
        case .impactLight:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .impactMedium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .impactHeavy:
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        }
    }
}
