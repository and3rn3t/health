/**
 * Explainability and uncertainty utilities
 * Confidence maps, feature importance, uncertainty visualization
 */

export interface UncertaintyMap {
  values: number[]
  confidence: number[]
  uncertainty: number[]
  metadata: {
    minConfidence: number
    maxConfidence: number
    meanConfidence: number
    minUncertainty: number
    maxUncertainty: number
    meanUncertainty: number
  }
}

export interface FeatureImportance {
  feature: string
  importance: number
  contribution: number[]
  relativeImportance: number
}

/**
 * Calculate uncertainty map from confidence values
 */
export function calculateUncertaintyMap(
  predictions: number[],
  confidence?: number[]
): UncertaintyMap {
  // If confidence not provided, estimate from prediction variance
  let conf: number[]
  if (confidence) {
    conf = confidence.map((c) => Math.max(0, Math.min(1, c)))
  } else {
    // Estimate confidence from prediction values (assuming normalized [0,1])
    // Values near 0.5 are less certain, values near 0 or 1 are more certain
    conf = predictions.map((p) => {
      const distFromCenter = Math.abs(p - 0.5)
      return distFromCenter * 2 // Convert to [0, 1] confidence
    })
  }

  // Uncertainty is inverse of confidence
  const uncertainty = conf.map((c) => 1 - c)

  const validConf = conf.filter(Number.isFinite)
  const validUnc = uncertainty.filter(Number.isFinite)

  return {
    values: predictions,
    confidence: conf,
    uncertainty,
    metadata: {
      minConfidence: validConf.length > 0 ? Math.min(...validConf) : 0,
      maxConfidence: validConf.length > 0 ? Math.max(...validConf) : 1,
      meanConfidence: validConf.length > 0 ? validConf.reduce((a, b) => a + b, 0) / validConf.length : 0.5,
      minUncertainty: validUnc.length > 0 ? Math.min(...validUnc) : 0,
      maxUncertainty: validUnc.length > 0 ? Math.max(...validUnc) : 1,
      meanUncertainty: validUnc.length > 0 ? validUnc.reduce((a, b) => a + b, 0) / validUnc.length : 0.5,
    },
  }
}

/**
 * Calculate feature importance from multiple feature contributions
 */
export function calculateFeatureImportance(
  features: Array<{ name: string; values: number[]; weights?: number[] }>
): FeatureImportance[] {
  if (features.length === 0) {
    return []
  }

  const length = features[0].values.length
  for (const f of features) {
    if (f.values.length !== length) {
      throw new Error(`All features must have same length. Feature "${f.name}" has length ${f.values.length}, expected ${length}`)
    }
  }

  // Calculate importance as weighted contribution
  const importances: FeatureImportance[] = features.map((feature) => {
    const weights = feature.weights || feature.values.map(() => 1)
    const weightedValues = feature.values.map((v, i) => (Number.isFinite(v) ? v * weights[i] : 0))
    const totalContribution = weightedValues.reduce((a, b) => a + Math.abs(b), 0)
    const meanContribution = totalContribution / length

    return {
      feature: feature.name,
      importance: meanContribution,
      contribution: weightedValues,
      relativeImportance: 0, // Will calculate after all features
    }
  })

  // Calculate relative importance (normalize to sum to 1)
  const totalImportance = importances.reduce((sum, f) => sum + f.importance, 0)
  if (totalImportance > 0) {
    importances.forEach((f) => {
      f.relativeImportance = f.importance / totalImportance
    })
  }

  // Sort by importance (descending)
  importances.sort((a, b) => b.importance - a.importance)

  return importances
}

/**
 * Generate SHAP-like feature attribution
 * Simplified version that shows how each feature contributes to the final score
 */
export function calculateFeatureAttribution(
  baseScore: number,
  features: Array<{ name: string; value: number; weight: number }>
): Array<{ feature: string; attribution: number; percentage: number }> {
  const totalWeight = features.reduce((sum, f) => sum + f.weight, 0)
  if (totalWeight === 0) {
    return features.map((f) => ({ feature: f.name, attribution: 0, percentage: 0 }))
  }

  const attributions = features.map((f) => {
    const normalizedValue = Math.max(0, Math.min(1, f.value))
    const contribution = (normalizedValue * f.weight) / totalWeight
    return {
      feature: f.name,
      attribution: contribution,
      percentage: 0, // Will calculate after
    }
  })

  const totalAttribution = attributions.reduce((sum, a) => sum + a.attribution, 0)
  if (totalAttribution > 0) {
    attributions.forEach((a) => {
      a.percentage = (a.attribution / totalAttribution) * 100
    })
  }

  return attributions.sort((a, b) => b.attribution - a.attribution)
}
