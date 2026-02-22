//
//  Formatters.swift
//  Andernet Posture
//
//  Shared formatting utilities.
//

import Foundation

extension TimeInterval {
    /// Format as "M:SS" string.
    var mmss: String {
        let total = Int(self)
        let minutes = total / 60
        let seconds = total % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    /// Format as "M:SS.t" string (with tenths of a second).
    var mmssWithTenths: String {
        let total = Int(self)
        let minutes = total / 60
        let seconds = total % 60
        let tenths = Int((self - Double(total)) * 10)
        return String(format: "%d:%02d.%d", minutes, seconds, tenths)
    }

    /// Format as locale-aware abbreviated duration (e.g., "2h 30m" in English,
    /// "2 h 30 min" in Spanish). Uses `DateComponentsFormatter` which
    /// automatically adapts to the user's locale.
    var longForm: String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = self >= 3600 ? [.hour, .minute] : [.minute]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: self) ?? "0 min"
    }
}

extension Double {
    /// Format as degrees string.
    var degreesString: String {
        String(format: "%.1f°", self)
    }

    /// Format as percentage string.
    var percentString: String {
        String(format: "%.0f%%", self)
    }

    /// Format as meters string.
    var metersString: String {
        String(format: "%.2f m", self)
    }
}
