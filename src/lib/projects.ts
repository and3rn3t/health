/**
 * Projects and AOI (Area of Interest) workflows
 * Manage projects, AOIs, analysis runs, and history
 */

export interface AOI {
  id: string
  projectId: string
  name: string
  description?: string
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface AnalysisRun {
  id: string
  projectId: string
  aoiId?: string
  analysisType: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  metadata?: Record<string, any>
}

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  organizationId?: string
  aois: AOI[]
  analysisRuns: AnalysisRun[]
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

/**
 * Simple in-memory project store (in production, use database)
 */
class ProjectStore {
  private projects: Map<string, Project> = new Map()
  private aois: Map<string, AOI> = new Map()
  private runs: Map<string, AnalysisRun> = new Map()

  createProject(project: Omit<Project, 'createdAt' | 'updatedAt' | 'aois' | 'analysisRuns'>): Project {
    const now = new Date().toISOString()
    const fullProject: Project = {
      ...project,
      aois: [],
      analysisRuns: [],
      createdAt: now,
      updatedAt: now,
    }
    this.projects.set(project.id, fullProject)
    return fullProject
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id)
  }

  listProjects(ownerId?: string, organizationId?: string): Project[] {
    let projects = Array.from(this.projects.values())
    if (ownerId) {
      projects = projects.filter((p) => p.ownerId === ownerId)
    }
    if (organizationId) {
      projects = projects.filter((p) => p.organizationId === organizationId)
    }
    return projects
  }

  addAOI(projectId: string, aoi: Omit<AOI, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): AOI {
    const project = this.projects.get(projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    const id = `aoi-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`
    const now = new Date().toISOString()
    const fullAOI: AOI = {
      ...aoi,
      id,
      projectId,
      createdAt: now,
      updatedAt: now,
    }

    this.aois.set(id, fullAOI)
    project.aois.push(fullAOI)
    project.updatedAt = now
    return fullAOI
  }

  getAOI(id: string): AOI | undefined {
    return this.aois.get(id)
  }

  listAOIs(projectId: string): AOI[] {
    const project = this.projects.get(projectId)
    return project?.aois || []
  }

  createAnalysisRun(
    projectId: string,
    run: Omit<AnalysisRun, 'id' | 'projectId' | 'status' | 'createdAt'>
  ): AnalysisRun {
    const project = this.projects.get(projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    const id = `run-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`
    const now = new Date().toISOString()
    const fullRun: AnalysisRun = {
      ...run,
      id,
      projectId,
      status: 'pending',
      createdAt: now,
    }

    this.runs.set(id, fullRun)
    project.analysisRuns.push(fullRun)
    project.updatedAt = now
    return fullRun
  }

  getAnalysisRun(id: string): AnalysisRun | undefined {
    return this.runs.get(id)
  }

  listAnalysisRuns(projectId: string, aoiId?: string, status?: AnalysisRun['status']): AnalysisRun[] {
    const project = this.projects.get(projectId)
    if (!project) return []

    let runs = project.analysisRuns
    if (aoiId) {
      runs = runs.filter((r) => r.aoiId === aoiId)
    }
    if (status) {
      runs = runs.filter((r) => r.status === status)
    }
    return runs
  }

  updateAnalysisRunStatus(
    id: string,
    status: AnalysisRun['status'],
    output?: Record<string, any>,
    error?: string
  ): AnalysisRun {
    const run = this.runs.get(id)
    if (!run) {
      throw new Error(`Analysis run ${id} not found`)
    }

    run.status = status
    if (status === 'running' && !run.startedAt) {
      run.startedAt = new Date().toISOString()
    }
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      run.completedAt = new Date().toISOString()
      if (output) run.output = output
      if (error) run.error = error
    }

    // Update project timestamp
    const project = this.projects.get(run.projectId)
    if (project) {
      project.updatedAt = new Date().toISOString()
    }

    return run
  }
}

export const projectStore = new ProjectStore()

/**
 * Calculate bounding box from geometry
 */
export function calculateBBoxFromGeometry(geometry: AOI['geometry']): AOI['bbox'] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  function processCoordinates(coords: number[] | number[][] | number[][][] | number[][][][]) {
    if (Array.isArray(coords)) {
      if (coords.length > 0 && typeof coords[0] === 'number') {
        // Point: [x, y]
        const [x, y] = coords as number[]
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      } else if (Array.isArray(coords)) {
        // Nested arrays - recursively process
        coords.forEach((coord: number | number[] | number[][] | number[][][]) => {
          if (typeof coord === 'number') {
            // Single number in array
            maxX = Math.max(maxX, coord);
            maxY = Math.max(maxY, coord);
          } else if (Array.isArray(coord)) {
            // Recursively process nested arrays
            processCoordinates(coord as number[] | number[][] | number[][][]);
          }
        });
      }
    }
  }

  processCoordinates(geometry.coordinates)
  return { minX, minY, maxX, maxY }
}
