import Foundation
import SwiftUI

// MARK: - Localization Helpers
// Provides a simple wrapper around NSLocalizedString plus formatting & pluralization utilities.

private let pseudoLocalePreferenceKey = "enablePseudoLocale"

@inline(__always)
public func loc(_ key: String) -> String {
    let value = NSLocalizedString(key, comment: "")
    return applyPseudoLocaleIfNeeded(raw: value)
}

// Overload with fallback used by permission flow
@inline(__always)
public func loc(_ key: String, fallback: String) -> String {
    let value = NSLocalizedString(key, comment: "")
    if value == key { return applyPseudoLocaleIfNeeded(raw: fallback) }
    return applyPseudoLocaleIfNeeded(raw: value)
}

/// Format a localized template with integer argument(s).
public func locFormat(_ key: String, _ args: CVarArg...) -> String { String(format: loc(key), arguments: args) }

/// Basic pluralization using the `.stringsdict` approach if added later; for now simple branching.
public func locPlural(baseKey: String, count: Int) -> String {
    let dictValue = NSLocalizedString(baseKey, comment: "")
    if dictValue != baseKey { // stringsdict variant exists
        return String(format: dictValue, count)
    }
    let pluralKey = count == 1 ? baseKey + "_one" : baseKey + "_other"
    let legacyValue = NSLocalizedString(pluralKey, comment: "")
    if legacyValue == pluralKey { return String(count) }
    return String(format: legacyValue, count)
}

/// Localized SwiftUI text convenience.
public func L(_ key: String) -> Text { Text(loc(key)) }

// MARK: - Pseudo-locale Transformation
private func applyPseudoLocaleIfNeeded(raw: String) -> String {
    guard UserDefaults.standard.bool(forKey: pseudoLocalePreferenceKey) else { return raw }
    // Preserve format tokens like %d, %.1f, %@, %ld, etc.
    var result = ""
    var i = raw.startIndex
    func isFormatSpecifierChar(_ c: Character) -> Bool {
        "@difsuxXoOeEgGcC%".contains(c)
    }
    while i < raw.endIndex {
        let ch = raw[i]
        if ch == "%" { // capture full format token
            var j = raw.index(after: i)
            while j < raw.endIndex {
                let cj = raw[j]
                if isFormatSpecifierChar(cj) { j = raw.index(after: j); break }
                j = raw.index(after: j)
            }
            result.append(String(raw[i..<j]))
            i = j
            continue
        }
        result.append(pseudoMap(String(ch)))
        i = raw.index(after: i)
    }
    if result.count < 4 { return "[¡¡ " + result + " !!]" }
    return "[¡¡ " + result + " •" + String(repeating: "˜", count: max(0, Int(Double(result.count) * 0.15))) + " !!]"
}

private func pseudoMap(_ s: String) -> String {
    switch s.lowercased() {
    case "a": return "å"
    case "e": return "ë"
    case "i": return "î"
    case "o": return "ø"
    case "u": return "ü"
    case "c": return "ç"
    case "y": return "ÿ"
    default: return s
    }
}

public func setPseudoLocaleEnabled(_ enabled: Bool) { UserDefaults.standard.set(enabled, forKey: pseudoLocalePreferenceKey) }
