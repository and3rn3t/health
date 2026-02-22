//
//  ChartCard.swift
//  Andernet Posture
//
//  Chart container with a SectionCard wrapper and Dynamic Type-scaled height.
//

import SwiftUI
import Charts

struct ChartCard<Content: View>: View {

    let title: String
    var icon: String?

    @ScaledMetric(relativeTo: .body) private var chartHeight: CGFloat = 180

    @ViewBuilder let chart: () -> Content

    var body: some View {
        SectionCard(title: title, icon: icon) {
            chart()
                .frame(height: chartHeight)
        }
    }
}

// MARK: - Previews

#Preview {
    ChartCard(title: "Posture Score", icon: "chart.line.uptrend.xyaxis") {
        Chart {
            ForEach(0..<10, id: \.self) { i in
                LineMark(
                    x: .value("Session", i),
                    y: .value("Score", Double.random(in: 60...95))
                )
            }
        }
    }
    .padding()
}
