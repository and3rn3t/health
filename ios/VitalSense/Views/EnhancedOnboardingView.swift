//
//  EnhancedOnboardingView.swift
//  VitalSense
//
//  Comprehensive onboarding experience for first-time users
//  Guides users through permissions and feature setup
//

import SwiftUI
import HealthKit

struct EnhancedOnboardingView: View {
    @EnvironmentObject var appConfig: AppConfig
    @EnvironmentObject var healthKitManager: HealthKitManager
    @StateObject private var permissionCoordinator = HealthKitPermissionCoordinator.shared
    @Environment(\.dismiss) private var dismiss

    @State private var currentStep = 0
    @State private var isAnimating = false
    @State private var showingPermissionRequest = false

    private let totalSteps = 5

    var body: some View {
        ZStack {
            // Background
            Color("VitalSenseBackground")
                .ignoresSafeArea()

            // Content
            TabView(selection: $currentStep) {
                welcomeStep
                    .tag(0)

                featuresStep
                    .tag(1)

                permissionsStep
                    .tag(2)

                preferencesStep
                    .tag(3)

                completionStep
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .indexViewStyle(.page(backgroundDisplayMode: .always))

            // Navigation
            VStack {
                Spacer()

                HStack(spacing: 16) {
                    if currentStep > 0 {
                        Button(action: previousStep) {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }

                    Button(action: nextStep) {
                        HStack {
                            Text(currentStep == totalSteps - 1 ? "Get Started" : "Next")
                            if currentStep < totalSteps - 1 {
                                Image(systemName: "chevron.right")
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Welcome Step

    private var welcomeStep: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo
            Image("VitalSenseLogo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 150, height: 150)
                .scaleEffect(isAnimating ? 1.0 : 0.9)
                .opacity(isAnimating ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8), value: isAnimating)

            VStack(spacing: 16) {
                Text("Welcome to VitalSense")
                    .font(.system(size: 36, weight: .bold))
                    .multilineTextAlignment(.center)

                Text("Your personal health monitoring companion")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .opacity(isAnimating ? 1.0 : 0.0)
            .offset(y: isAnimating ? 0 : 20)
            .animation(.easeOut(duration: 0.8).delay(0.2), value: isAnimating)

            Spacer()

            // Features preview
            VStack(alignment: .leading, spacing: 12) {
                FeatureItem(
                    icon: "heart.fill",
                    title: "Health Monitoring",
                    description: "Track your health metrics 24/7"
                )

                FeatureItem(
                    icon: "figure.walk",
                    title: "Gait Analysis",
                    description: "AI-powered fall prevention"
                )

                FeatureItem(
                    icon: "shield.fill",
                    title: "Emergency Alerts",
                    description: "Stay safe with instant notifications"
                )
            }
            .padding()
            .background(.ultraThinMaterial)
            .cornerRadius(16)
            .opacity(isAnimating ? 1.0 : 0.0)
            .offset(y: isAnimating ? 0 : 20)
            .animation(.easeOut(duration: 0.8).delay(0.4), value: isAnimating)

            Spacer()
        }
        .padding()
        .onAppear {
            isAnimating = true
        }
    }

    // MARK: - Features Step

    private var featuresStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("What VitalSense Does")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding(.top)

                FeatureCard(
                    icon: "heart.text.square.fill",
                    iconColor: .red,
                    title: "Health Monitoring",
                    description: "Comprehensive tracking of heart rate, steps, sleep, and more. Real-time insights into your health patterns."
                )

                FeatureCard(
                    icon: "brain.head.profile",
                    iconColor: .purple,
                    title: "AI-Powered Insights",
                    description: "Advanced machine learning analyzes your health data to provide personalized recommendations and early warnings."
                )

                FeatureCard(
                    icon: "figure.walk",
                    iconColor: .blue,
                    title: "Gait Analysis",
                    description: "LiDAR-powered gait analysis helps assess fall risk and improve mobility through detailed movement analysis."
                )

                FeatureCard(
                    icon: "shield.checkered",
                    iconColor: .orange,
                    title: "Fall Prevention",
                    description: "Early detection of fall risk factors with proactive alerts and recommendations to keep you safe."
                )

                FeatureCard(
                    icon: "bell.badge.fill",
                    iconColor: .green,
                    title: "Smart Notifications",
                    description: "Context-aware alerts and reminders that adapt to your schedule and health patterns."
                )
            }
            .padding()
        }
    }

    // MARK: - Permissions Step

    private var permissionsStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Permissions Needed")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding(.top)

                Text("VitalSense needs your permission to provide the best health monitoring experience.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                PermissionCard(
                    icon: "heart.fill",
                    iconColor: .red,
                    title: "Health Data",
                    description: "Read and write health metrics like heart rate, steps, and walking steadiness to provide comprehensive health insights.",
                    isGranted: healthKitManager.authorizationStatus == .sharingAuthorized
                ) {
                    requestHealthKitPermission()
                }

                PermissionCard(
                    icon: "bell.fill",
                    iconColor: .orange,
                    title: "Notifications",
                    description: "Send important health alerts, fall risk warnings, and reminders to keep you informed about your health.",
                    isGranted: permissionCoordinator.completed
                ) {
                    requestNotificationPermission()
                }

                PermissionCard(
                    icon: "location.fill",
                    iconColor: .blue,
                    title: "Location (Optional)",
                    description: "Enable emergency response features and location-aware health alerts. Only used during emergencies.",
                    isGranted: false,
                    isOptional: true
                ) {
                    requestLocationPermission()
                }
            }
            .padding()
        }
    }

    // MARK: - Preferences Step

    private var preferencesStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Customize Your Experience")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding(.top)

                PreferenceCard(
                    icon: "figure.walk",
                    title: "Gait Monitoring",
                    description: "Enable AI-powered gait analysis and fall risk assessment",
                    isEnabled: $appConfig.gaitMonitoringEnabled
                )

                PreferenceCard(
                    icon: "bell.fill",
                    title: "Health Reminders",
                    description: "Receive daily health check reminders and insights",
                    isEnabled: .constant(true)
                )

                PreferenceCard(
                    icon: "person.2.fill",
                    title: "Caregiver Sharing",
                    description: "Allow family members to monitor your health status",
                    isEnabled: .constant(false)
                )
            }
            .padding()
        }
    }

    // MARK: - Completion Step

    private var completionStep: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.green)
                .scaleEffect(isAnimating ? 1.0 : 0.5)
                .animation(.spring(response: 0.6, dampingFraction: 0.6), value: isAnimating)

            VStack(spacing: 16) {
                Text("You're All Set!")
                    .font(.system(size: 36, weight: .bold))

                Text("VitalSense is ready to help you monitor and improve your health. Let's get started!")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            Spacer()
        }
        .padding()
        .onAppear {
            isAnimating = true
        }
    }

    // MARK: - Actions

    private func nextStep() {
        if currentStep < totalSteps - 1 {
            withAnimation {
                currentStep += 1
                isAnimating = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    isAnimating = true
                }
            }
        } else {
            completeOnboarding()
        }
    }

    private func previousStep() {
        if currentStep > 0 {
            withAnimation {
                currentStep -= 1
                isAnimating = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    isAnimating = true
                }
            }
        }
    }

    private func requestHealthKitPermission() {
        Task {
            do {
                let granted = try await healthKitManager.requestAuthorization()
                if granted {
                    print("✅ HealthKit permission granted")
                }
            } catch {
                print("❌ HealthKit permission error: \(error)")
            }
        }
    }

    private func requestNotificationPermission() {
        Task {
            do {
                try await SmartNotificationManager.shared.requestPermissions()
                print("✅ Notification permission granted")
            } catch {
                print("❌ Notification permission error: \(error)")
            }
        }
    }

    private func requestLocationPermission() {
        // Location permission request would go here
        print("📍 Location permission requested")
    }

    private func completeOnboarding() {
        appConfig.markOnboardingComplete()
        dismiss()
    }
}

// MARK: - Supporting Views

struct FeatureItem: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.accentColor)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct FeatureCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(iconColor)
                .frame(width: 50)

            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// Canonical app-level permission explanation card.
struct PermissionCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    let isGranted: Bool
    var isOptional: Bool = false
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(iconColor)
                    .frame(width: 32)

                Text(title)
                    .font(.headline)

                Spacer()

                if isGranted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Image(systemName: "circle")
                        .foregroundColor(.gray)
                }
            }

            Text(description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            if !isGranted {
                Button(action: action) {
                    HStack {
                        Text(isOptional ? "Enable (Optional)" : "Grant Permission")
                        Image(systemName: "arrow.right.circle.fill")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PreferenceCard: View {
    let icon: String
    let title: String
    let description: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.accentColor)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isEnabled)
                .labelsHidden()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
