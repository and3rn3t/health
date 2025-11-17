//
//  CognitiveHealthView.swift
//  VitalSense
//
//  Cognitive health monitoring with interactive assessments
//  Ported from web app CognitiveHealth component
//

import SwiftUI
import HealthKit

struct CognitiveHealthView: View {
    @StateObject private var cognitiveManager = CognitiveHealthManager.shared
    @State private var selectedTab: AssessmentTab = .assessments
    @State private var showingSettings = false
    @State private var showingSummary = false

    enum AssessmentTab: String, CaseIterable {
        case assessments = "Assessments"
        case trends = "Trends"
        case settings = "Settings"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    ForEach(AssessmentTab.allCases, id: \.self) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                ScrollView {
                    switch selectedTab {
                    case .assessments:
                        assessmentsContent
                    case .trends:
                        trendsContent
                    case .settings:
                        settingsContent
                    }
                }
            }
            .navigationTitle("Cognitive Health")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                    }
                }
            }
            .sheet(isPresented: $showingSettings) {
                CognitiveSettingsView(cognitiveManager: cognitiveManager)
            }
            .sheet(isPresented: $showingSummary) {
                AssessmentSummaryView(
                    result: cognitiveManager.lastAssessmentResult,
                    onDismiss: { showingSummary = false }
                )
            }
        }
        .onAppear {
            cognitiveManager.loadHistory()
        }
    }

    // MARK: - Assessments Content

    private var assessmentsContent: some View {
        VStack(spacing: 20) {
            // Overview Card
            if let lastResult = cognitiveManager.lastAssessmentResult {
                CognitiveOverviewCard(result: lastResult)
                    .padding(.horizontal)
            }

            // Assessment Tests
            VStack(spacing: 16) {
                Text("Available Assessments")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                ReactionTimeTestCard(cognitiveManager: cognitiveManager)

                MemorySequenceTestCard(cognitiveManager: cognitiveManager)

                AttentionGoNoGoTestCard(cognitiveManager: cognitiveManager)
            }
        }
        .padding(.vertical)
    }

    // MARK: - Trends Content

    private var trendsContent: some View {
        VStack(spacing: 20) {
            if cognitiveManager.assessmentHistory.isEmpty {
                EmptyStateView(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "No Assessment History",
                    message: "Complete assessments to see trends over time."
                )
                .padding(.vertical, 60)
            } else {
                // Trend Chart
                if #available(iOS 16.0, *) {
                    CognitiveTrendChart(results: cognitiveManager.assessmentHistory)
                        .padding()
                }

                // Recent Results
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Assessments")
                        .font(.headline)
                        .padding(.horizontal)

                    ForEach(cognitiveManager.assessmentHistory.prefix(10)) { result in
                        AssessmentResultRow(result: result)
                            .padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical)
    }

    // MARK: - Settings Content

    private var settingsContent: some View {
        Form {
            Section {
                Toggle("Assessment Reminders", isOn: $cognitiveManager.remindersEnabled)

                Stepper(
                    "Assessments per Week: \(cognitiveManager.assessmentsPerWeek)",
                    value: $cognitiveManager.assessmentsPerWeek,
                    in: 1...7
                )

                Toggle("Share with Caregivers", isOn: $cognitiveManager.shareWithCaregivers)
            } header: {
                Text("Preferences")
            } footer: {
                Text("Configure how often you want to track your cognitive health.")
            }
        }
    }
}

// MARK: - Cognitive Overview Card

struct CognitiveOverviewCard: View {
    let result: CognitiveAssessmentResult

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Composite Score")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("\(Int(result.compositeScore))")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(scoreColor)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 8) {
                    RiskBadge(score: result.compositeScore)

