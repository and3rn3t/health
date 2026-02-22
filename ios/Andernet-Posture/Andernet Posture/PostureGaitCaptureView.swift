//
//  PostureGaitCaptureView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Clear Liquid Glass overlays on AR camera, full-screen immersive,
//  start/pause/stop controls, live metrics, timer, calibration flow.
//

import SwiftUI
import SwiftData

struct PostureGaitCaptureView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = CaptureViewModel()
    @State private var showSavedAlert = false
    @AppStorage("skeletonOverlay") private var skeletonOverlay = true
    @AppStorage("samplingRate") private var samplingRate = 60.0
    @State private var coachingTip: String?
    @State private var showCoachingTip = false
    @State private var captureStarted = false
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        ZStack {
            if captureStarted {
                // Full-screen AR body tracking
                BodyARView(viewModel: viewModel, showSkeleton: skeletonOverlay, samplingRate: samplingRate)
                    .ignoresSafeArea()

                // Darkened overlay for readability on camera feed
                Color.black.opacity(0.15)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)

                VStack {
                    // MARK: - Top metrics bar
                    topMetricsBar
                        .padding(.horizontal)
                        .padding(.top, AppSpacing.sm)

                    Spacer()

                    // MARK: - Calibration prompt
                    if viewModel.recordingState == .calibrating {
                        calibrationOverlay
                    }

                    // MARK: - Coaching tip
                    if showCoachingTip, let tip = coachingTip {
                        coachingTipView(tip)
                            .transition(.move(edge: .top).combined(with: .opacity))
                            .padding(.bottom, AppSpacing.sm)
                    }

                    // MARK: - Error message
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .padding(AppSpacing.sm)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppRadius.small))
                            .padding(.bottom, AppSpacing.sm)
                    }

                    // MARK: - AR Overlay mode selector
                    CaptureAROverlayBar()
                        .padding(.bottom, AppSpacing.sm)

                    // MARK: - Bottom control bar
                    bottomControls
                        .padding(.horizontal)
                        .padding(.bottom, AppSpacing.lg)
                }
            } else {
                landingView
            }
        }
        .animation(.easeInOut(duration: 0.3), value: captureStarted)
        .animation(.easeInOut(duration: 0.3), value: viewModel.recordingState)
        .reduceMotionAware()
        .statusBarHidden()
        .onChange(of: viewModel.isBodyDetected) { evaluateCoachingTip() }
        .onChange(of: viewModel.postureScore) { evaluateCoachingTip() }
        .onChange(of: viewModel.trunkLeanDeg) { evaluateCoachingTip() }
        .alert("Session Saved", isPresented: $showSavedAlert) {
            Button("OK") { dismiss() }
        } message: {
            Text("Your posture and gait data has been recorded.")
        }
        .sensoryFeedback(.success, trigger: showSavedAlert)
    }

    // MARK: - Top Metrics

    @ViewBuilder
    private var topMetricsBar: some View {
        HStack(spacing: AppSpacing.md) {
            // Recording indicator
            if viewModel.recordingState == .recording {
                recordingIndicator
            }

            // Timer
            VStack(spacing: 2) {
                Image(systemName: "timer")
                    .font(.caption2)
                Text(viewModel.elapsedTime.mmss)
                    .font(AppFonts.metricValue(.body))
                    .contentTransition(.numericText())
            }

            Divider().frame(height: 36)

            // Posture score
            VStack(spacing: 2) {
                Image(systemName: "figure.stand")
                    .font(.caption2)
                Text(String(format: "%.0f", viewModel.postureScore))
                    .font(AppFonts.metricValue(.body))
                    .contentTransition(.numericText())
            }

            Divider().frame(height: 36)

            // Trunk lean
            VStack(spacing: 2) {
                Image(systemName: "arrow.up.and.down")
                    .font(.caption2)
                Text(viewModel.trunkLeanDeg.degreesString)
                    .font(AppFonts.metricValue(.body))
                    .contentTransition(.numericText())
            }

            Divider().frame(height: 36)

            // Cadence
            VStack(spacing: 2) {
                Image(systemName: "metronome")
                    .font(.caption2)
                Text(String(format: "%.0f", viewModel.cadenceSPM))
                    .font(AppFonts.metricValue(.body))
                    .contentTransition(.numericText())
            }

            Divider().frame(height: 36)

            // Steps
            VStack(spacing: 2) {
                Image(systemName: "shoeprints.fill")
                    .font(.caption2)
                Text("\(viewModel.stepCount)")
                    .font(AppFonts.metricValue(.body))
                    .contentTransition(.numericText())
            }
        }
        .foregroundStyle(.white)
        .padding(.vertical, 10)
        .padding(.horizontal, AppSpacing.lg)
        .background(.ultraThinMaterial, in: Capsule())
    }

    // MARK: - Calibration

    @ViewBuilder
    private var calibrationOverlay: some View {
        VStack(spacing: AppSpacing.lg) {
            Image(systemName: "figure.stand")
                .font(.system(size: 60))
                .foregroundStyle(.white)
                .symbolEffect(.pulse)

            Text("Stand naturally in frame")
                .font(.title2.bold())
                .foregroundStyle(.white)

            Text("Calibrating...")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(AppSpacing.xxxl)
        .background(.ultraThinMaterial.opacity(0.8), in: RoundedRectangle(cornerRadius: AppRadius.large))
    }

    // MARK: - Bottom Controls

    @ViewBuilder
    private var bottomControls: some View {
        HStack(spacing: AppSpacing.xxl) {
            switch viewModel.recordingState {
            case .idle:
                // Start button
                Button {
                    viewModel.startCapture()
                } label: {
                    Label("Start", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(.green)

                // Close
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.headline)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

            case .calibrating:
                // Cancel during calibration
                Button {
                    dismiss()
                } label: {
                    Label("Cancel", systemImage: "xmark")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

            case .recording:
                // Pause
                Button {
                    viewModel.togglePause()
                } label: {
                    Image(systemName: "pause.fill")
                        .font(.headline)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

                // Stop
                Button(action: stopAndSave) {
                    Label("Stop & Save", systemImage: "stop.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(.red)

            case .paused:
                // Resume
                Button {
                    viewModel.togglePause()
                } label: {
                    Label("Resume", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(.green)

                // Stop
                Button(action: stopAndSave) {
                    Label("Stop & Save", systemImage: "stop.fill")
                        .font(.headline)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

            case .finished:
                // Done
                Button {
                    dismiss()
                } label: {
                    Label("Done", systemImage: "checkmark")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
        .padding(.vertical, AppSpacing.md)
        .padding(.horizontal, AppSpacing.xl)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppSpacing.xl))
    }

    // MARK: - Actions

    private func stopAndSave() {
        viewModel.stopCapture()
        if viewModel.saveSession(context: modelContext) != nil {
            showSavedAlert = true
        }
    }

    // MARK: - Coaching Tip

    @ViewBuilder
    private func coachingTipView(_ tip: String) -> some View {
        HStack(spacing: AppSpacing.sm) {
            Image(systemName: "lightbulb.fill")
                .font(.subheadline)
                .foregroundStyle(.yellow)
            Text(tip)
                .font(.subheadline)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial, in: Capsule())
    }

    private func evaluateCoachingTip() {
        var tip: String?

        if !viewModel.isBodyDetected && viewModel.recordingState == .recording {
            tip = "Move back so your full body is visible"
        } else if viewModel.postureScore > 0 && viewModel.postureScore < 30 {
            tip = "Try standing up straighter"
        } else if viewModel.trunkLeanDeg > 20 {
            tip = "Significant forward lean detected"
        }

        if let newTip = tip, newTip != coachingTip {
            coachingTip = newTip
            withAnimation(.spring(duration: 0.4, bounce: 0.3)) {
                showCoachingTip = true
            }
            Task {
                try? await Task.sleep(for: .seconds(5))
                withAnimation(.easeInOut(duration: 0.3)) {
                    showCoachingTip = false
                }
            }
        }
    }

    // MARK: - Pre-capture Landing

    @ViewBuilder
    private var landingView: some View {
        VStack {
            Spacer()

            VStack(spacing: AppSpacing.xl) {
                Image(systemName: "figure.walk")
                    .font(.system(size: 80))
                    .symbolEffect(.pulse)
                    .foregroundStyle(Color.accentColor)

                Text("Ready to Capture")
                    .font(.title.bold())

                Text("Position your device so your full body is visible, then tap Start.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, AppSpacing.xxxl)

                Button("Start Capture") {
                    withAnimation {
                        captureStarted = true
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, AppSpacing.xxxl)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.brandedBackground)
    }

    // MARK: - Recording Indicator

    @ViewBuilder
    private var recordingIndicator: some View {
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
}

#Preview {
    PostureGaitCaptureView()
        .modelContainer(for: GaitSession.self, inMemory: true)
}
