//
//  SplashScreenView.swift
//  Andernet Posture
//
//  Animated launch splash with brand identity, spine motif, and smooth transition.
//

import SwiftUI

struct SplashScreenView: View {
    @State private var logoScale: CGFloat = 0.4
    @State private var logoOpacity: Double = 0
    @State private var spineOffset: CGFloat = 40
    @State private var spineOpacity: Double = 0
    @State private var ringRotation: Double = 0
    @State private var ringScale: CGFloat = 0.6
    @State private var ringOpacity: Double = 0
    @State private var taglineOpacity: Double = 0
    @State private var taglineOffset: CGFloat = 12
    @State private var shimmerOffset: CGFloat = -200
    @State private var backgroundHue: Double = 0

    var body: some View {
        ZStack {
            // MARK: - Animated Gradient Background
            backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                // MARK: - Central Logo Composition
                ZStack {
                    // Outer pulsing ring
                    pulsingRing

                    // Spine icon + posture figure
                    logoComposition
                }
                .frame(width: 180, height: 180)

                // MARK: - App Name
                appTitle

                // MARK: - Tagline
                tagline

                Spacer()

                // MARK: - Loading Indicator
                loadingIndicator

                Spacer()
                    .frame(height: 60)
            }
        }
        .onAppear { runAnimationSequence() }
    }

    // MARK: - Background

    private var backgroundGradient: some View {
        ZStack {
            // Base dark gradient
            LinearGradient(
                colors: [
                    Color(red: 0.03, green: 0.08, blue: 0.12),
                    Color(red: 0.04, green: 0.12, blue: 0.16),
                    Color(red: 0.02, green: 0.06, blue: 0.10)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Subtle animated radial glow
            RadialGradient(
                colors: [
                    Color(red: 0.08, green: 0.72, blue: 0.65).opacity(0.15),
                    Color.clear
                ],
                center: .center,
                startRadius: 20,
                endRadius: 300
            )
            .scaleEffect(1.0 + backgroundHue * 0.1)

            // Top-right accent glow
            RadialGradient(
                colors: [
                    Color.indigo.opacity(0.08),
                    Color.clear
                ],
                center: .topTrailing,
                startRadius: 10,
                endRadius: 250
            )
        }
    }

    // MARK: - Pulsing Ring

    private var pulsingRing: some View {
        ZStack {
            // Outer gradient ring
            Circle()
                .strokeBorder(
                    AngularGradient(
                        colors: [
                            Color(red: 0.08, green: 0.72, blue: 0.65),
                            .indigo,
                            Color(red: 0.08, green: 0.72, blue: 0.65)
                        ],
                        center: .center
                    ),
                    lineWidth: 3
                )
                .frame(width: 160, height: 160)
                .rotationEffect(.degrees(ringRotation))
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            // Inner subtle ring
            Circle()
                .strokeBorder(
                    Color(red: 0.08, green: 0.72, blue: 0.65).opacity(0.2),
                    lineWidth: 1.5
                )
                .frame(width: 140, height: 140)
                .scaleEffect(ringScale)
                .opacity(ringOpacity * 0.6)
        }
    }

    // MARK: - Logo Composition

    private var logoComposition: some View {
        ZStack {
            // Spine vertebrae column
            spineColumn
                .offset(y: spineOffset)
                .opacity(spineOpacity)

            // Central posture figure
            Image(systemName: "figure.stand")
                .font(.system(size: 52, weight: .light))
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 0.08, green: 0.72, blue: 0.65),
                            .indigo
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .scaleEffect(logoScale)
                .opacity(logoOpacity)
        }
    }

    // MARK: - Spine Vertebrae

    private var spineColumn: some View {
        VStack(spacing: 3) {
            ForEach(0..<7, id: \.self) { i in
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.08, green: 0.72, blue: 0.65).opacity(0.4 - Double(i) * 0.04),
                                Color.indigo.opacity(0.3 - Double(i) * 0.03)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: vertebraWidth(for: i), height: 4)
            }
        }
    }

    private func vertebraWidth(for index: Int) -> CGFloat {
        // Wider at the top, tapering down like a real spine
        let widths: [CGFloat] = [18, 20, 22, 22, 20, 18, 14]
        return widths[index]
    }

    // MARK: - Title

    private var appTitle: some View {
        VStack(spacing: 4) {
            Text("Andernet")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 0.08, green: 0.72, blue: 0.65),
                            .indigo
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )

            Text("POSTURE")
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .tracking(8)
                .foregroundStyle(.white.opacity(0.7))
        }
        .scaleEffect(logoScale)
        .opacity(logoOpacity)
        .overlay(shimmerOverlay)
    }

    // MARK: - Shimmer

    private var shimmerOverlay: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [.clear, .white.opacity(0.15), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(width: 60)
            .offset(x: shimmerOffset)
            .mask(
                VStack(spacing: 4) {
                    Text("Andernet")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                    Text("POSTURE")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .tracking(8)
                }
            )
    }

    // MARK: - Tagline

    private var tagline: some View {
        Text("Move Better. Live Stronger.")
            .font(.system(size: 15, weight: .medium, design: .rounded))
            .foregroundStyle(.white.opacity(0.5))
            .opacity(taglineOpacity)
            .offset(y: taglineOffset)
    }

    // MARK: - Loading Indicator

    private var loadingIndicator: some View {
        HStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(
                        Color(red: 0.08, green: 0.72, blue: 0.65)
                            .opacity(0.6)
                    )
                    .frame(width: 6, height: 6)
                    .scaleEffect(loadingDotScale(for: i))
                    .animation(
                        .easeInOut(duration: 0.6)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.2),
                        value: taglineOpacity
                    )
            }
        }
        .opacity(taglineOpacity)
    }

    private func loadingDotScale(for index: Int) -> CGFloat {
        taglineOpacity > 0 ? 1.2 : 0.5
    }

    // MARK: - Animation Sequence

    private func runAnimationSequence() {
        // Phase 1: Rings appear
        withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.2)) {
            ringScale = 1.0
            ringOpacity = 1.0
        }

        // Phase 2: Logo scales in
        withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.5)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }

        // Phase 3: Spine slides into place
        withAnimation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.8)) {
            spineOffset = 0
            spineOpacity = 1.0
        }

        // Phase 4: Tagline fades in
        withAnimation(.easeOut(duration: 0.6).delay(1.2)) {
            taglineOpacity = 1.0
            taglineOffset = 0
        }

        // Phase 5: Shimmer sweep
        withAnimation(.easeInOut(duration: 1.0).delay(1.5)) {
            shimmerOffset = 200
        }

        // Continuous: Ring rotation
        withAnimation(.linear(duration: 12).repeatForever(autoreverses: false).delay(0.3)) {
            ringRotation = 360
        }

        // Continuous: Background pulse
        withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true).delay(0.5)) {
            backgroundHue = 1.0
        }
    }
}

// MARK: - Preview

#Preview {
    SplashScreenView()
}