                    Text(result.date, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            HStack(spacing: 20) {
                MetricItem(
                    label: "Reaction",
                    value: result.reactionAvgMs != nil ? "\(Int(result.reactionAvgMs!))ms" : "—",
                    icon: "timer"
                )

                MetricItem(
                    label: "Memory",
                    value: result.memoryMaxLevel != nil ? "Level \(result.memoryMaxLevel!)" : "—",
                    icon: "brain"
                )

                MetricItem(
                    label: "Attention",
                    value: result.attentionScore != nil ? "\(Int(result.attentionScore!))%" : "—",
                    icon: "eye"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }

    private var scoreColor: Color {
        if result.compositeScore >= 80 {
            return .green
        } else if result.compositeScore >= 60 {
            return .orange
        } else {
            return .red
        }
    }
}

struct RiskBadge: View {
    let score: Double

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(badgeColor)
                .frame(width: 8, height: 8)

            Text(badgeText)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(badgeColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(badgeColor.opacity(0.15))
        .cornerRadius(8)
    }

    private var badgeText: String {
        if score >= 80 {
            return "Low Risk"
        } else if score >= 60 {
            return "Moderate Risk"
        } else {
            return "Elevated Risk"
        }
    }

    private var badgeColor: Color {
        if score >= 80 {
            return .green
        } else if score >= 60 {
            return .orange
        } else {
            return .red
        }
    }
}

struct MetricItem: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.accentColor)

            Text(value)
                .font(.headline)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Assessment Test Cards

struct ReactionTimeTestCard: View {
    @ObservedObject var cognitiveManager: CognitiveHealthManager
    @State private var isRunning = false
    @State private var prompt: ReactionPrompt = .getReady
    @State private var rounds: [TimeInterval] = []
    @State private var startTime: Date?

    enum ReactionPrompt {
        case getReady
        case wait
        case click
        case done
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "timer")
                    .foregroundColor(.blue)

                Text("Reaction Time Test")
                    .font(.headline)
            }

            Text("Measure response speed to visual cues. 5 rounds.")
                .font(.subheadline)
                .foregroundColor(.secondary)

            if isRunning || rounds.count > 0 {
                reactionArea
            } else {
                Button(action: startTest) {
                    Label("Start Test", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }

            if !rounds.isEmpty {
                Text("Attempts: \(rounds.count)/5")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private var reactionArea: some View {
        Button(action: handleClick) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(backgroundColor)
                    .frame(height: 120)

                Text(promptText)
                    .font(.headline)
                    .foregroundColor(.primary)
            }
        }
        .disabled(prompt == .done)
    }

    private var promptText: String {
        switch prompt {
        case .getReady: return "Get Ready..."
        case .wait: return "Wait..."
        case .click: return "Click!"
        case .done: return "Done"
        }
    }

    private var backgroundColor: Color {
        switch prompt {
        case .getReady, .wait: return Color(.systemGray5)
        case .click: return Color.green.opacity(0.3)
        case .done: return Color(.systemGray6)
        }
    }

    private func startTest() {
        rounds = []
        isRunning = true
        prompt = .getReady
        startRound()
    }

    private func startRound() {
        prompt = .wait

        // Random delay between 0.8s and 2.3s
        let delay = Double.random(in: 0.8...2.3)

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            if isRunning {
                prompt = .click
                startTime = Date()
            }
        }
    }

    private func handleClick() {
        guard isRunning else { return }

        if prompt == .click, let start = startTime {
            let reactionTime = Date().timeIntervalSince(start)
            rounds.append(reactionTime)

            if rounds.count >= 5 {
                completeTest()
            } else {
                prompt = .getReady
                startRound()
            }
        } else if prompt == .wait {
            // Clicked too early, restart round
            startRound()
        }
    }

    private func completeTest() {
        isRunning = false
        prompt = .done

        let average = rounds.reduce(0, +) / Double(rounds.count)
        let avgMs = average * 1000

        cognitiveManager.completeReactionTest(averageMs: avgMs)
    }
}

struct MemorySequenceTestCard: View {
    @ObservedObject var cognitiveManager: CognitiveHealthManager
    @State private var isRunning = false
    @State private var sequence: [Int] = []
    @State private var inputIndex = 0
    @State private var highlightedTile: Int?
    @State private var maxLevel = 0

    private let tiles = ["A", "B", "C", "D"]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain")
                    .foregroundColor(.purple)

