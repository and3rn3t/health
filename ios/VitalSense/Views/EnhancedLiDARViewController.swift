import UIKit
import SwiftUI
import Combine

/// Enhanced LiDAR Health Analysis View Controller
/// Provides native iOS interface for the enhanced LiDAR ML analysis system
/// SwiftLint-compliant implementation with proper line breaks
class EnhancedLiDARViewController: UIViewController {

    // MARK: - Properties
    private let mlManager = EnhancedLiDARMLManager.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - UI Components
    private lazy var scrollView: UIScrollView = {
        let scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsVerticalScrollIndicator = false
        return scrollView
    }()

    private lazy var contentView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.text = "🤖 Enhanced LiDAR Health Analyzer"
        label.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        label.textColor = .label
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private lazy var subtitleLabel: UILabel = {
        let label = UILabel()
        label.text = "AI-powered health analysis with multi-modal sensor fusion"
        label.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private lazy var systemStatusCard: SystemStatusCardView = {
        let card = SystemStatusCardView()
        card.translatesAutoresizingMaskIntoConstraints = false
        return card
    }()

    private lazy var analysisButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Start Enhanced Analysis", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 12
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(startAnalysisTapped), for: .touchUpInside)
        return button
    }()

    private lazy var progressView: UIProgressView = {
        let progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.isHidden = true
        return progressView
    }()

    private lazy var progressLabel: UILabel = {
        let label = UILabel()
        label.text = "Analysis Progress"
        label.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        label.isHidden = true
        return label
    }()

    private lazy var resultsContainerView: UIView = {
        let view = UIView()
        view.backgroundColor = .secondarySystemBackground
        view.layer.cornerRadius = 12
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    // MARK: - SwiftUI Results View
    private var resultsHostingController: UIHostingController<EnhancedAnalysisResultsView>?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupBindings()
        configureNotifications()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateSystemStatus()
    }

    // MARK: - Setup

    private func setupUI() {
        view.backgroundColor = .systemBackground
        navigationItem.title = "Enhanced LiDAR Analysis"

        // Add scroll view
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        // Add main components
        contentView.addSubview(titleLabel)
        contentView.addSubview(subtitleLabel)
        contentView.addSubview(systemStatusCard)
        contentView.addSubview(analysisButton)
        contentView.addSubview(progressView)
        contentView.addSubview(progressLabel)
        contentView.addSubview(resultsContainerView)

        setupConstraints()
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Scroll view constraints
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Content view constraints
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),

            // Title constraints
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            // Subtitle constraints
            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            subtitleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            subtitleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            // System status card constraints
            systemStatusCard.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 24),
            systemStatusCard.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            systemStatusCard.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            systemStatusCard.heightAnchor.constraint(equalToConstant: 120),

            // Analysis button constraints
            analysisButton.topAnchor.constraint(equalTo: systemStatusCard.bottomAnchor, constant: 24),
            analysisButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            analysisButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            analysisButton.heightAnchor.constraint(equalToConstant: 50),

            // Progress view constraints
            progressView.topAnchor.constraint(equalTo: analysisButton.bottomAnchor, constant: 16),
            progressView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            progressView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            // Progress label constraints
            progressLabel.topAnchor.constraint(equalTo: progressView.bottomAnchor, constant: 8),
            progressLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            progressLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            // Results container constraints
            resultsContainerView.topAnchor.constraint(equalTo: progressLabel.bottomAnchor, constant: 24),
            resultsContainerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            resultsContainerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            resultsContainerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20)
        ])
    }

    private func setupBindings() {
        // Bind to ML manager state
        mlManager.$isInitialized
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isInitialized in
                self?.updateSystemStatus()
            }
            .store(in: &cancellables)

        mlManager.$mlModelsLoaded
            .receive(on: DispatchQueue.main)
            .sink { [weak self] modelsLoaded in
                self?.updateSystemStatus()
                self?.updateAnalysisButton()
            }
            .store(in: &cancellables)

        mlManager.$analysisInProgress
            .receive(on: DispatchQueue.main)
            .sink { [weak self] inProgress in
                self?.updateAnalysisUI(inProgress: inProgress)
            }
            .store(in: &cancellables)

        mlManager.$lastAnalysisResult
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                if let result = result {
                    self?.displayAnalysisResults(result)
                }
            }
            .store(in: &cancellables)

        mlManager.$systemStatus
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                self?.updateSystemStatusCard(status)
            }
            .store(in: &cancellables)
    }

    private func configureNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    // MARK: - Actions

    @objc private func startAnalysisTapped() {
        guard mlManager.isInitialized && mlManager.mlModelsLoaded else {
            showAlert(title: "System Not Ready", message: "Please wait for the system to initialize completely.")
            return
        }

        Task {
            let result = await mlManager.performEnhancedAnalysis()

            await MainActor.run {
                switch result {
                case .success(let analysisResult):
                    displayAnalysisResults(analysisResult)
                case .failure(let error):
                    showAnalysisError(error)
                }
            }
        }
    }

    @objc private func applicationDidBecomeActive() {
        updateSystemStatus()
    }

    // MARK: - UI Updates

    private func updateSystemStatus() {
        systemStatusCard.updateStatus(
            mlReady: mlManager.mlModelsLoaded,
            sensorsReady: mlManager.isInitialized,
            systemStatus: mlManager.systemStatus
        )
    }

    private func updateSystemStatusCard(_ status: MLSystemStatus) {
        systemStatusCard.updateSystemStatus(status)
    }

    private func updateAnalysisButton() {
        let isReady = mlManager.isInitialized && mlManager.mlModelsLoaded
        analysisButton.isEnabled = isReady && !mlManager.analysisInProgress
        analysisButton.backgroundColor = isReady ? .systemBlue : .systemGray

        let title = mlManager.analysisInProgress ? "Analyzing..." : "Start Enhanced Analysis"
        analysisButton.setTitle(title, for: .normal)
    }

    private func updateAnalysisUI(inProgress: Bool) {
        progressView.isHidden = !inProgress
        progressLabel.isHidden = !inProgress

        if inProgress {
            startProgressAnimation()
        } else {
            progressView.progress = 0
        }

        updateAnalysisButton()
    }

    private func startProgressAnimation() {
        progressView.progress = 0

        // Simulate progress updates
        let progressSteps: [(delay: Double, progress: Float, message: String)] = [
            (0.5, 0.2, "Collecting sensor data..."),
            (1.0, 0.4, "Running ML analysis..."),
            (1.5, 0.7, "Fusing sensor data..."),
            (2.0, 0.9, "Generating insights..."),
            (2.5, 1.0, "Analysis complete!")
        ]

        for step in progressSteps {
            DispatchQueue.main.asyncAfter(deadline: .now() + step.delay) { [weak self] in
                UIView.animate(withDuration: 0.3) {
                    self?.progressView.progress = step.progress
                }
                self?.progressLabel.text = step.message
            }
        }
    }

    private func displayAnalysisResults(_ result: EnhancedAnalysisResult) {
        // Create SwiftUI view for results
        let resultsView = EnhancedAnalysisResultsView(result: result)

        // Remove existing hosting controller if any
        resultsHostingController?.view.removeFromSuperview()
        resultsHostingController?.removeFromParent()

        // Create new hosting controller
        let hostingController = UIHostingController(rootView: resultsView)
        resultsHostingController = hostingController

        // Add to view hierarchy
        addChild(hostingController)
        resultsContainerView.addSubview(hostingController.view)
        hostingController.didMove(toParent: self)

        // Setup constraints
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: resultsContainerView.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: resultsContainerView.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: resultsContainerView.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: resultsContainerView.bottomAnchor)
        ])

        // Show results container
        resultsContainerView.isHidden = false

        // Update layout
        view.layoutIfNeeded()
    }

    private func showAnalysisError(_ error: AnalysisError) {
        let message: String
        switch error {
        case .systemNotReady:
            message = "System is not ready for analysis. Please wait for initialization to complete."
        case .analysisInProgress:
            message = "Analysis is already in progress. Please wait for it to complete."
        case .noLiDARData:
            message = "No LiDAR data available. Please ensure LiDAR session is active."
        case .motionUnavailable:
            message = "Motion sensors are not available on this device."
        case .noMotionData:
            message = "Unable to collect motion data. Please try again."
        case .sensorFusionUnavailable:
            message = "Sensor fusion is not available. Please check system configuration."
        case .processingFailed(let details):
            message = "Analysis failed: \(details)"
        }

        showAlert(title: "Analysis Error", message: message)
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - System Status Card View

class SystemStatusCardView: UIView {

    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.text = "⚙️ System Status"
        label.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        label.textColor = .label
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private lazy var stackView: UIStackView = {
        let stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.distribution = .fillEqually
        stackView.spacing = 16
        stackView.translatesAutoresizingMaskIntoConstraints = false
        return stackView
    }()

    private lazy var mlStatusView = StatusItemView(title: "ML Models", status: "Loading")
    private lazy var sensorStatusView = StatusItemView(title: "Sensors", status: "Init")
    private lazy var systemOverallView = StatusItemView(title: "System", status: "Starting")

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }

    private func setupUI() {
        backgroundColor = .secondarySystemBackground
        layer.cornerRadius = 12

        addSubview(titleLabel)
        addSubview(stackView)

        stackView.addArrangedSubview(mlStatusView)
        stackView.addArrangedSubview(sensorStatusView)
        stackView.addArrangedSubview(systemOverallView)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),

            stackView.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16),
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            stackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            stackView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -12)
        ])
    }

    func updateStatus(mlReady: Bool, sensorsReady: Bool, systemStatus: MLSystemStatus) {
        let mlStatus = mlReady ? "✅ Ready" : "⏳ Loading"
        let sensorStatus = sensorsReady ? "✅ Ready" : "⏳ Init"

        let overallStatus: String
        switch systemStatus {
        case .initializing:
            overallStatus = "⏳ Starting"
        case .loadingModels:
            overallStatus = "📦 Loading"
        case .ready:
            overallStatus = "✅ Ready"
        case .error:
            overallStatus = "❌ Error"
        }

        mlStatusView.updateStatus(mlStatus)
        sensorStatusView.updateStatus(sensorStatus)
        systemOverallView.updateStatus(overallStatus)
    }

    func updateSystemStatus(_ status: MLSystemStatus) {
        let statusText: String
        switch status {
        case .initializing:
            statusText = "⏳ Starting"
        case .loadingModels:
            statusText = "📦 Loading"
        case .ready:
            statusText = "✅ Ready"
        case .error(let message):
            statusText = "❌ Error"
            // Could show error details in a separate UI element
            print("System error: \(message)")
        }

        systemOverallView.updateStatus(statusText)
    }
}

