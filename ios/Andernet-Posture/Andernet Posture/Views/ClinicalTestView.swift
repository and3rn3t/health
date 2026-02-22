//
//  ClinicalTestView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Guided clinical test protocols with step-by-step instructions,
//  countdown timers, and results display.
//

import SwiftUI

struct ClinicalTestView: View {
    @State private var viewModel = ClinicalTestViewModel()
    @State private var selectedTest: ClinicalTestType?
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.testType == nil {
                    testSelectionView
                } else {
                    activeTestView
                }
            }
            .navigationTitle("Clinical Tests")
            .navigationBarTitleDisplayMode(.large)
            .reduceMotionAware()
        }
    }

    // MARK: - Test Selection

    @ViewBuilder
    private var testSelectionView: some View {
        ScrollView {
            VStack(spacing: AppSpacing.lg) {
                // Disclaimer banner
                SectionCard(title: "Guided Clinical Protocols", icon: "stethoscope", accentColor: .blue) {
                    Text("Standardized tests for mobility, balance, and functional capacity assessment.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // TUG
                testCard(
                    title: "Timed Up & Go (TUG)",
                    description: "Measures functional mobility. Stand from a chair, walk 3m, turn, return, and sit.",
                    duration: "~30 sec",
                    icon: "figure.walk.arrival",
                    color: .green
                ) {
                    viewModel.startTUG()
                }

                // Romberg
                testCard(
                    title: "Romberg Balance Test",
                    description: "Assesses proprioceptive balance. Stand still for 30s eyes open, then 30s eyes closed.",
                    duration: "~2 min",
                    icon: "figure.stand",
                    color: .purple
                ) {
                    viewModel.startRomberg()
                }

                // 6MWT
                testCard(
                    title: "6-Minute Walk Test",
                    description: "Evaluates functional exercise capacity. Walk at your normal pace for 6 minutes.",
                    duration: "6 min",
                    icon: "figure.walk",
                    color: .orange
                ) {
                    viewModel.start6MWT()
                }
            }
            .padding()
        }
    }

    @ViewBuilder
    private func testCard(title: String, description: String, duration: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 0) {
                // Gradient left accent border
                RoundedRectangle(cornerRadius: 2)
                    .fill(color.gradient)
                    .frame(width: 4)
                    .padding(.vertical, AppSpacing.sm)

                HStack(spacing: AppSpacing.lg) {
                    Image(systemName: icon)
                        .font(.system(size: 36))
                        .foregroundStyle(color)
                        .frame(width: 50)

                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(title)
                            .font(.headline)
                            .foregroundStyle(.primary)

                        Text(description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)

                        HStack(spacing: AppSpacing.xs) {
                            Image(systemName: "clock")
                                .font(.caption2)
                            Text(duration)
                                .font(.caption2)
                        }
                        .foregroundStyle(.tertiary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .foregroundStyle(.tertiary)
                }
                .padding(AppSpacing.lg)
            }
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
            .appShadow(.card)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Active Test View

    @ViewBuilder
    private var activeTestView: some View {
        VStack(spacing: AppSpacing.xxl) {
            Spacer()

            // State-specific content
            switch viewModel.testState {
            case .notStarted:
                EmptyView()

            case .instructing(let step, let totalSteps, let instruction):
                instructionView(step: step, totalSteps: totalSteps, instruction: instruction)

            case .countdown(let seconds):
                countdownView(seconds: seconds)

            case .running(let phaseLabel):
                runningView(phaseLabel: phaseLabel)

            case .transitioning(let instruction):
                transitionView(instruction: instruction)

            case .completed:
                resultsView

            case .cancelled:
                cancelledView
            }

            Spacer()

            // Controls
            testControls
        }
        .padding()
    }

    // MARK: - Instruction View

    @ViewBuilder
    private func instructionView(step: Int, totalSteps: Int, instruction: String) -> some View {
        SectionCard {
            VStack(spacing: AppSpacing.lg) {
                // Animated progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(.gray.opacity(0.2))
                        Capsule()
                            .fill(.blue.gradient)
                            .frame(width: geo.size.width * CGFloat(step) / CGFloat(totalSteps))
                            .animation(.spring(duration: 0.5, bounce: 0.2), value: step)
                    }
                }
                .frame(height: 6)

                Text("Step \(step) of \(totalSteps)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(instruction)
                    .font(.title3)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, AppSpacing.md)
            }
        }
    }

    // MARK: - Countdown

    @ViewBuilder
    private func countdownView(seconds: Int) -> some View {
        VStack(spacing: AppSpacing.lg) {
            // Countdown ring
            ZStack {
                Circle()
                    .stroke(.blue.opacity(0.15), lineWidth: 8)
                    .frame(width: 160, height: 160)

                Circle()
                    .trim(from: 0, to: CGFloat(seconds) / 3.0)
                    .stroke(.blue.gradient, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 160, height: 160)
                    .animation(.easeInOut(duration: 0.8), value: seconds)

                Text("\(seconds)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .foregroundStyle(.blue)
                    .contentTransition(.numericText())
            }

            Text("Get ready...")
                .font(.title3)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Running

    @ViewBuilder
    private func runningView(phaseLabel: String) -> some View {
        VStack(spacing: AppSpacing.xl) {
            // Timer
            Text((viewModel.elapsedTime > 0 ? viewModel.elapsedTime : viewModel.phaseElapsedTime).mmssWithTenths)
                .font(AppFonts.timer)
                .foregroundStyle(.primary)
                .contentTransition(.numericText())

            Text(phaseLabel)
                .font(.title3)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            if viewModel.testType == .sixMinuteWalk {
                SectionCard {
                    HStack {
                        VStack(spacing: AppSpacing.xs) {
                            Text(String(format: "%.0f m", viewModel.sixMWTDistance))
                                .font(AppFonts.metricValue(.title))
                                .contentTransition(.numericText())
                            Text("Distance")
                                .font(AppFonts.metricLabel())
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                }
                .padding(.horizontal, AppSpacing.xxl)
            }

            // Pulsing recording indicator
            recordingDot
        }
    }

    @ViewBuilder
    private var recordingDot: some View {
        ZStack {
            Circle()
                .stroke(.red.opacity(0.3), lineWidth: 3)
                .frame(width: 20, height: 20)
            Circle()
                .fill(.red)
                .frame(width: 10, height: 10)
            Circle()
                .stroke(.red, lineWidth: 2)
                .frame(width: 20, height: 20)
                .scaleEffect(pulseScale)
                .opacity(2 - pulseScale)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: false)) {
                pulseScale = 2.0
            }
        }
    }

    // MARK: - Transition

    @ViewBuilder
    private func transitionView(instruction: String) -> some View {
        SectionCard {
            VStack(spacing: AppSpacing.lg) {
                Image(systemName: "arrow.forward.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.blue)
                    .symbolEffect(.bounce)

                Text(instruction)
                    .font(.title3)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Results

    @ViewBuilder
    private var resultsView: some View {
        VStack(spacing: AppSpacing.xl) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)
                .symbolEffect(.bounce, value: viewModel.testState)

            Text("Test Complete")
                .font(.title.bold())

            // Test-specific results
            switch viewModel.testType {
            case .timedUpAndGo:
                if let result = viewModel.tugResult {
                    tugResultView(result)
                }

            case .romberg:
                if let result = viewModel.rombergResult {
                    rombergResultView(result)
                }

            case .sixMinuteWalk:
                if let result = viewModel.sixMWTResult {
                    sixMWTResultView(result)
                }

            case .none:
                EmptyView()
            }
        }
    }

    @ViewBuilder
    private func tugResultView(_ result: TUGResult) -> some View {
        SectionCard(title: "TUG Results", icon: "figure.walk.arrival", accentColor: .green) {
            VStack(spacing: AppSpacing.md) {
                resultRow("Time", value: String(format: "%.1f sec", result.timeSec))
                resultRow("Fall Risk", value: result.fallRisk.rawValue.capitalized,
                           severity: result.fallRisk == .low ? .normal : result.fallRisk == .moderate ? .moderate : .severe)
                resultRow("Mobility", value: result.mobilityLevel)

                Text("Ref: Shumway-Cook et al., 2000 (fall risk >13.5s)")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(.top, AppSpacing.xs)
            }
        }
    }

    @ViewBuilder
    private func rombergResultView(_ result: RombergResult) -> some View {
        SectionCard(title: "Romberg Results", icon: "figure.stand", accentColor: .purple) {
            VStack(spacing: AppSpacing.md) {
                resultRow("Eyes Open Sway", value: String(format: "%.1f mm/s", result.eyesOpenSwayVelocity))
                resultRow("Eyes Closed Sway", value: String(format: "%.1f mm/s", result.eyesClosedSwayVelocity))
                resultRow("Romberg Ratio", value: String(format: "%.2f", result.ratio),
                           severity: result.ratio <= 2.0 ? .normal : .moderate)
                resultRow("Area Ratio", value: String(format: "%.2f", result.areaRatio),
                           severity: result.areaRatio <= 2.0 ? .normal : .moderate)

                Text("Ratio >2.0 suggests proprioceptive/vestibular deficit")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(.top, AppSpacing.xs)
            }
        }
    }

    @ViewBuilder
    private func sixMWTResultView(_ result: SixMinuteWalkResult) -> some View {
        SectionCard(title: "6MWT Results", icon: "figure.walk", accentColor: .orange) {
            VStack(spacing: AppSpacing.md) {
                resultRow("Distance", value: String(format: "%.0f m", result.distanceM))
                if let predicted = result.predictedDistanceM {
                    resultRow("Predicted", value: String(format: "%.0f m", predicted))
                }
                if let pctPredicted = result.percentPredicted {
                    resultRow("% Predicted", value: String(format: "%.0f%%", pctPredicted),
                               severity: pctPredicted >= 80 ? .normal : pctPredicted >= 60 ? .mild : .moderate)
                }
                resultRow("Classification", value: result.classification)

                Text("Ref: Enright & Sherrill, 1998")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(.top, AppSpacing.xs)
            }
        }
    }

    @ViewBuilder
    private func resultRow(_ label: String, value: String, severity: ClinicalSeverity? = nil) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            HStack(spacing: AppSpacing.xs) {
                Text(value)
                    .font(.subheadline.bold())
                if let severity {
                    SeverityBadge(severity: severity)
                }
            }
        }
    }

    // MARK: - Cancelled

    @ViewBuilder
    private var cancelledView: some View {
        VStack(spacing: AppSpacing.lg) {
            Image(systemName: "xmark.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("Test Cancelled")
                .font(.title2)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Controls

    @ViewBuilder
    private var testControls: some View {
        HStack(spacing: AppSpacing.lg) {
            switch viewModel.testState {
            case .instructing:
                Button {
                    advanceCurrentTest()
                } label: {
                    Label("Next", systemImage: "chevron.right")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button {
                    viewModel.cancelTest()
                } label: {
                    Label("Cancel", systemImage: "xmark")
                        .font(.headline)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

            case .running:
                if viewModel.testType == .timedUpAndGo {
                    Button {
                        viewModel.completeTUG()
                    } label: {
                        Label("Done — Seated", systemImage: "checkmark")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .tint(.green)
                }

                if viewModel.testType == .sixMinuteWalk {
                    Button {
                        viewModel.complete6MWT()
                    } label: {
                        Label("Stop Early", systemImage: "stop.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                }

                Button {
                    viewModel.cancelTest()
                } label: {
                    Image(systemName: "xmark")
                        .font(.headline)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

            case .completed, .cancelled:
                Button {
                    viewModel.testType = nil
                    viewModel.testState = .notStarted
                } label: {
                    Label("Back to Tests", systemImage: "arrow.backward")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

            default:
                EmptyView()
            }
        }
        .padding(.vertical, AppSpacing.md)
        .padding(.horizontal, AppSpacing.xl)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppRadius.large))
    }

    // MARK: - Helpers

    private func advanceCurrentTest() {
        switch viewModel.testType {
        case .timedUpAndGo: viewModel.advanceTUG()
        case .romberg: viewModel.advanceRomberg()
        case .sixMinuteWalk: viewModel.advance6MWT()
        case .none: break
        }
    }
}

#Preview {
    ClinicalTestView()
}