                Text("Memory Sequence Test")
                    .font(.headline)
            }

            Text("Remember and repeat the sequence. Level: \(maxLevel)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            if isRunning || maxLevel > 0 {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 12) {
                    ForEach(0..<4, id: \.self) { index in
                        Button(action: { handleTileTap(index) }) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(tileColor(for: index))
                                    .frame(height: 80)

                                Text(tiles[index])
                                    .font(.title2)
                                    .fontWeight(.bold)
                            }
                        }
                        .disabled(isRunning)
                    }
                }
            } else {
                Button(action: startTest) {
                    Label("Start Test", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private func tileColor(for index: Int) -> Color {
        if highlightedTile == index {
            return Color.accentColor.opacity(0.3)
        }
        return Color(.systemGray5)
    }

    private func startTest() {
        maxLevel = 0
        inputIndex = 0
        startRound()
    }

    private func startRound() {
        isRunning = true
        let level = max(maxLevel + 1, 3)
        let newSequence = (0..<level).map { _ in Int.random(in: 0..<4) }
        sequence = newSequence
        inputIndex = 0

        playSequence()
    }

    private func playSequence() {
        var index = 0

        func showNext() {
            guard index < sequence.count else {
                isRunning = false
                return
            }

            highlightedTile = sequence[index]

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                highlightedTile = nil
                index += 1

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    showNext()
                }
            }
        }

        showNext()
    }

    private func handleTileTap(_ tile: Int) {
        guard !isRunning, inputIndex < sequence.count else { return }

        if sequence[inputIndex] == tile {
            inputIndex += 1

            if inputIndex >= sequence.count {
                maxLevel = max(maxLevel, sequence.count)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    startRound()
                }
            }
        } else {
            // Wrong tile
            cognitiveManager.completeMemoryTest(maxLevel: maxLevel)
            sequence = []
            inputIndex = 0
        }
    }
}

struct AttentionGoNoGoTestCard: View {
    @ObservedObject var cognitiveManager: CognitiveHealthManager
    @State private var isRunning = false
    @State private var trialIndex = 0
    @State private var stimulus: StimulusType = .idle
    @State private var correct = 0
    @State private var falsePositives = 0

    private let totalTrials = 20

    enum StimulusType {
        case idle
        case go
        case nogo
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "eye")
                    .foregroundColor(.orange)

