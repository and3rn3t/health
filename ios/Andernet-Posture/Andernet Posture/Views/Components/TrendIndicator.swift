//
//  TrendIndicator.swift
//  Andernet Posture
//
//  Compact up/down/flat arrow with percentage delta, color-coded.
//

import SwiftUI

struct TrendIndicator: View {

    let delta: Double

    /// When true, a positive delta is shown in green (good).
    /// Set to false for metrics where lower is better.
    var positiveIsGood: Bool = true

    private var isPositive: Bool { delta > 0 }
    private var isGood: Bool { positiveIsGood ? isPositive : !isPositive }

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: isPositive ? "arrow.up.right" : "arrow.down.right")
                .font(.caption2.weight(.bold))

            Text(String(format: "%.1f%%", abs(delta)))
                .font(.caption2.weight(.semibold).monospacedDigit())
        }
        .foregroundColor(abs(delta) < 0.5 ? .secondary : (isGood ? .green : .red))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            "\(isPositive ? "increased" : "decreased") by \(String(format: "%.1f", abs(delta))) percent"
        )
    }
}

// MARK: - Previews

#Preview {
    VStack(spacing: 12) {
        TrendIndicator(delta: 5.2)
        TrendIndicator(delta: -3.1)
        TrendIndicator(delta: 0.2)
        TrendIndicator(delta: -8.0, positiveIsGood: false)
    }
    .padding()
}
