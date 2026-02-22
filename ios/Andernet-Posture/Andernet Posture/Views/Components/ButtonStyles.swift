//
//  ButtonStyles.swift
//  Andernet Posture
//
//  Shared button styles: primary (gradient fill), secondary (bordered),
//  and pill (compact, selectable).
//

import SwiftUI

// MARK: - Primary

/// Filled capsule with accent gradient and subtle shadow.
/// Use for prominent CTAs: "Start", "Get Started", "Export".
struct PrimaryButtonStyle: ButtonStyle {

    var fullWidth: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, AppSpacing.xl)
            .padding(.vertical, AppSpacing.md)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(AppColors.accentGradient, in: Capsule())
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
            .appShadow(.card)
    }
}

// MARK: - Secondary

/// Bordered capsule with accent stroke.
/// Use for secondary actions: "Cancel", "Skip".
struct SecondaryButtonStyle: ButtonStyle {

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.medium))
            .foregroundStyle(Color.accentColor)
            .padding(.horizontal, AppSpacing.xl)
            .padding(.vertical, AppSpacing.md)
            .background(
                Capsule()
                    .strokeBorder(Color.accentColor, lineWidth: 1.5)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Pill

/// Compact capsule — for filter chips, mode selectors, tags.
/// Supports a selected state with gradient fill.
struct PillButtonStyle: ButtonStyle {

    var isSelected: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.medium))
            .foregroundStyle(isSelected ? .white : .primary)
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, AppSpacing.sm)
            .background(
                Group {
                    if isSelected {
                        Capsule().fill(AppColors.accentGradient)
                    } else {
                        Capsule().fill(.regularMaterial)
                    }
                }
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: - Previews

#Preview("Button Styles") {
    VStack(spacing: 20) {
        Button("Get Started") {}
            .buttonStyle(PrimaryButtonStyle())

        Button("Skip for now") {}
            .buttonStyle(SecondaryButtonStyle())

        HStack {
            Button("Skeleton") {}
                .buttonStyle(PillButtonStyle(isSelected: true))
            Button("Severity") {}
                .buttonStyle(PillButtonStyle())
            Button("Heatmap") {}
                .buttonStyle(PillButtonStyle())
        }
    }
    .padding()
}