// MARK: - Status Item View

class StatusItemView: UIView {

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let statusLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 14, weight: .semibold)
        label.textColor = .label
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    init(title: String, status: String) {
        super.init(frame: .zero)
        titleLabel.text = title
        statusLabel.text = status
        setupUI()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }

    private func setupUI() {
        addSubview(titleLabel)
        addSubview(statusLabel)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor),

            statusLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
            statusLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            statusLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            statusLabel.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }

    func updateStatus(_ status: String) {
        statusLabel.text = status
    }
}

// MARK: - SwiftUI Results View

struct EnhancedAnalysisResultsView: View {
    let result: EnhancedAnalysisResult

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text("📊 Analysis Results")
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
                Text("\(Int(result.metadata.analysisQuality))%")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.green)
            }
            .padding(.horizontal)
            .padding(.top)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    // ML Predictions Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🧠 ML Predictions")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        MLPredictionCard(
                            title: "Gait Pattern",
                            value: result.mlPredictions.gaitPattern.classification.capitalized,
                            confidence: result.mlPredictions.gaitPattern.confidence,
                            riskScore: result.mlPredictions.gaitPattern.riskScore
                        )

                        MLPredictionCard(
                            title: "Fall Risk",
                            value: result.mlPredictions.fallRisk.level.capitalized,
                            confidence: result.mlPredictions.fallRisk.probability,
                            riskScore: result.mlPredictions.fallRisk.timeToRisk
                        )

                        MLPredictionCard(
                            title: "Posture",
                            value: result.mlPredictions.postureAssessment.alignment.capitalized,
                            confidence: 0.9, // Placeholder
                            riskScore: 0 // Not applicable for posture
                        )
                    }
                    .padding(.horizontal)

                    Divider()

                    // Sensor Fusion Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📡 Sensor Fusion")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        SensorMetricRow(
                            label: "Stability",
                            value: result.sensorFusion.combinedStability,
                            unit: "%"
                        )

                        SensorMetricRow(
                            label: "Coordination",
                            value: result.sensorFusion.coordinationScore,
                            unit: "%"
                        )

                        SensorMetricRow(
                            label: "Symmetry",
                            value: result.sensorFusion.symmetryIndex,
                            unit: "%"
                        )

                        SensorMetricRow(
                            label: "Fluidity",
                            value: result.sensorFusion.fluidityRating,
                            unit: "%"
                        )
                    }
                    .padding(.horizontal)

                    Divider()

                    // Insights Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("💡 Insights")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        if !result.insights.primaryConcerns.isEmpty {
                            InsightSection(
                                title: "Primary Concerns",
                                items: result.insights.primaryConcerns,
                                icon: "⚠️"
                            )
                        }

                        if !result.insights.improvementAreas.isEmpty {
                            InsightSection(
                                title: "Improvement Areas",
                                items: result.insights.improvementAreas,
                                icon: "▶️"
                            )
                        }

                        if !result.insights.personalizationTips.isEmpty {
                            InsightSection(
                                title: "Personalization Tips",
                                items: result.insights.personalizationTips,
                                icon: "💡"
                            )
                        }

                        if !result.insights.nextSteps.isEmpty {
                            InsightSection(
                                title: "Next Steps",
                                items: result.insights.nextSteps,
                                icon: "📋"
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.bottom)
        }
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct MLPredictionCard: View {
    let title: String
    let value: String
    let confidence: Double
    let riskScore: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack {
                Text(value)
                    .font(.body)
                    .fontWeight(.medium)

                Spacer()

                Text("\(Int(confidence * 100))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if riskScore > 0 {
                Text("Risk: \(Int(riskScore))")
                    .font(.caption2)
                    .foregroundColor(.orange)
            }
        }
        .padding(8)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(8)
    }
}

struct SensorMetricRow: View {
    let label: String
    let value: Double
    let unit: String

    var body: some View {
        HStack {
            Text(label)
                .font(.body)

            Spacer()

            Text("\(Int(value))\(unit)")
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(colorForValue(value))
        }
        .padding(.vertical, 2)
    }

    private func colorForValue(_ value: Double) -> Color {
        if value >= 80 {
            return .green
        } else if value >= 60 {
            return .orange
        } else {
            return .red
        }
    }
}

struct InsightSection: View {
    let title: String
    let items: [String]
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)

            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Text(icon)
                        .font(.caption)

                    Text(item)
                        .font(.caption)
                        .multilineTextAlignment(.leading)

                    Spacer()
                }
            }
        }
        .padding(8)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(8)
    }
}
