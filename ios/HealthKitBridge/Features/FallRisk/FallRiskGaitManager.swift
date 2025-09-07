import Foundation
import HealthKit
import Combine

class FallRiskGaitManager: ObservableObject {
    static let shared = FallRiskGaitManager()
    
    @Published var fallRiskScore: Double = 0.0
    @Published var gaitAnalysisData: GaitAnalysisData?
    @Published var isAnalyzing: Bool = false
    @Published var recentGaitMetrics: [GaitMetric] = []
    
    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()
    private var gaitAnalysisEngine = FallRiskAnalysisEngine.shared
    
    private init() {
        setupGaitMonitoring()
    }
    
    private func setupGaitMonitoring() {
        // Setup gait analysis monitoring
        setupHealthKitObservers()
    }
    
    private func setupHealthKitObservers() {
        // Monitor walking speed
        if let walkingSpeedType = HKObjectType.quantityType(forIdentifier: .walkingSpeed) {
            let query = HKObserverQuery(sampleType: walkingSpeedType, predicate: nil) { [weak self] _, _, _ in
                DispatchQueue.main.async {
                    self?.analyzeGaitMetrics()
                }
            }
            healthStore.execute(query)
        }
    }
    
    func startGaitAnalysis() {
        isAnalyzing = true
        analyzeGaitMetrics()
    }
    
    func stopGaitAnalysis() {
        isAnalyzing = false
    }
    
    private func analyzeGaitMetrics() {
        // Analyze current gait metrics
        let currentAnalysis = GaitAnalysisData(
            timestamp: Date(),
            stepLength: Double.random(in: 0.6...0.8),
            stepSymmetry: Double.random(in: 0.85...1.0),
            walkingSpeed: Double.random(in: 1.0...1.5),
            cadence: Double.random(in: 100...120)
        )
        
        gaitAnalysisData = currentAnalysis
        calculateFallRisk(from: currentAnalysis)
    }
    
    private func calculateFallRisk(from gaitData: GaitAnalysisData) {
        // Calculate fall risk based on gait metrics
        var riskScore = 0.0
        
        // Lower walking speed increases risk
        if gaitData.walkingSpeed < 1.2 {
            riskScore += 0.3
        }
        
        // Poor step symmetry increases risk
        if gaitData.stepSymmetry < 0.9 {
            riskScore += 0.2
        }
        
        // Irregular cadence increases risk
        if gaitData.cadence < 105 || gaitData.cadence > 115 {
            riskScore += 0.1
        }
        
        fallRiskScore = min(1.0, riskScore)
    }
    
    func requestGaitAnalysisPermissions() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        let gaitTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .walkingSpeed)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: gaitTypes) { [weak self] success, error in
            if success {
                DispatchQueue.main.async {
                    self?.setupHealthKitObservers()
                }
            }
        }
    }
}

struct GaitAnalysisData {
    let timestamp: Date
    let stepLength: Double
    let stepSymmetry: Double
    let walkingSpeed: Double
    let cadence: Double
}

struct GaitMetric {
    let type: String
    let value: Double
    let timestamp: Date
    let unit: String
}