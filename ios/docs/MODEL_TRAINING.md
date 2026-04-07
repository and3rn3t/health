# CoreML Model Training Guide

This document covers how to generate training data, train, and integrate the five CoreML models used by Andernet Posture.

## Models Overview

| Model | Type | Task | Training Samples |
|---|---|---|---|
| `GaitPatternClassifier` | Boosted Tree Classifier | Classify gait pattern into 8 categories | 10,000 |
| `PostureScorer` | Boosted Tree Regressor | Predict composite posture score (0–100) | 10,000 |
| `FallRiskPredictor` | Boosted Tree Regressor | Predict fall risk score from gait metrics | 10,000 |
| `CrossedSyndromeDetector` | Boosted Tree Regressor | Score upper/lower crossed syndrome severity | 10,000 |
| `FatiguePredictor` | Boosted Tree Regressor | Predict fatigue score from movement data | 5,000 |

All models use `MLBoostedTreeClassifier` or `MLBoostedTreeRegressor` from Apple's **CreateML** framework with `maxDepth: 6` and `maxIterations: 500`.

## Prerequisites

- **macOS** with Xcode installed (CreateML requires macOS)
- **Swift 5.9+** (ships with Xcode 15+)
- No additional dependencies — training scripts use only Foundation + CreateML

## Directory Structure

```
ios/Andernet-Posture/MLTraining/
├── generate_training_data.swift   # Synthetic data generator
├── train_models.swift             # Model trainer
├── Data/                          # Generated JSON training sets
│   ├── GaitPatternClassifier_training.json
│   ├── PostureScorer_training.json
│   ├── FallRiskPredictor_training.json
│   ├── CrossedSyndromeDetector_training.json
│   └── FatiguePredictor_training.json
└── Models/                        # Trained .mlmodel outputs (git-ignored)
```

## Step 1: Generate Training Data

The generator uses **knowledge distillation** — it replicates the exact scoring logic from the app's rule-based analyzers (`DefaultGaitAnalyzer`, `DefaultPostureAnalyzer`, etc.) to produce labeled synthetic samples.

```bash
cd ios/Andernet-Posture
swift MLTraining/generate_training_data.swift
```

This produces five JSON files in `MLTraining/Data/`. The generator uses a **seeded RNG** (`seed: 42`) for deterministic, reproducible datasets.

## Step 2: Train Models

```bash
swift MLTraining/train_models.swift
```

Output appears in `MLTraining/Models/`:
- `GaitPatternClassifier.mlmodel`
- `PostureScorer.mlmodel`
- `FallRiskPredictor.mlmodel`
- `CrossedSyndromeDetector.mlmodel`
- `FatiguePredictor.mlmodel`

Each model prints training and validation metrics (accuracy for classifiers, RMSE for regressors).

## Step 3: Integrate into Xcode

1. Drag each `.mlmodel` file into the Xcode project under the **Andernet Posture** target.
2. Xcode automatically compiles `.mlmodel` → `.mlmodelc` at build time.
3. The app's `CoreMLService` loads models lazily at runtime.

## Alternative: Create ML App

The JSON training files are compatible with Apple's **Create ML** app:

1. Open Create ML → New Document → Tabular Regressor/Classifier
2. Drag the corresponding `_training.json` file as training data
3. Set the target column (e.g., `label`, `compositeScore`, `riskScore`)
4. Train, evaluate, export `.mlmodel`

## Retraining

Retrain models when:
- Scoring thresholds in `AppConfig.swift` change (sync with `sync-gait-config.js` / `sync-fall-risk-config.js`)
- New features are added to the rule-based analyzers
- Real-world clinical feedback indicates scoring drift

After retraining, verify that the web and iOS configs are in sync — see the `sync-health-config` skill for the synchronization workflow.

## Feature Columns Reference

### GaitPatternClassifier (14 features → 8 classes)
`stanceTimeLeftPct`, `stanceTimeRightPct`, `stepLengthLeftM`, `stepLengthRightM`, `cadenceSPM`, `stepWidthCm`, `stepWidthVariabilityCm`, `pelvicObliquityDeg`, `strideTimeCVPercent`, `walkingSpeedMPS`, `strideLengthM`, `hipFlexionROMDeg`, `armSwingAsymmetryPct`, `kneeFlexionROMDeg`

### PostureScorer (9 features → composite score)
`f_cva`, `f_sva`, `f_trunkLean`, `f_lateralLean`, `f_shoulderAsym`, `f_kyphosis`, `f_pelvicObliq`, `f_lordosis`, `f_coronalDev`

### FallRiskPredictor (8 features → risk score)
`walkingSpeedMPS`, `strideTimeCVPercent`, `doubleSupportPercent`, `stepWidthVariabilityCm`, `swayVelocityMMS`, `stepAsymmetryPercent`, `tugTimeSec`, `footClearanceM`

### CrossedSyndromeDetector (7 features → upper/lower scores)
`craniovertebralAngleDeg`, `shoulderProtractionCm`, `thoracicKyphosisDeg`, `cervicalLordosisDeg`, `pelvicTiltDeg`, `lumbarLordosisDeg`, `hipFlexionRestDeg`

### FatiguePredictor (features vary — see training script)
Includes cadence variability, stride length changes, and movement pattern degradation metrics.
