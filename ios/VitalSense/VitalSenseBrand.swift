import SwiftUI

struct VitalSenseBrand {
    struct Colors {
        static let primary = Color.blue
        static let secondary = Color.green
        static let accent = Color.orange
        static let success = Color.green
        static let warning = Color.yellow
        static let error = Color.red
        static let textPrimary = Color.primary
        static let textSecondary = Color.secondary
        static let textMuted = Color.gray
        static let background = Color(UIColor.systemBackground)
        static let cardBackground = Color(UIColor.secondarySystemBackground)
    }
    
    struct Typography {
        static let title = Font.largeTitle
        static let headline = Font.headline
        static let body = Font.body
        static let caption = Font.caption
    }
    
    struct Spacing {
        static let small: CGFloat = 8
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let extraLarge: CGFloat = 32
    }
    
    struct CornerRadius {
        static let small: CGFloat = 4
        static let medium: CGFloat = 8
        static let large: CGFloat = 16
    }
}
