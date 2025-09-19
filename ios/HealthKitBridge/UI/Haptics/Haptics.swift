import UIKit

// MARK: - Semantic Haptics
// Centralizes feedback generation, pre-warming generators and respecting Reduce Motion where appropriate.

public enum HapticEvent {
    case success
    case warning
    case error
    case selection
    case impactLight
    case impactMedium
    case impactHeavy
}

public final class Haptics {
    public static let shared = Haptics()

    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let notification = UINotificationFeedbackGenerator()
    private let selection = UISelectionFeedbackGenerator()

    private init() { prepareAll() }

    public func prepareAll() {
        impactLight.prepare(); impactMedium.prepare(); impactHeavy.prepare()
        notification.prepare(); selection.prepare()
    }

    public func trigger(_ event: HapticEvent) {
        // Respect Reduce Motion – some teams still vibrate lightly. Here: full opt-out.
        guard !UIAccessibility.isReduceMotionEnabled else { return }
        switch event {
        case .success: notification.notificationOccurred(.success)
        case .warning: notification.notificationOccurred(.warning)
        case .error: notification.notificationOccurred(.error)
        case .selection: selection.selectionChanged()
        case .impactLight: impactLight.impactOccurred()
        case .impactMedium: impactMedium.impactOccurred()
        case .impactHeavy: impactHeavy.impactOccurred()
        }
    }
}
