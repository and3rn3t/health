//
//  ScoreRingView.swift
//  Andernet Posture
//
//  Apple Health-inspired circular progress ring with animated fill,
//  gradient stroke, and glow shadow.
//

import SwiftUI

struct ScoreRingView: View {

    let score: Double
    let maxScore: Double
    let lineWidth: CGFloat
    let showLabel: Bool
    let size: CGFloat

    @State private var animatedProgress: Double = 0

    init(
        score: Double,
        maxScore: Double = 100,
        size: CGFloat = 120,
        lineWidth: CGFloat = 12,
        showLabel: Bool = true
    ) {
        self.score = score
        self.maxScore = maxScore
        self.size = size
        self.lineWidth = lineWidth
        self.showLabel = showLabel
    }

    private var progress: Double {
        min(max(score / maxScore, 0), 1)
    }

    private var ringColor: Color {
        AppColors.scoreColor(for: score)
    }

    var body: some View {
        ZStack {
            // Track
            Circle()
                .stroke(
                    ringColor.opacity(0.15),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )

            // Gradient fill
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(
                    AngularGradient(
                        colors: [ringColor.opacity(0.6), ringColor],
                        center: .center,
                        startAngle: .degrees(0),
                        endAngle: .degrees(360 * animatedProgress)
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            // Label
            if showLabel {
                VStack(spacing: 2) {
                    Text("\(Int(score))")
                        .font(size > 80
                              ? AppFonts.metricValue(.title)
                              : AppFonts.metricValue(.title3))
                        .contentTransition(.numericText())

                    if size > 80 {
                        Text("Score")
                            .font(AppFonts.metricLabel())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .frame(width: size, height: size)
        .appShadow(.glow(ringColor))
        .onAppear {
            withAnimation(.spring(duration: 1.0, bounce: 0.2)) {
                animatedProgress = progress
            }
        }
        .onChange(of: score) { _, _ in
            withAnimation(.spring(duration: 0.6)) {
                animatedProgress = progress
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Posture score \(Int(score)) out of \(Int(maxScore))")
        .accessibilityValue("\(Int(progress * 100)) percent")
    }
}

// MARK: - Previews

#Preview("Large Ring") {
    ScoreRingView(score: 78, size: 140, lineWidth: 14)
        .padding()
}

#Preview("Small Ring") {
    ScoreRingView(score: 92, size: 40, lineWidth: 5)
        .padding()
}

#Preview("Low Score") {
    ScoreRingView(score: 35, size: 120, lineWidth: 12)
        .padding()
}
