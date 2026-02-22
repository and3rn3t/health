//
//  AccessibleCaptureOverlay.swift
//  Andernet Posture
//
//  ViewModifier overlay for the capture screen providing:
//  – VoiceOver announcements on significant score changes
//  – Haptic feedback tied to severity transitions
//  – Optional audio feedback (pitch mapped to posture score)
//  – Reduce-motion awareness
//

import SwiftUI
import AVFoundation
import UIKit
import os

// MARK: - Accessible Capture Overlay Modifier

/// Apply to a capture view to get automatic VoiceOver announcements,
/// haptics, and optional audio feedback during a live session.
///
/// Usage:
/// ```swift
/// PostureGaitCaptureView()
///     .accessibleCaptureOverlay(
///         postureScore: viewModel.postureScore,
///         severity: currentSeverity
///     )
/// ```
struct AccessibleCaptureOverlay: ViewModifier {

    // MARK: - Inputs

    let postureScore: Double
    let severity: ClinicalSeverity?

    // MARK: - Preferences

    @AppStorage("accessibilityAudioFeedback") private var audioFeedbackEnabled = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // MARK: - Internal State

    @State private var lastAnnouncedScore: Double = -10
    @State private var lastSeverity: ClinicalSeverity?
    @State private var tonePlayer: AVAudioPlayer?
    @State private var toneEngine: ToneEngine?

    // Haptic generators — lightweight, created once.
    @State private var impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    @State private var notificationGenerator = UINotificationFeedbackGenerator()

    // MARK: - Body

    func body(content: Content) -> some View {
        content
            .onChange(of: postureScore) { oldValue, newValue in
                handleScoreChange(from: oldValue, to: newValue)
            }
            .onChange(of: severity) { oldSeverity, newSeverity in
                handleSeverityChange(from: oldSeverity, to: newSeverity)
            }
            .onChange(of: audioFeedbackEnabled) { _, enabled in
                if !enabled {
                    toneEngine?.stop()
                }
            }
            .onAppear {
                impactGenerator.prepare()
                notificationGenerator.prepare()
                if audioFeedbackEnabled {
                    toneEngine = ToneEngine()
                }
            }
            .onDisappear {
                toneEngine?.stop()
                toneEngine = nil
            }
    }

    // MARK: - Score Change Handling

    private func handleScoreChange(from oldScore: Double, to newScore: Double) {
        // Announce only when score moves by ≥ 5 points since last announcement.
        let delta = abs(newScore - lastAnnouncedScore)
        guard delta >= 5 else {
            // Still update audio tone continuously.
            updateAudioTone(for: newScore)
            return
        }

        lastAnnouncedScore = newScore
        announceScore(newScore)
        updateAudioTone(for: newScore)
    }

    private func announceScore(_ score: Double) {
        let rounded = Int(score.rounded())
        let category = scoreCategory(for: score)
        let message = "Posture score \(rounded), \(category)"
        AccessibilityNotification.Announcement(message).post()
    }

    // MARK: - Severity Change Handling

    private func handleSeverityChange(
        from oldSev: ClinicalSeverity?,
        to newSev: ClinicalSeverity?
    ) {
        guard let newSev, newSev != oldSev else { return }
        lastSeverity = newSev

        // Haptic pattern varies with severity.
        triggerHaptic(for: newSev)

        // Announce severity transition.
        let message: String
        if let oldSev {
            message = "Severity changed from \(oldSev.accessibilityDescription) to \(newSev.accessibilityDescription)"
        } else {
            message = "Severity: \(newSev.accessibilityDescription)"
        }
        AccessibilityNotification.Announcement(message).post()
    }

    private func triggerHaptic(for severity: ClinicalSeverity) {
        guard !reduceMotion else { return }

        switch severity {
        case .normal:
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
        case .mild:
            impactGenerator.impactOccurred(intensity: 0.5)
        case .moderate:
            impactGenerator.impactOccurred(intensity: 0.8)
        case .severe:
            notificationGenerator.notificationOccurred(.warning)
        }
    }

