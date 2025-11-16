/**
 * Model registry and versioned serving
 * Basic structure for managing ML models
 */

export interface ModelVersion {
  version: string
  modelId: string
  modelType: 'segmentation' | 'classification' | 'detection' | 'regression'
  status: 'active' | 'deprecated' | 'archived'
  createdAt: string
  metadata: {
    framework?: string
    architecture?: string
    inputShape?: number[]
    outputClasses?: string[]
    metrics?: Record<string, number>
  }
  endpoint?: string
}

export interface Model {
  id: string
  name: string
  description: string
  type: 'segmentation' | 'classification' | 'detection' | 'regression'
  versions: ModelVersion[]
  defaultVersion?: string
  createdAt: string
  updatedAt: string
}

/**
 * Simple in-memory model registry (in production, use database)
 */
class ModelRegistry {
  private models: Map<string, Model> = new Map()

  registerModel(model: Omit<Model, 'createdAt' | 'updatedAt'>): Model {
    const now = new Date().toISOString()
    const fullModel: Model = {
      ...model,
      createdAt: now,
      updatedAt: now,
    }
    this.models.set(model.id, fullModel)
    return fullModel
  }

  getModel(id: string): Model | undefined {
    return this.models.get(id)
  }

  listModels(): Model[] {
    return Array.from(this.models.values())
  }

  addVersion(modelId: string, version: Omit<ModelVersion, 'modelId'>): ModelVersion {
    const model = this.models.get(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    const fullVersion: ModelVersion = {
      ...version,
      modelId,
    }

    model.versions.push(fullVersion)
    model.updatedAt = new Date().toISOString()

    if (!model.defaultVersion) {
      model.defaultVersion = version.version
    }

    return fullVersion
  }

  getVersion(modelId: string, version?: string): ModelVersion | undefined {
    const model = this.models.get(modelId)
    if (!model) return undefined

    const versionToGet = version || model.defaultVersion
    return model.versions.find((v) => v.version === versionToGet)
  }

  setDefaultVersion(modelId: string, version: string): void {
    const model = this.models.get(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    const versionExists = model.versions.some((v) => v.version === version)
    if (!versionExists) {
      throw new Error(`Version ${version} not found for model ${modelId}`)
    }

    model.defaultVersion = version
    model.updatedAt = new Date().toISOString()
  }
}

export const modelRegistry = new ModelRegistry()
