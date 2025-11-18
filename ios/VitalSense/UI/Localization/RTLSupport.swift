import SwiftUI

/// Right-to-Left (RTL) language support helpers
struct RTLSupport {
    /// Checks if the current locale uses RTL layout
    static var isRTL: Bool {
        return Locale.current.language.languageCode?.identifier == "ar" ||
               Locale.current.language.languageCode?.identifier == "he" ||
               Locale.current.language.languageCode?.identifier == "fa" ||
               Locale.current.language.languageCode?.identifier == "ur" ||
               UIApplication.shared.userInterfaceLayoutDirection == .rightToLeft
    }
}

extension View {
    /// Applies RTL-aware layout direction
    func rtlAware() -> some View {
        self.environment(\.layoutDirection, RTLSupport.isRTL ? .rightToLeft : .leftToRight)
    }

    /// Flips the view horizontally for RTL languages
    func flippedForRTL() -> some View {
        self.scaleEffect(x: RTLSupport.isRTL ? -1 : 1, y: 1)
    }

    /// Applies RTL-aware alignment
    func rtlAlignment(_ alignment: Alignment) -> some View {
        if RTLSupport.isRTL {
            switch alignment {
            case .leading:
                return self.frame(maxWidth: .infinity, alignment: .trailing)
            case .trailing:
                return self.frame(maxWidth: .infinity, alignment: .leading)
            default:
                return self.frame(maxWidth: .infinity, alignment: alignment)
            }
        } else {
            return self.frame(maxWidth: .infinity, alignment: alignment)
        }
    }
}
