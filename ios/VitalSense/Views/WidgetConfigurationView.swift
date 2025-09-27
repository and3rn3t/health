import SwiftUI
import WidgetKit

// MARK: - Widget Configuration View
struct WidgetConfigurationView: View {
    @StateObject private var preferences = WidgetPreferences.shared
    @StateObject private var healthManager = WidgetHealthManager.shared
    @State private var showingRefreshAlert = false
    @State private var isRefreshing = false

    var body: some View {
        NavigationView {
            Form {
                // Widget Preview Section
                Section("Widget Preview") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            // Small widget preview
                            VStack {
                                if let cachedEntry = healthManager.getCachedHealthEntry() {
                                    SmallHealthWidget(entry: cachedEntry)
                                        .frame(width: 155, height: 155)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                } else {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(Color.gray.opacity(0.3))
                                        .frame(width: 155, height: 155)
                                        .overlay {
                                            VStack {
                                                Image(systemName: "heart.fill")
                                                    .font(.largeTitle)
                                                    .foregroundColor(.gray)
                                                Text("Loading...")
                                                    .font(.caption)
                                                    .foregroundColor(.gray)
                                            }
                                        }
                                }

                                Text("Small")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            // Medium widget preview
                            VStack {
                                if let cachedEntry = healthManager.getCachedHealthEntry() {
                                    MediumHealthWidget(entry: cachedEntry)
                                        .frame(width: 329, height: 155)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                } else {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(Color.gray.opacity(0.3))
                                        .frame(width: 329, height: 155)
                                        .overlay {
                                            VStack {
                                                Image(systemName: "heart.fill")
                                                    .font(.largeTitle)
                                                    .foregroundColor(.gray)
                                                Text("Loading...")
                                                    .font(.caption)
                                                    .foregroundColor(.gray)
                                            }
                                        }
                                }

                                Text("Medium")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                // Configuration Section
                Section("Widget Settings") {
                    // Primary Metric
                    Picker("Primary Metric", selection: Binding(
                        get: { preferences.configuration.primaryMetric },
                        set: { newValue in
                            preferences.configuration = WidgetConfiguration(
                                refreshInterval: preferences.configuration.refreshInterval,
                                showTrends: preferences.configuration.showTrends,
                                compactMode: preferences.configuration.compactMode,
                                primaryMetric: newValue
                            )
                        }
                    )) {
                        ForEach(WidgetConfiguration.PrimaryMetric.allCases, id: \.rawValue) { metric in
                            HStack {
                                Image(systemName: metric.icon)
                                    .foregroundColor(.blue)
                                Text(metric.displayName)
                            }
                            .tag(metric)
                        }
                    }

                    // Show Trends Toggle
                    Toggle("Show Trends", isOn: Binding(
                        get: { preferences.configuration.showTrends },
                        set: { newValue in
                            preferences.configuration = WidgetConfiguration(
                                refreshInterval: preferences.configuration.refreshInterval,
                                showTrends: newValue,
                                compactMode: preferences.configuration.compactMode,
                                primaryMetric: preferences.configuration.primaryMetric
                            )
                        }
                    ))

                    // Compact Mode Toggle
                    Toggle("Compact Mode", isOn: Binding(
                        get: { preferences.configuration.compactMode },
                        set: { newValue in
                            preferences.configuration = WidgetConfiguration(
                                refreshInterval: preferences.configuration.refreshInterval,
                                showTrends: preferences.configuration.showTrends,
                                compactMode: newValue,
                                primaryMetric: preferences.configuration.primaryMetric
                            )
                        }
                    ))

                    // Refresh Interval
                    Picker("Refresh Interval", selection: Binding(
                        get: { preferences.configuration.refreshInterval },
                        set: { newValue in
                            preferences.configuration = WidgetConfiguration(
                                refreshInterval: newValue,
                                showTrends: preferences.configuration.showTrends,
                                compactMode: preferences.configuration.compactMode,
                                primaryMetric: preferences.configuration.primaryMetric
                            )
                        }
                    )) {
                        Text("1 minute").tag(60.0)
                        Text("5 minutes").tag(300.0)
                        Text("15 minutes").tag(900.0)
                        Text("30 minutes").tag(1800.0)
                        Text("1 hour").tag(3600.0)
                    }
                }

                // Widget Management Section
                Section("Widget Management") {
                    Button(action: {
                        refreshAllWidgets()
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(.blue)
                            Text("Refresh All Widgets")

                            if isRefreshing {
                                Spacer()
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                        }
                    }
                    .disabled(isRefreshing)

                    Button(action: {
                        openWidgetGallery()
                    }) {
                        HStack {
                            Image(systemName: "square.grid.3x3")
                                .foregroundColor(.green)
                            Text("Add Widgets to Home Screen")
                        }
                    }
                }

                // Available Widgets Section
                Section("Available Widgets") {
                    WidgetInfoRow(
                        title: "VitalSense Health",
                        description: "Comprehensive health overview with heart rate, steps, and activity",
                        icon: "heart.fill",
                        color: .red,
                        sizes: ["Small", "Medium", "Large", "Lock Screen"]
                    )

                    WidgetInfoRow(
                        title: "Heart Rate Monitor",
                        description: "Real-time heart rate with zone tracking",
                        icon: "heart.fill",
                        color: .red,
                        sizes: ["Small", "Lock Screen Circular", "Lock Screen Inline"]
                    )

                    WidgetInfoRow(
                        title: "Daily Activity",
                        description: "Track steps, active energy, and exercise minutes",
                        icon: "figure.walk",
                        color: .blue,
                        sizes: ["Small", "Medium", "Lock Screen Rectangular"]
                    )

                    WidgetInfoRow(
                        title: "Daily Steps",
                        description: "Step count with hourly breakdown and goals",
                        icon: "figure.walk",
                        color: .blue,
                        sizes: ["Small", "Lock Screen Circular", "Lock Screen Inline"]
                    )
                }

                // Health Data Status Section
                Section("Health Data Status") {
                    if let cachedEntry = healthManager.getCachedHealthEntry() {
                        HealthDataStatusRow(
                            title: "Heart Rate",
                            value: cachedEntry.heartRate.map { "\(Int($0)) bpm" } ?? "No data",
                            icon: "heart.fill",
                            color: .red
                        )

                        HealthDataStatusRow(
                            title: "Steps",
                            value: cachedEntry.steps.map { "\(Int($0))" } ?? "No data",
                            icon: "figure.walk",
                            color: .blue
                        )

                        HealthDataStatusRow(
                            title: "Active Energy",
                            value: cachedEntry.activeEnergy.map { "\(Int($0)) cal" } ?? "No data",
                            icon: "flame.fill",
                            color: .orange
                        )

                        HealthDataStatusRow(
                            title: "Walking Steadiness",
                            value: cachedEntry.walkingSteadiness.map { "\(Int($0))%" } ?? "No data",
                            icon: "figure.walk.motion",
                            color: .teal
                        )

                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(.secondary)
                            Text("Last updated: \(cachedEntry.date, style: .time)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                    } else {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.orange)
                            Text("No cached health data available")
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Widget Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert("Refreshing Widgets", isPresented: $showingRefreshAlert) {
                Button("OK") { }
            } message: {
                Text("All VitalSense widgets have been refreshed with the latest health data.")
            }
        }
    }

    private func refreshAllWidgets() {
        isRefreshing = true

        // Fetch fresh data and update widgets
        healthManager.fetchAllHealthData { _ in
            healthManager.refreshAllWidgets()

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                isRefreshing = false
                showingRefreshAlert = true
            }
        }
    }

    private func openWidgetGallery() {
        // This would typically open the iOS widget gallery
        // For now, we'll just show instructions
        guard let settingsUrl = URL(string: "prefs:root=WALLPAPER") else { return }
        if UIApplication.shared.canOpenURL(settingsUrl) {
            UIApplication.shared.open(settingsUrl)
        }
    }
}

// MARK: - Widget Info Row
struct WidgetInfoRow: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    let sizes: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.medium)

                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                Spacer()
            }

            // Available sizes
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(sizes, id: \.self) { size in
                        Text(size)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(color.opacity(0.2))
                            .foregroundColor(color)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Health Data Status Row
struct HealthDataStatusRow: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 24)

            Text(title)
                .font(.body)

            Spacer()

            Text(value)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(value.contains("No data") ? .secondary : .primary)
        }
    }
}

// MARK: - Widget Setup Guide View
struct WidgetSetupGuideView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "widget.large.badge.plus")
                                .font(.largeTitle)
                                .foregroundColor(.blue)

                            VStack(alignment: .leading) {
                                Text("VitalSense Widgets")
                                    .font(.title)
                                    .fontWeight(.bold)

                                Text("Add health monitoring to your home screen")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal)

                    // Setup Steps
                    VStack(alignment: .leading, spacing: 20) {
                        SetupStepView(
                            step: 1,
                            title: "Long Press Home Screen",
                            description: "Long press on an empty area of your home screen until apps start jiggling"
                        )

                        SetupStepView(
                            step: 2,
                            title: "Tap the '+' Button",
                            description: "Tap the '+' button in the top-left corner to open the widget gallery"
                        )

                        SetupStepView(
                            step: 3,
                            title: "Find VitalSense",
                            description: "Scroll down and tap 'VitalSense' or search for 'VitalSense' in the search bar"
                        )

                        SetupStepView(
                            step: 4,
                            title: "Choose Widget Size",
                            description: "Select from Small, Medium, or Large widget sizes, then tap 'Add Widget'"
                        )

                        SetupStepView(
                            step: 5,
                            title: "Position and Customize",
                            description: "Drag the widget to your desired location and tap 'Done'"
                        )
                    }
                    .padding(.horizontal)

                    // Widget Types
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Available Widget Types")
                            .font(.headline)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        VStack(spacing: 12) {
                            WidgetTypeCard(
                                title: "VitalSense Health",
                                description: "Complete health overview with heart rate, steps, active energy, and walking steadiness",
                                icon: "heart.fill",
                                color: .red,
                                sizes: ["Small", "Medium", "Large"]
                            )

                            WidgetTypeCard(
                                title: "Heart Rate Monitor",
                                description: "Real-time heart rate monitoring with zone tracking and trends",
                                icon: "heart.fill",
                                color: .red,
                                sizes: ["Small", "Lock Screen"]
                            )

                            WidgetTypeCard(
                                title: "Daily Activity",
                                description: "Track your daily steps, active energy, and exercise progress",
                                icon: "figure.walk",
                                color: .blue,
                                sizes: ["Small", "Medium"]
                            )

                            WidgetTypeCard(
                                title: "Daily Steps",
                                description: "Step counter with progress tracking and hourly breakdown",
                                icon: "figure.walk",
                                color: .blue,
                                sizes: ["Small", "Lock Screen"]
                            )
                        }
                        .padding(.horizontal)
                    }

                    // Tips
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Tips")
                            .font(.headline)
                            .fontWeight(.bold)

                        VStack(alignment: .leading, spacing: 8) {
                            TipView(
                                icon: "applewatch",
                                text: "Make sure your Apple Watch is connected for the most accurate heart rate data"
                            )

                            TipView(
                                icon: "location",
                                text: "Allow VitalSense to access your Health data for widget updates"
                            )

                            TipView(
                                icon: "arrow.clockwise",
                                text: "Widgets update automatically throughout the day, but you can refresh manually in the app"
                            )

                            TipView(
                                icon: "battery.100",
                                text: "Widgets are optimized for battery life with smart refresh intervals"
                            )
                        }
                    }
                    .padding(.horizontal)

                    Spacer(minLength: 40)
                }
            }
            .navigationTitle("Widget Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Setup Step View
struct SetupStepView: View {
    let step: Int
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(.blue)
                    .frame(width: 32, height: 32)

                Text("\(step)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer()
        }
    }
}

// MARK: - Widget Type Card
struct WidgetTypeCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    let sizes: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                Spacer()
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(sizes, id: \.self) { size in
                        Text(size)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(color.opacity(0.2))
                            .foregroundColor(color)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Tip View
struct TipView: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 20)

            Text(text)
                .font(.body)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()
        }
    }
}

// MARK: - Preview
struct WidgetConfigurationView_Previews: PreviewProvider {
    static var previews: some View {
        WidgetConfigurationView()
    }
}
