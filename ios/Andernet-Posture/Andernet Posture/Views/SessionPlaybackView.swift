//
//  SessionPlaybackView.swift
//  Andernet Posture
//
//  Phase 2: Frame-by-frame session playback with scrubber, auto-play, and mini chart.
//

import SwiftUI
import Charts

struct SessionPlaybackView: View {
    let session: GaitSession

    @State private var frames: [BodyFrame] = []
    @State private var currentIndex: Int = 0
    @State private var isPlaying: Bool = false
    @State private var timer: Timer?

    private var totalDuration: Double {
        guard let first = frames.first, let last = frames.last else { return 0 }
        return last.timestamp - first.timestamp
    }

    private var currentTime: Double {
        guard let first = frames.first, currentIndex < frames.count else { return 0 }
        return frames[currentIndex].timestamp - first.timestamp
    }

    private var currentFrame: BodyFrame? {
        guard currentIndex < frames.count else { return nil }
        return frames[currentIndex]
    }

    var body: some View {
        ScrollView(.vertical) {
            VStack(spacing: AppSpacing.xl) {
                metricsPanel
                transportControls
                miniChartSection
            }
            .padding(AppSpacing.lg)
            .frame(maxWidth: .infinity)
        }
        .scrollBounceBehavior(.basedOnSize)
        .navigationTitle("Playback")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadFrames() }
        .onDisappear { stopPlayback() }
    }

    // MARK: - Metrics Panel

    @ViewBuilder
    private var metricsPanel: some View {
        if let f = currentFrame {
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: AppSpacing.md) {
                metricCard(
                    label: "Posture Score",
                    value: String(format: "%.0f", f.postureScore),
                    icon: "figure.stand"
                )
                metricCard(
                    label: "Trunk Lean",
                    value: String(format: "%.1f°", f.sagittalTrunkLeanDeg),
                    icon: "arrow.up.and.down"
                )
                metricCard(
                    label: "CVA",
                    value: String(format: "%.1f°", f.craniovertebralAngleDeg),
                    icon: "head.profile.arrow.forward.and.visionpro"
                )
                metricCard(
                    label: "Cadence",
                    value: String(format: "%.0f SPM", f.cadenceSPM),
                    icon: "metronome"
                )
                metricCard(
                    label: "Walking Speed",
                    value: String(format: "%.2f m/s", f.walkingSpeedMPS),
                    icon: "figure.walk"
                )
                metricCard(
                    label: "Time",
                    value: formatTime(currentTime),
                    icon: "clock"
                )
            }
        } else {
            ContentUnavailableView(
                "No Frame Data",
                systemImage: "film.stack",
                description: Text("This session has no recorded frames.")
            )
        }
    }

    @ViewBuilder
    private func metricCard(
        label: String,
        value: String,
        icon: String
    ) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Label(label, systemImage: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Text(value)
                .font(AppFonts.metricValue(.title3))
                .contentTransition(.numericText())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.lg)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.small))
        .appShadow(.card)
    }

    // MARK: - Transport Controls

    @ViewBuilder
    private var transportControls: some View {
        VStack(spacing: AppSpacing.md) {
            // Progress bar
            HStack {
                Text(formatTime(currentTime))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .contentTransition(.numericText())
                Spacer()
                Text(formatTime(totalDuration))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }

            Slider(
                value: Binding(
                    get: { Double(currentIndex) },
                    set: { newVal in
                        currentIndex = Int(newVal)
                            .clamped(to: 0...(frames.count - 1))
                    }
                ),
                in: 0...Double(max(frames.count - 1, 1)),
                step: 1
            )
            .accessibilityLabel("Playback scrubber")
            .accessibilityValue(
                "\(formatTime(currentTime)) of \(formatTime(totalDuration))"
            )

            // Play / Pause
            HStack(spacing: AppSpacing.xxl) {
                Button {
                    skipBackward()
                } label: {
                    Image(systemName: "gobackward.5")
                        .font(.title2)
                }
                .accessibilityLabel("Skip back 5 seconds")

                Button {
                    togglePlayback()
                } label: {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.title)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel(isPlaying ? "Pause" : "Play")

                Button {
                    skipForward()
                } label: {
                    Image(systemName: "goforward.5")
                        .font(.title2)
                }
                .accessibilityLabel("Skip forward 5 seconds")
            }
        }
        .padding(AppSpacing.lg)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
    }

    // MARK: - Mini Chart

    @ViewBuilder
    private var miniChartSection: some View {
        if frames.count > 1 {
            ChartCard(title: "Session Trajectory", icon: "waveform.path.ecg") {
                Chart {
                    ForEach(chartData) { pt in
                        LineMark(
                            x: .value("Time", pt.time),
                            y: .value("Posture", pt.value)
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(Color.blue.gradient)
                    }
                    ForEach(chartData) { pt in
                        AreaMark(
                            x: .value("Time", pt.time),
                            y: .value("Posture", pt.value)
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(Color.blue.opacity(0.1).gradient)
                    }
                    RuleMark(x: .value("Playhead", currentTime))
                        .foregroundStyle(.red)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        .annotation(position: .top, spacing: 4) {
                            Text(formatTime(currentTime))
                                .font(.caption2.bold())
                                .foregroundStyle(.red)
                        }
                }
                .chartXAxisLabel("Time (sec)")
                .chartYAxisLabel("Score")
            }
            .accessibleChart(
                title: "Session Trajectory",
                summary: "Posture score over time during session playback."
            )
        }
    }

    /// Down-sampled posture score data for the mini chart.
    private var chartData: [TimeSeriesPoint] {
        guard let start = frames.first?.timestamp else { return [] }
        let interval = 0.5
        var last = -interval
        var pts: [TimeSeriesPoint] = []
        for f in frames {
            let t = f.timestamp - start
            guard t - last >= interval else { continue }
            last = t
            pts.append(TimeSeriesPoint(time: t, value: f.postureScore))
        }
        return pts
    }

    // MARK: - Playback Logic

    private func loadFrames() {
        frames = session.decodedFrames
        guard !frames.isEmpty else { return }
        currentIndex = 0
    }

    private func togglePlayback() {
        if isPlaying {
            stopPlayback()
        } else {
            startPlayback()
        }
    }

    private func startPlayback() {
        guard !frames.isEmpty else { return }
        if currentIndex >= frames.count - 1 {
            currentIndex = 0
        }
        isPlaying = true
        timer = Timer.scheduledTimer(
            withTimeInterval: 0.5,
            repeats: true
        ) { _ in
            advanceFrame()
        }
    }

    private func stopPlayback() {
        isPlaying = false
        timer?.invalidate()
        timer = nil
    }

    private func advanceFrame() {
        if currentIndex < frames.count - 1 {
            currentIndex += 1
        } else {
            stopPlayback()
        }
    }

    private func skipForward() {
        let target = currentTime + 5.0
        seekToTime(target)
    }

    private func skipBackward() {
        let target = max(0, currentTime - 5.0)
        seekToTime(target)
    }

    private func seekToTime(_ target: Double) {
        guard let start = frames.first?.timestamp else { return }
        let absTarget = start + target
        if let idx = frames.firstIndex(where: { $0.timestamp >= absTarget }) {
            currentIndex = idx
        } else {
            currentIndex = frames.count - 1
        }
    }

    // MARK: - Helpers

    private func formatTime(_ seconds: Double) -> String {
        seconds.mmss
    }
}

// MARK: - Int Clamping Extension

private extension Int {
    func clamped(to range: ClosedRange<Int>) -> Int {
        Swift.min(Swift.max(self, range.lowerBound), range.upperBound)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        SessionPlaybackView(session: GaitSession(
            date: .now,
            duration: 120,
            averageCadenceSPM: 112,
            averageStrideLengthM: 0.72,
            averageTrunkLeanDeg: 5.3,
            postureScore: 82
        ))
    }
}
