import SwiftUI
import HealthKit

// MARK: - Enhanced Walking Quality Calculator
class WalkingQualityCalculator: ObservableObject {
    @Published var walkingQualityScore: Double = 0.0
    @Published var qualityTrend: TrendDirection = .stable
    @Published var improvements: [WalkingImprovement] = []

    func calculateComprehensiveScore(from gaitMetrics: GaitMetrics) -> WalkingQualityScore {
        var totalScore = 0.0
        var components: [ScoreComponent] = []

        // Walking Speed Component (25 points)
        if let speed = gaitMetrics.averageWalkingSpeed {
            let speedScore = calculateSpeedScore(speed)
            totalScore += speedScore
            components.append(ScoreComponent(
                name: "Walking Speed",
                score: speedScore,
                maxScore: 25.0,
                description: getSpeedDescription(speed),
                recommendation: getSpeedRecommendation(speed)
            ))
        }

        // Gait Symmetry Component (25 points)
        if let asymmetry = gaitMetrics.walkingAsymmetry {
            let symmetryScore = calculateSymmetryScore(asymmetry)
            totalScore += symmetryScore
            components.append(ScoreComponent(
                name: "Gait Symmetry",
                score: symmetryScore,
                maxScore: 25.0,
                description: getSymmetryDescription(asymmetry),
                recommendation: getSymmetryRecommendation(asymmetry)
            ))
        }

        // Stability Component (25 points)
        if let doubleSupportTime = gaitMetrics.doubleSupportTime {
            let stabilityScore = calculateStabilityScore(doubleSupportTime)
            totalScore += stabilityScore
            components.append(ScoreComponent(
                name: "Walking Stability",
                score: stabilityScore,
                maxScore: 25.0,
                description: getStabilityDescription(doubleSupportTime),
                recommendation: getStabilityRecommendation(doubleSupportTime)
            ))
        }

        // Step Length Component (25 points)
        if let stepLength = gaitMetrics.averageStepLength {
            let stepScore = calculateStepLengthScore(stepLength)
            totalScore += stepScore
            components.append(ScoreComponent(
                name: "Step Length",
                score: stepScore,
                maxScore: 25.0,
                description: getStepLengthDescription(stepLength),
                recommendation: getStepLengthRecommendation(stepLength)
            ))
        }

        let qualityLevel = determineQualityLevel(totalScore)

        return WalkingQualityScore(
            overallScore: totalScore,
            qualityLevel: qualityLevel,
            components: components,
            improvements: generateImprovements(from: components),
            lastCalculated: Date()
        )
    }

    // MARK: - Component Calculators

    private func calculateSpeedScore(_ speed: Double) -> Double {
        // Optimal walking speed: 1.2-1.4 m/s
        // Acceptable: 1.0-1.2 m/s
        // Concerning: 0.8-1.0 m/s
        // Poor: < 0.8 m/s

        if speed >= 1.2 {
            return 25.0
        } else if speed >= 1.0 {
            return 20.0 + (speed - 1.0) * 25.0 // 20-25 points
        } else if speed >= 0.8 {
            return 10.0 + (speed - 0.8) * 50.0 // 10-20 points
        } else {
            return max(0, speed * 12.5) // 0-10 points
        }
    }

    private func calculateSymmetryScore(_ asymmetry: Double) -> Double {
        // Lower asymmetry is better
        // Excellent: < 3%
        // Good: 3-5%
        // Fair: 5-8%
        // Poor: > 8%

        let asymmetryPercent = asymmetry * 100

        if asymmetryPercent <= 3.0 {
            return 25.0
        } else if asymmetryPercent <= 5.0 {
            return 20.0 - (asymmetryPercent - 3.0) * 2.5 // 15-20 points
        } else if asymmetryPercent <= 8.0 {
            return 15.0 - (asymmetryPercent - 5.0) * 3.33 // 5-15 points
        } else {
            return max(0, 15.0 - (asymmetryPercent - 8.0) * 1.25)
        }
    }

    private func calculateStabilityScore(_ doubleSupportTime: Double) -> Double {
        // Optimal double support: 20-24% of gait cycle
        // Acceptable: 24-28%
        // Concerning: 28-35%
        // Poor: > 35%

        let percentage = doubleSupportTime * 100

        if percentage >= 20 && percentage <= 24 {
            return 25.0
        } else if percentage >= 24 && percentage <= 28 {
            return 20.0 - (percentage - 24) * 1.25 // 15-20 points
        } else if percentage >= 28 && percentage <= 35 {
            return 15.0 - (percentage - 28) * 1.43 // 5-15 points
        } else {
            return max(0, 15.0 - abs(percentage - 22) * 0.5)
        }
    }

