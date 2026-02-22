//
//  OnboardingView.swift
//  Andernet Posture
//
//  Multi-step first-launch onboarding walkthrough.
//

import SwiftUI

struct OnboardingView: View {
    @Binding var hasCompletedOnboarding: Bool
    @AppStorage("clinicalDisclaimerAccepted") private var disclaimerAccepted = false
    @State private var currentPage = 0

    private let pageCount = 5

    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: gradientColors(for: currentPage),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 0.5), value: currentPage)

            VStack(spacing: 0) {
                // Skip button on pages 0-3
                HStack {
                    Spacer()
                    if currentPage < pageCount - 1 {
                        Button("Skip") {
                            withAnimation(.spring(duration: 0.4)) {
                                currentPage = pageCount - 1
                            }
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(.trailing, AppSpacing.xxl)
                        .padding(.top, AppSpacing.md)
                    }
                }

                TabView(selection: $currentPage) {
                    welcomePage.tag(0)
                    howItWorksPage.tag(1)
                    clinicalMetricsPage.tag(2)
                    privacyPage.tag(3)
                    getStartedPage.tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentPage)

                // Custom page indicator
                customPageIndicator
                    .padding(.bottom, AppSpacing.xxl)
            }
        }
        .reduceMotionAware()
    }

    // MARK: - Custom Page Indicator

    private var customPageIndicator: some View {
        HStack(spacing: AppSpacing.sm) {
            ForEach(0..<pageCount, id: \.self) { index in
                Capsule()
                    .fill(.white.opacity(index == currentPage ? 0.95 : 0.35))
                    .frame(width: index == currentPage ? 24 : 8, height: 8)
                    .animation(.spring(duration: 0.35, bounce: 0.3), value: currentPage)
            }
        }
    }

    // MARK: - Pages

    private var welcomePage: some View {
        OnboardingPageView(
            icon: "figure.stand",
            title: "Welcome to Andernet Posture",
            subtitle: "Your personal posture and gait analysis companion"
        )
    }

    private var howItWorksPage: some View {
        OnboardingPageView(
            icon: "figure.walk.motion",
            title: "How It Works",
            subtitle: "Stand in view of your camera and we track 91 body joints in real-time using advanced AR body tracking"
        )
    }

    private var clinicalMetricsPage: some View {
        OnboardingPageView(
            icon: "chart.bar.doc.horizontal",
            title: "Clinical Metrics",
            subtitle: "Medical-grade measurements including craniovertebral angle, gait symmetry, fall risk, and 40+ clinical parameters"
        )
    }

    private var privacyPage: some View {
        OnboardingPageView(
            icon: "lock.shield.fill",
            title: "Your Privacy Matters",
            subtitle: "All data stays on your device. No data is sent to any server. HealthKit sync is optional."
        )
    }

    private var getStartedPage: some View {
        VStack(spacing: AppSpacing.xxl) {
            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 80))
                .foregroundStyle(.white)
                .symbolEffect(.bounce, value: currentPage == 4)

            Text("Get Started")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            Text("Accept the clinical disclaimer to begin using Andernet Posture.")
                .font(.body)
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.xxxl)

            Spacer()

            Button {
                disclaimerAccepted = true
                withAnimation(.spring(duration: 0.4)) {
                    hasCompletedOnboarding = true
                }
            } label: {
                Text("Accept & Get Started")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.indigo)
            }
            .buttonStyle(.borderedProminent)
            .tint(.white)
            .controlSize(.large)
            .padding(.horizontal, AppSpacing.xxxl)
            .padding(.bottom, AppSpacing.xxxl)
        }
    }

    // MARK: - Helpers

    private func gradientColors(for page: Int) -> [Color] {
        switch page {
        case 0: return [.indigo, .purple]
        case 1: return [.purple, .blue]
        case 2: return [.blue, .teal]
        case 3: return [.teal, .green]
        case 4: return [.green, .indigo]
        default: return [.indigo, .purple]
        }
    }
}

// MARK: - Onboarding Page Template

private struct OnboardingPageView: View {
    let icon: String
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey

    @State private var appeared = false

    var body: some View {
        VStack(spacing: AppSpacing.xxl) {
            Spacer()

            Image(systemName: icon)
                .font(.system(size: 80))
                .foregroundStyle(.white)
                .scaleEffect(appeared ? 1 : 0.6)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(duration: 0.6, bounce: 0.3).delay(0.1), value: appeared)

            Text(title)
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .offset(y: appeared ? 0 : 20)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(duration: 0.5).delay(0.25), value: appeared)

            Text(subtitle)
                .font(.body)
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.xxxl)
                .offset(y: appeared ? 0 : 20)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(duration: 0.5).delay(0.35), value: appeared)

            Spacer()
            Spacer()
        }
        .onAppear { appeared = true }
        .onDisappear { appeared = false }
    }
}

#Preview {
    OnboardingView(hasCompletedOnboarding: .constant(false))
}