    // MARK: - Audio Feedback

    /// Updates the continuous tone pitch.
    /// Pitch range: 220 Hz (poor) → 880 Hz (excellent).
    private func updateAudioTone(for score: Double) {
        guard audioFeedbackEnabled else { return }

        if toneEngine == nil {
            toneEngine = ToneEngine()
        }

        // Map 0–100 score to 220–880 Hz.
        let clampedScore = min(max(score, 0), 100)
        let frequency = 220 + (clampedScore / 100) * 660
        toneEngine?.play(frequency: frequency)
    }

    // MARK: - Helpers

    private func scoreCategory(for score: Double) -> String {
        switch score {
        case 80...: return String(localized: "Excellent").lowercased()
        case 60..<80: return String(localized: "Good").lowercased()
        case 40..<60: return String(localized: "Fair").lowercased()
        default: return String(localized: "Needs Improvement").lowercased()
        }
    }
}

// MARK: - Tone Engine

/// Lightweight AVAudioEngine wrapper that produces a sine-wave tone
/// whose frequency can be updated smoothly.
private final class ToneEngine {
    private let audioEngine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private var isPlaying = false
    private var currentFrequency: Double = 440
    private let sampleRate: Double = 44100
    private let amplitude: Float = 0.08 // very subtle

    init() {
        setupEngine()
    }

    private func setupEngine() {
        let format = AVAudioFormat(
            standardFormatWithSampleRate: sampleRate,
            channels: 1
        )!

        audioEngine.attach(playerNode)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: format)

        // Lower overall volume for subtlety.
        audioEngine.mainMixerNode.outputVolume = 0.15
    }

    func play(frequency: Double) {
        currentFrequency = frequency

        guard !isPlaying else { return }
        isPlaying = true

        do {
            try audioEngine.start()

            let format = AVAudioFormat(
                standardFormatWithSampleRate: sampleRate,
                channels: 1
            )!

            // Schedule a repeating buffer with the tone.
            let bufferLength: AVAudioFrameCount = AVAudioFrameCount(sampleRate * 0.1) // 100 ms
            guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: bufferLength) else {
                return
            }
            buffer.frameLength = bufferLength

            fillBuffer(buffer, frequency: frequency)

            playerNode.scheduleBuffer(buffer, at: nil, options: .loops)
            playerNode.play()
        } catch {
            AppLogger.capture.error("Audio engine failed to start: \(error.localizedDescription)")
            isPlaying = false
        }
    }

    func stop() {
        guard isPlaying else { return }
        playerNode.stop()
        audioEngine.stop()
        isPlaying = false
    }

    private func fillBuffer(_ buffer: AVAudioPCMBuffer, frequency: Double) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameCount = Int(buffer.frameLength)
        for i in 0..<frameCount {
            let phase = Double(i) / sampleRate * frequency * 2 * .pi
            channelData[i] = amplitude * Float(sin(phase))
        }
    }
}

// MARK: - View Extension

extension View {

    /// Adds an accessibility overlay for live capture sessions with
    /// VoiceOver announcements, haptics, and optional audio feedback.
    func accessibleCaptureOverlay(
        postureScore: Double,
        severity: ClinicalSeverity?
    ) -> some View {
        modifier(AccessibleCaptureOverlay(
            postureScore: postureScore,
            severity: severity
        ))
    }
}

// MARK: - Preview

#Preview("Accessible Capture Overlay") {
    // Simulates a capture view with the overlay applied.
    VStack {
        Text("Capture Preview")
            .font(.title)
        Text("Score: 75")
            .font(.largeTitle)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(.black)
    .foregroundStyle(.white)
    .accessibleCaptureOverlay(
        postureScore: 75,
        severity: .mild
    )
}