    private func calculateStepLengthScore(_ stepLength: Double) -> Double {
        // Optimal step length: 65-75 cm
        // Acceptable: 55-65 cm or 75-85 cm
        // Concerning: 45-55 cm or 85-95 cm
        // Poor: < 45 cm or > 95 cm

        let lengthCm = stepLength * 100

        if lengthCm >= 65 && lengthCm <= 75 {
            return 25.0
        } else if (lengthCm >= 55 && lengthCm < 65) || (lengthCm > 75 && lengthCm <= 85) {
            return 20.0
        } else if (lengthCm >= 45 && lengthCm < 55) || (lengthCm > 85 && lengthCm <= 95) {
            return 10.0
        } else {
            return 5.0
        }
    }

    // MARK: - Description Generators

    private func getSpeedDescription(_ speed: Double) -> String {
        if speed >= 1.2 {
            return "Excellent walking speed indicates strong mobility"
        } else if speed >= 1.0 {
            return "Good walking speed with room for improvement"
        } else if speed >= 0.8 {
            return "Walking speed below optimal range"
        } else {
            return "Significantly reduced walking speed detected"
        }
    }

    private func getSpeedRecommendation(_ speed: Double) -> String {
        if speed >= 1.2 {
            return "Maintain your excellent walking pace through regular activity"
        } else if speed >= 1.0 {
            return "Try interval walking: alternate normal and brisk pace"
        } else if speed >= 0.8 {
            return "Focus on gradual speed increases during daily walks"
        } else {
            return "Consider consulting a physical therapist for mobility assessment"
        }
    }

    private func generateImprovements(from components: [ScoreComponent]) -> [WalkingImprovement] {
        var improvements: [WalkingImprovement] = []

        for component in components {
            if component.score < component.maxScore * 0.8 { // Less than 80% of max
                let improvement = WalkingImprovement(
                    area: component.name,
                    currentScore: component.score,
                    targetScore: component.maxScore * 0.9,
                    exercises: getExercisesFor(component.name),
                    timeframe: "2-4 weeks"
                )
                improvements.append(improvement)
            }
        }

        return improvements
    }

    private func getExercisesFor(_ area: String) -> [Exercise] {
        switch area {
        case "Walking Speed":
            return [
                Exercise(name: "Interval Walking", description: "Alternate 2 minutes normal pace, 1 minute brisk pace"),
                Exercise(name: "Incline Walking", description: "Walk on slight inclines to build strength"),
                Exercise(name: "Step Ups", description: "Step up onto curb or step 10-15 times")
            ]
        case "Gait Symmetry":
            return [
                Exercise(name: "Single Leg Stands", description: "Stand on one leg for 30 seconds, repeat both sides"),
                Exercise(name: "Heel-to-Toe Walking", description: "Walk in straight line placing heel directly in front of toe"),
                Exercise(name: "Side Steps", description: "Step sideways maintaining good posture")
            ]
        case "Walking Stability":
            return [
                Exercise(name: "Balance Board", description: "Stand on unstable surface for 1-2 minutes"),
                Exercise(name: "Tai Chi Movements", description: "Slow, controlled movements for balance"),
                Exercise(name: "Core Strengthening", description: "Planks and modified crunches")
            ]
        case "Step Length":
            return [
                Exercise(name: "Walking Lunges", description: "Take larger steps with good form"),
                Exercise(name: "Hip Flexor Stretches", description: "Improve hip mobility for longer steps"),
                Exercise(name: "Stride Length Practice", description: "Consciously take longer steps during walks")
            ]
        default:
            return []
        }
    }
}

// MARK: - Supporting Models

struct WalkingQualityScore {
    let overallScore: Double
    let qualityLevel: WalkingQualityLevel
    let components: [ScoreComponent]
    let improvements: [WalkingImprovement]
    let lastCalculated: Date
}

struct ScoreComponent {
    let name: String
    let score: Double
    let maxScore: Double
    let description: String
    let recommendation: String

    var percentage: Double {
        return (score / maxScore) * 100
    }
}

struct WalkingImprovement {
    let area: String
    let currentScore: Double
    let targetScore: Double
    let exercises: [Exercise]
    let timeframe: String
}

struct Exercise {
    let name: String
    let description: String
}

enum WalkingQualityLevel: String, CaseIterable {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case critical = "Critical"

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .orange
        case .critical: return .red
        }
    }

    var description: String {
        switch self {
        case .excellent: return "Outstanding walking quality with optimal gait patterns"
        case .good: return "Good walking quality with minor areas for improvement"
        case .fair: return "Acceptable walking quality with some concerns"
        case .poor: return "Walking quality needs attention and improvement"
        case .critical: return "Significant walking quality issues requiring intervention"
        }
    }
}

enum TrendDirection: String, Codable, CaseIterable {
    case improving = "improving"
    case stable = "stable"
    case declining = "declining"
}

private func determineQualityLevel(_ score: Double) -> WalkingQualityLevel {
    if score >= 85 {
        return .excellent
    } else if score >= 70 {
        return .good
    } else if score >= 55 {
        return .fair
    } else if score >= 40 {
        return .poor
    } else {
        return .critical
    }
}
