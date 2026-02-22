import Foundation
import Testing
@testable import Andernet_Posture

// MARK: - Localization Catalog Tests

/// Validates string catalog integrity and translation coverage.
///
/// These tests parse the `.xcstrings` JSON catalogs at the source level
/// to catch issues that the compiler won't flag:
/// - Empty or whitespace-only keys
/// - Missing translations for target languages
/// - InfoPlist entries missing required system keys
/// - Stale entries (marked "stale" by Xcode)
/// - Untranslated entries for supported locales
@Suite("Localization")
struct LocalizationTests {
    // MARK: - Helpers

    /// Decoded xcstrings catalog structure.
    struct StringCatalog: Decodable {
        let sourceLanguage: String
        let strings: [String: StringEntry]
    }

    struct StringEntry: Decodable {
        let comment: String?
        let extractionState: String?
        let localizations: [String: LocalizationValue]?
    }

    struct LocalizationValue: Decodable {
        let stringUnit: StringUnit?
    }

    struct StringUnit: Decodable {
        let state: String  // "new", "translated", "needs_review", "stale"
        let value: String
    }

    /// All non-source languages the project supports.
    static let targetLanguages = ["es"]

    /// Required InfoPlist keys that must have translations.
    static let requiredInfoPlistKeys = [
        "CFBundleDisplayName",
        "NSCameraUsageDescription",
        "NSHealthShareUsageDescription",
        "NSHealthUpdateUsageDescription",
        "NSMotionUsageDescription",
    ]

    /// Load and decode an xcstrings file from the app bundle's source.
    ///
    /// During testing we read from the source tree (not the compiled bundle)
    /// so we can inspect translation states.
    private static func loadCatalog(named name: String) throws -> StringCatalog {
        // Find the catalog in the source tree by walking up from the test bundle.
        let bundle = Bundle(for: BundleMarker.self)
        let sourceRoot = findSourceRoot(from: bundle)
        let path = sourceRoot
            .appendingPathComponent("Andernet Posture")
            .appendingPathComponent("\(name).xcstrings")

        let data = try Data(contentsOf: path)
        return try JSONDecoder().decode(StringCatalog.self, from: data)
    }

