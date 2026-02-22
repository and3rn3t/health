//
//  Theme.swift
//  Andernet Posture
//
//  Centralized design tokens: colors, spacing, corner radii, shadows, and fonts.
//

import SwiftUI

// MARK: - Colors

enum AppColors {

    // MARK: Brand Gradients

    static let accentGradient = LinearGradient(
        colors: accentGradientColors,
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let accentGradientColors: [Color] = [
        Color(red: 0.08, green: 0.72, blue: 0.65), .indigo
    ]

    /// Very subtle branded tint for non-AR view backgrounds.
    static let brandedBackground = LinearGradient(
        colors: [Color(red: 0.08, green: 0.72, blue: 0.65).opacity(0.03), .clear],
        startPoint: .top,
        endPoint: .bottom
    )

    // MARK: Severity (Single Source of Truth)

    /// Universal severity → SwiftUI Color mapping. Supports high-contrast mode.
    static func severityColor(
        for severity: ClinicalSeverity,
        highContrast: Bool = false
    ) -> Color {
        if highContrast {
            switch severity {
            case .normal:   return Color(red: 0.0, green: 0.6, blue: 0.0)
            case .mild:     return Color(red: 0.7, green: 0.6, blue: 0.0)
            case .moderate: return Color(red: 0.8, green: 0.35, blue: 0.0)
            case .severe:   return Color(red: 0.8, green: 0.0, blue: 0.0)
            }
        }
        switch severity {
        case .normal:   return .green
        case .mild:     return .yellow
        case .moderate: return .orange
        case .severe:   return .red
        }
    }

    /// Universal severity → UIColor mapping for RealityKit / UIKit layers.
    static func severityUIColor(for severity: ClinicalSeverity) -> UIColor {
        switch severity {
        case .normal:   return .systemGreen
        case .mild:     return .systemYellow
        case .moderate: return .systemOrange
        case .severe:   return .systemRed
        }
    }

    // MARK: Score Coloring

    /// Posture score → Color (0–100 scale).
    static func scoreColor(for score: Double) -> Color {
        switch score {
        case 80...:     return .green
        case 60..<80:   return .yellow
        case 40..<60:   return .orange
        default:        return .red
        }
    }

    /// Posture score → gradient for rings and buttons.
    static func scoreGradient(for score: Double) -> LinearGradient {
        let color = scoreColor(for: score)
        return LinearGradient(
            colors: [color.opacity(0.7), color],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Posture score → UIColor for RealityKit heatmap overlay.
    static func scoreUIColor(for score: Double) -> UIColor {
        switch score {
        case 80...100: return .systemGreen
        case 60..<80:  return UIColor(red: 0.6, green: 0.8, blue: 0.2, alpha: 1)
        case 40..<60:  return .systemOrange
        default:       return .systemRed
        }
    }

    // MARK: Category Tints (for MetricCard backgrounds)

    static let gaitTint     = Color.blue.opacity(0.08)
    static let postureTint  = Color.green.opacity(0.08)
    static let clinicalTint = Color.purple.opacity(0.08)
    static let alertTint    = Color.red.opacity(0.08)
}

// MARK: - Spacing

enum AppSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
}

// MARK: - Corner Radii

enum AppRadius {
    static let small: CGFloat = 10
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
}

// MARK: - Shadows

struct AppShadow: ViewModifier {
    enum Style {
        case card
        case elevated
        case glow(Color)
    }

    let style: Style

    func body(content: Content) -> some View {
        switch style {
        case .card:
            content.shadow(color: .black.opacity(0.06), radius: 8, y: 4)
        case .elevated:
            content.shadow(color: .black.opacity(0.12), radius: 16, y: 8)
        case .glow(let color):
            content.shadow(color: color.opacity(0.4), radius: 12)
        }
    }
}

extension View {
    func appShadow(_ style: AppShadow.Style = .card) -> some View {
        modifier(AppShadow(style: style))
    }
}

// MARK: - Fonts

enum AppFonts {
    /// Bold rounded font with monospaced digits — ideal for metric values.
    static func metricValue(_ style: Font.TextStyle = .title2) -> Font {
        .system(style, design: .rounded, weight: .bold)
            .monospacedDigit()
    }

    /// Medium rounded font — ideal for metric labels and captions.
    static func metricLabel(_ style: Font.TextStyle = .caption) -> Font {
        .system(style, design: .rounded, weight: .medium)
    }

    /// Semibold rounded headline — ideal for card/section headers.
    static let sectionHeader: Font = .system(.headline, design: .rounded, weight: .semibold)

    /// Extra-large bold rounded — for countdown numbers.
    static let countdown: Font = .system(size: 96, weight: .bold, design: .rounded)

    /// Monospaced semibold — for running timers.
    static let timer: Font = .system(.title, design: .monospaced, weight: .semibold)
}