                Text("Attention Test")
                    .font(.headline)
            }

            Text("Click when you see GO, don't click for NO-GO. \(totalTrials - trialIndex) remaining")
                .font(.subheadline)
                .foregroundColor(.secondary)

            if isRunning || trialIndex > 0 {
                Button(action: handleClick) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(stimulusColor)
                            .frame(height: 120)

                        Text(stimulusText)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                    }
                }
                .disabled(stimulus == .idle)
            } else {
                Button(action: startTest) {
                    Label("Start Test", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }

            if trialIndex > 0 {
                HStack {
                    Text("Correct: \(correct)")
                    Spacer()
                    Text("False Positives: \(falsePositives)")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private var stimulusText: String {
        switch stimulus {
        case .idle: return "Wait..."
        case .go: return "GO"
        case .nogo: return "NO-GO"
        }
    }

    private var stimulusColor: Color {
        switch stimulus {
        case .idle: return Color(.systemGray5)
        case .go: return Color.green.opacity(0.3)
        case .nogo: return Color.red.opacity(0.3)
        }
    }

    private func startTest() {
        isRunning = true
        trialIndex = 0
        correct = 0
        falsePositives = 0
        scheduleNextTrial()
    }

    private func scheduleNextTrial() {
        guard trialIndex < totalTrials else {
            completeTest()
            return
        }

        stimulus = .idle

        // Random delay 0.6s - 1.5s
        let delay = Double.random(in: 0.6...1.5)

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            // 70% GO, 30% NO-GO
            let isGo = Double.random(in: 0...1) < 0.7
            stimulus = isGo ? .go : .nogo

            // Auto-advance after 2 seconds if not clicked
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                if stimulus == .nogo {
                    // Correct - didn't click NO-GO
                    correct += 1
                    trialIndex += 1
                    scheduleNextTrial()
                } else if stimulus == .go {
                    // Missed GO trial
                    trialIndex += 1
                    scheduleNextTrial()
                }
            }
        }
    }

    private func handleClick() {
        guard stimulus != .idle else { return }

        if stimulus == .go {
            correct += 1
        } else if stimulus == .nogo {
            falsePositives += 1
        }

        trialIndex += 1
        scheduleNextTrial()
    }

    private func completeTest() {
        isRunning = false
        stimulus = .idle

        let accuracy = max(0, correct - falsePositives)
        let score = Int((Double(accuracy) / Double(totalTrials)) * 100)

        cognitiveManager.completeAttentionTest(score: score)
    }
}

// MARK: - Trend Chart

@available(iOS 16.0, *)
struct CognitiveTrendChart: View {
    let results: [CognitiveAssessmentResult]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cognitive Health Trends")
                .font(.headline)

            Chart(results) { result in
                LineMark(
                    x: .value("Date", result.date),
                    y: .value("Score", result.compositeScore)
                )
                .foregroundStyle(.blue)
                .lineStyle(StrokeStyle(lineWidth: 2))

                PointMark(
                    x: .value("Date", result.date),
                    y: .value("Score", result.compositeScore)
                )
                .foregroundStyle(.blue)
                .symbolSize(36)
            }
            .frame(height: 200)
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Assessment Result Row

struct AssessmentResultRow: View {
    let result: CognitiveAssessmentResult

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Composite Score: \(Int(result.compositeScore))")
                    .font(.headline)

                HStack(spacing: 16) {
                    if let reaction = result.reactionAvgMs {
                        Text("Reaction: \(Int(reaction))ms")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let memory = result.memoryMaxLevel {
                        Text("Memory: L\(memory)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let attention = result.attentionScore {
                        Text("Attention: \(Int(attention))%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            Text(result.date, style: .relative)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Views

struct AssessmentSummaryView: View {
    let result: CognitiveAssessmentResult?
    let onDismiss: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                if let result = result {
                    VStack(spacing: 24) {
                        Text("Assessment Complete")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Composite Score: \(Int(result.compositeScore))")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(scoreColor(result.compositeScore))

                        VStack(alignment: .leading, spacing: 16) {
                            if let reaction = result.reactionAvgMs {
                                ResultItem(
                                    label: "Reaction Time",
                                    value: "\(Int(reaction))ms",
                                    icon: "timer"
                                )
                            }

                            if let memory = result.memoryMaxLevel {
                                ResultItem(
                                    label: "Memory Level",
                                    value: "Level \(memory)",
                                    icon: "brain"
                                )
                            }

                            if let attention = result.attentionScore {
                                ResultItem(
                                    label: "Attention Score",
                                    value: "\(Int(attention))%",
                                    icon: "eye"
                                )
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .padding()
                }
            }
            .navigationTitle("Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        onDismiss()
                        dismiss()
                    }
                }
            }
        }
    }

    private func scoreColor(_ score: Double) -> Color {
        if score >= 80 {
            return .green
        } else if score >= 60 {
            return .orange
        } else {
            return .red
        }
    }
}

struct ResultItem: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.accentColor)
                .frame(width: 24)

            Text(label)

            Spacer()

            Text(value)
                .fontWeight(.semibold)
        }
    }
}

struct CognitiveSettingsView: View {
    @ObservedObject var cognitiveManager: CognitiveHealthManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section {
                    Toggle("Assessment Reminders", isOn: $cognitiveManager.remindersEnabled)

                    Stepper(
                        "Assessments per Week: \(cognitiveManager.assessmentsPerWeek)",
                        value: $cognitiveManager.assessmentsPerWeek,
                        in: 1...7
                    )

                    Toggle("Share with Caregivers", isOn: $cognitiveManager.shareWithCaregivers)
                } header: {
                    Text("Preferences")
                } footer: {
                    Text("Configure how often you want to track your cognitive health.")
                }
            }
            .navigationTitle("Cognitive Settings")
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

// MARK: - Data Models

struct CognitiveAssessmentResult: Identifiable, Codable {
    let id = UUID()
    let date: Date
    var reactionAvgMs: Double?
    var memoryMaxLevel: Int?
    var attentionScore: Double?
    let compositeScore: Double

    init(
        date: Date = Date(),
        reactionAvgMs: Double? = nil,
        memoryMaxLevel: Int? = nil,
        attentionScore: Double? = nil
    ) {
        self.date = date
        self.reactionAvgMs = reactionAvgMs
        self.memoryMaxLevel = memoryMaxLevel
        self.attentionScore = attentionScore

        // Calculate composite score (0-100)
        var scores: [Double] = []

        if let reaction = reactionAvgMs {
            // Convert reaction time to score (lower is better)
            // 200ms = 100, 500ms = 0
            let reactionScore = max(0, 100 - ((reaction - 200) / 3))
            scores.append(reactionScore)
        }

        if let memory = memoryMaxLevel {
            // Convert memory level to score (higher is better)
            // Level 3 = 50, Level 6+ = 100
            let memoryScore = min(100, Double(memory - 3) * 16.67 + 50)
            scores.append(memoryScore)
        }

        if let attention = attentionScore {
            scores.append(attention)
        }

        self.compositeScore = scores.isEmpty ? 0 : scores.reduce(0, +) / Double(scores.count)
    }
}

// MARK: - Cognitive Health Manager

@MainActor
class CognitiveHealthManager: ObservableObject {
    static let shared = CognitiveHealthManager()

    @Published var assessmentHistory: [CognitiveAssessmentResult] = []
    @Published var lastAssessmentResult: CognitiveAssessmentResult?
    @Published var remindersEnabled = false
    @Published var assessmentsPerWeek = 3
    @Published var shareWithCaregivers = false

    private var currentResult: CognitiveAssessmentResult?

    private init() {
        loadHistory()
        loadSettings()
    }

    func loadHistory() {
        if let data = UserDefaults.standard.data(forKey: "CognitiveAssessmentHistory"),
           let history = try? JSONDecoder().decode([CognitiveAssessmentResult].self, from: data) {
            assessmentHistory = history.sorted { $0.date > $1.date }
            lastAssessmentResult = history.last
        }
    }

    func saveHistory() {
        if let data = try? JSONEncoder().encode(assessmentHistory) {
            UserDefaults.standard.set(data, forKey: "CognitiveAssessmentHistory")
        }
    }

    func loadSettings() {
        remindersEnabled = UserDefaults.standard.bool(forKey: "CognitiveRemindersEnabled")
        assessmentsPerWeek = UserDefaults.standard.integer(forKey: "CognitiveAssessmentsPerWeek")
        if assessmentsPerWeek == 0 {
            assessmentsPerWeek = 3
        }
        shareWithCaregivers = UserDefaults.standard.bool(forKey: "CognitiveShareWithCaregivers")
    }

    func saveSettings() {
        UserDefaults.standard.set(remindersEnabled, forKey: "CognitiveRemindersEnabled")
        UserDefaults.standard.set(assessmentsPerWeek, forKey: "CognitiveAssessmentsPerWeek")
        UserDefaults.standard.set(shareWithCaregivers, forKey: "CognitiveShareWithCaregivers")
    }

    func completeReactionTest(averageMs: Double) {
        if currentResult == nil {
            currentResult = CognitiveAssessmentResult()
        }
        currentResult?.reactionAvgMs = averageMs
        updateCompositeScore()
    }

    func completeMemoryTest(maxLevel: Int) {
        if currentResult == nil {
            currentResult = CognitiveAssessmentResult()
        }
        currentResult?.memoryMaxLevel = maxLevel
        updateCompositeScore()
    }

    func completeAttentionTest(score: Double) {
        if currentResult == nil {
            currentResult = CognitiveAssessmentResult()
        }
        currentResult?.attentionScore = score
        updateCompositeScore()
    }

    private func updateCompositeScore() {
        guard var result = currentResult else { return }

        // Recalculate composite score
        let newResult = CognitiveAssessmentResult(
            date: result.date,
            reactionAvgMs: result.reactionAvgMs,
            memoryMaxLevel: result.memoryMaxLevel,
            attentionScore: result.attentionScore
        )

        currentResult = newResult
        lastAssessmentResult = newResult
        assessmentHistory.append(newResult)

        // Keep only last 100 assessments
        if assessmentHistory.count > 100 {
            assessmentHistory = Array(assessmentHistory.suffix(100))
        }

        saveHistory()

        // Reset for next assessment
        currentResult = nil
    }
}