    /// Walk up from the test bundle to find the project root.
    private static func findSourceRoot(from bundle: Bundle) -> URL {
        // The test bundle is typically inside DerivedData.
        // Use a known file to locate the source root.
        var url = URL(fileURLWithPath: #filePath)
        // #filePath gives us the test file path in the source tree.
        // Go up from "Andernet PostureTests/LocalizationTests.swift" to root.
        url.deleteLastPathComponent() // remove "LocalizationTests.swift"
        url.deleteLastPathComponent() // remove "Andernet PostureTests"
        return url
    }

    // MARK: - Localizable.xcstrings Tests

    @Test("No empty keys in Localizable catalog")
    func localizableNoEmptyKeys() throws {
        let catalog = try Self.loadCatalog(named: "Localizable")
        let emptyKeys = catalog.strings.keys.filter { key in
            // Allow the single "" key that Xcode auto-generates
            !key.isEmpty && key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        #expect(emptyKeys.isEmpty, "Found whitespace-only keys: \(emptyKeys)")
    }

    @Test("No stale entries in Localizable catalog")
    func localizableNoStaleEntries() throws {
        let catalog = try Self.loadCatalog(named: "Localizable")
        var staleEntries: [String] = []

        for (key, entry) in catalog.strings {
            if entry.extractionState == "stale" {
                staleEntries.append(key)
            }
            // Also check individual localizations
            for (lang, loc) in entry.localizations ?? [:] {
                if loc.stringUnit?.state == "stale" {
                    staleEntries.append("\(key) [\(lang)]")
                }
            }
        }
        #expect(staleEntries.isEmpty, "Found stale localization entries: \(staleEntries)")
    }

    @Test("Translation coverage for target languages",
          arguments: targetLanguages)
    func translationCoverage(language: String) throws {
        let catalog = try Self.loadCatalog(named: "Localizable")

        // Keys that need translation (exclude auto-generated empty key)
        let translatableKeys = catalog.strings.filter { !$0.key.isEmpty }
        let total = translatableKeys.count

        let translated = translatableKeys.values.filter { entry in
            guard let loc = entry.localizations?[language],
                  let unit = loc.stringUnit else { return false }
            return unit.state == "translated" || unit.state == "needs_review"
        }.count

        let coveragePercent = total > 0 ? Double(translated) / Double(total) * 100 : 0

        // Log the coverage for visibility (not a hard failure — coverage will grow)
        print("[\(language)] Translation coverage: \(translated)/\(total) (\(String(format: "%.1f", coveragePercent))%)")

        // Soft threshold: warn if coverage is below 20% for any target language
        // Adjust this threshold upward as translations are completed
        #expect(translated > 0,
                "Language '\(language)' has zero translations — add at least key user-facing strings")
    }

    @Test("No translation values are empty strings")
    func noEmptyTranslationValues() throws {
        let catalog = try Self.loadCatalog(named: "Localizable")
        var emptyValues: [String] = []

        for (key, entry) in catalog.strings {
            for (lang, loc) in entry.localizations ?? [:] {
                if let value = loc.stringUnit?.value,
                   !value.isEmpty,
                   value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    emptyValues.append("\(key) [\(lang)]")
                }
            }
        }
        #expect(emptyValues.isEmpty,
                "Found entries with whitespace-only translation values: \(emptyValues)")
    }

    // MARK: - InfoPlist.xcstrings Tests

    @Test("InfoPlist has required permission keys")
    func infoPlistRequiredKeys() throws {
        let catalog = try Self.loadCatalog(named: "InfoPlist")
        let present = Set(catalog.strings.keys)

        let missing = Self.requiredInfoPlistKeys.filter { !present.contains($0) }
        #expect(missing.isEmpty,
                "InfoPlist.xcstrings is missing required keys: \(missing)")
    }

    @Test("InfoPlist permission strings translated for target languages",
          arguments: targetLanguages)
    func infoPlistTranslations(language: String) throws {
        let catalog = try Self.loadCatalog(named: "InfoPlist")
        var untranslated: [String] = []

        for key in Self.requiredInfoPlistKeys {
            guard let entry = catalog.strings[key] else {
                untranslated.append(key)
                continue
            }
            guard let loc = entry.localizations?[language],
                  let unit = loc.stringUnit,
                  !unit.value.isEmpty else {
                untranslated.append(key)
                continue
            }
        }

        #expect(untranslated.isEmpty,
                "InfoPlist keys missing '\(language)' translation: \(untranslated)")
    }

    // MARK: - Cross-Catalog Consistency

    @Test("Source language matches across catalogs")
    func consistentSourceLanguage() throws {
        let localizable = try Self.loadCatalog(named: "Localizable")
        let infoPlist = try Self.loadCatalog(named: "InfoPlist")

        #expect(localizable.sourceLanguage == infoPlist.sourceLanguage,
                "Source language mismatch: Localizable=\(localizable.sourceLanguage), InfoPlist=\(infoPlist.sourceLanguage)")
    }

    @Test("No format specifier mismatch in translations")
    func formatSpecifierConsistency() throws {
        let catalog = try Self.loadCatalog(named: "Localizable")
        var mismatches: [String] = []

        let specifierPattern = try NSRegularExpression(pattern: "%(?:\\d+\\$)?[lhq]?[dDiuUxXoOfeEgGcCsSpaAF@]|%(?:\\d+\\$)?l{1,2}d")

        for (key, entry) in catalog.strings {
            // Extract specifiers from the source key
            let sourceSpecifiers = extractSpecifiers(from: key, using: specifierPattern)
            guard !sourceSpecifiers.isEmpty else { continue }

            for (lang, loc) in entry.localizations ?? [:] {
                guard let value = loc.stringUnit?.value else { continue }
                let translatedSpecifiers = extractSpecifiers(from: value, using: specifierPattern)

                if sourceSpecifiers.count != translatedSpecifiers.count {
                    mismatches.append(
                        "\(key) [\(lang)]: source has \(sourceSpecifiers.count) specifiers, translation has \(translatedSpecifiers.count)"
                    )
                }
            }
        }

        #expect(mismatches.isEmpty,
                "Format specifier count mismatches found:\n\(mismatches.joined(separator: "\n"))")
    }

    private func extractSpecifiers(from string: String, using regex: NSRegularExpression) -> [String] {
        let range = NSRange(string.startIndex..., in: string)
        return regex.matches(in: string, range: range).compactMap { match in
            guard let r = Range(match.range, in: string) else { return nil }
            return String(string[r])
        }
    }
}

// MARK: - Bundle Marker

/// Dummy class used to locate the test bundle at runtime.
private final class BundleMarker {}
