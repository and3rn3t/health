//
//  DisplayNames.swift
//  Andernet Posture
//
//  Centralized display-name helpers for clinical classification strings.
//

import Foundation

extension String {

    /// Human-readable label for a Kendall posture classification raw value.
    /// Uses `String(localized:)` so these appear in the String Catalog for translation.
    var kendallDisplayName: String {
        switch self {
        case "ideal":             return String(localized: "Ideal")
        case "kyphosisLordosis":  return String(localized: "Kyphosis-Lordosis")
        case "flatBack":          return String(localized: "Flat Back")
        case "swayBack":          return String(localized: "Sway Back")
        default:                  return self.capitalized
        }
    }

    /// Abbreviated Kendall label for compact UI contexts (dashboard cards).
    var kendallShortName: String {
        switch self {
        case "ideal":             return String(localized: "Ideal")
        case "kyphosisLordosis":  return String(localized: "Kypho-Lord")
        case "flatBack":          return String(localized: "Flat Back")
        case "swayBack":          return String(localized: "Sway Back")
        default:                  return self.capitalized
        }
    }

    /// Human-readable label for a gait pattern classification raw value.
    var patternDisplayName: String {
        switch self {
        case "normal":         return String(localized: "Normal")
        case "antalgic":       return String(localized: "Antalgic")
        case "trendelenburg":  return String(localized: "Trendelenburg")
        case "festinating":    return String(localized: "Festinating")
        case "circumduction":  return String(localized: "Circumduction")
        case "ataxic":         return String(localized: "Ataxic")
        case "waddling":       return String(localized: "Waddling")
        case "steppage":       return String(localized: "Steppage")
        default:               return self.capitalized
        }
    }
}
