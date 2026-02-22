//
//  SectionCard.swift
//  Andernet Posture
//
//  Standard container card with optional header (icon + title),
//  material background, and consistent spacing.
//

import SwiftUI

struct SectionCard<Content: View>: View {

    var title: String?
    var icon: String?
    var accentColor: Color?

    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            if let title {
                HStack(spacing: AppSpacing.sm) {
                    if let icon {
                        Image(systemName: icon)
                            .foregroundStyle(accentColor ?? .accentColor)
                            .font(.subheadline.weight(.semibold))
                    }
                    Text(title)
                        .font(AppFonts.sectionHeader)
                }
            }

            content()
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
    }
}

// MARK: - Previews

#Preview {
    VStack(spacing: 16) {
        SectionCard(title: "Posture", icon: "figure.stand") {
            Text("Content goes here")
        }

        SectionCard {
            Text("Card without header")
        }

        SectionCard(title: "Alert", icon: "exclamationmark.triangle", accentColor: .red) {
            Text("Something important")
        }
    }
    .padding()
}
