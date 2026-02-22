//
//  SeverityBadge.swift
//  Andernet Posture
//
//  Consistent severity indicator — dot or labeled pill.
//  Uses AppColors.severityColor and respects increased-contrast mode.
//

import SwiftUI

struct SeverityBadge: View {

    let severity: ClinicalSeverity
    var showLabel: Bool = false

    @Environment(\.colorSchemeContrast) private var contrast

    private var color: Color {
        AppColors.severityColor(for: severity, highContrast: contrast == .increased)
    }

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            if showLabel {
                Text(severity.rawValue.capitalized)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(color)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(severity.rawValue) severity")
    }
}

// MARK: - Previews

#Preview {
    VStack(spacing: 16) {
        ForEach(ClinicalSeverity.allCases, id: \.self) { sev in
            HStack {
                SeverityBadge(severity: sev)
                SeverityBadge(severity: sev, showLabel: true)
            }
        }
    }
    .padding()
}
