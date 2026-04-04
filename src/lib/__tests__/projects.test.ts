import { describe, test, expect } from 'vitest'
import { projectStore, calculateBBoxFromGeometry } from '../projects'

describe('Projects and AOI Workflows', () => {
  test('creates and retrieves project', () => {
    const project = projectStore.createProject({
      id: 'test-project-1',
      name: 'Test Project',
      ownerId: 'user-1',
      description: 'Test description',
    })

    expect(project.id).toBe('test-project-1')
    expect(project.name).toBe('Test Project')
    expect(project.aois).toHaveLength(0)
    expect(project.analysisRuns).toHaveLength(0)
    expect(project.createdAt).toBeDefined()

    const retrieved = projectStore.getProject('test-project-1')
    expect(retrieved).toEqual(project)
  })

  test('lists projects with filters', () => {
    projectStore.createProject({
      id: 'project-owner1',
      name: 'Project 1',
      ownerId: 'user-1',
    })
    projectStore.createProject({
      id: 'project-owner2',
      name: 'Project 2',
      ownerId: 'user-2',
    })

    const user1Projects = projectStore.listProjects('user-1')
    expect(user1Projects.length).toBeGreaterThanOrEqual(1)
    expect(user1Projects.every((p) => p.ownerId === 'user-1')).toBe(true)
  })

  test('adds AOI to project', () => {
    const project = projectStore.createProject({
      id: 'project-aoi-test',
      name: 'AOI Test Project',
      ownerId: 'user-1',
    })

    const aoi = projectStore.addAOI(project.id, {
      name: 'Test AOI',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.5, 37.7],
            [-122.4, 37.7],
            [-122.4, 37.8],
            [-122.5, 37.8],
            [-122.5, 37.7],
          ],
        ],
      },
      bbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
    })

    expect(aoi.id).toBeDefined()
    expect(aoi.projectId).toBe(project.id)
    expect(aoi.name).toBe('Test AOI')
    expect(project.aois).toHaveLength(1)
    expect(project.aois[0].id).toBe(aoi.id)
  })

  test('creates analysis run', () => {
    const project = projectStore.createProject({
      id: 'project-run-test',
      name: 'Run Test Project',
      ownerId: 'user-1',
    })

    const run = projectStore.createAnalysisRun(project.id, {
      analysisType: 'ndvi',
      input: { nir: [0.5, 0.6], red: [0.3, 0.4] },
    })

    expect(run.id).toBeDefined()
    expect(run.projectId).toBe(project.id)
    expect(run.status).toBe('pending')
    expect(run.analysisType).toBe('ndvi')
    expect(project.analysisRuns).toHaveLength(1)
  })

  test('updates analysis run status', () => {
    const project = projectStore.createProject({
      id: 'project-status-test',
      name: 'Status Test',
      ownerId: 'user-1',
    })

    const run = projectStore.createAnalysisRun(project.id, {
      analysisType: 'ndvi',
      input: {},
    })

    const updated = projectStore.updateAnalysisRunStatus(
      run.id,
      'completed',
      { result: 'success' }
    )

    expect(updated.status).toBe('completed')
    expect(updated.output).toEqual({ result: 'success' })
    expect(updated.completedAt).toBeDefined()
  })

  test('lists analysis runs with filters', () => {
    const project = projectStore.createProject({
      id: 'project-filter-test',
      name: 'Filter Test',
      ownerId: 'user-1',
    })

    const aoi = projectStore.addAOI(project.id, {
      name: 'Test AOI',
      geometry: {
        type: 'Polygon',
        coordinates: [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]],
      },
      bbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
    })

    const run1 = projectStore.createAnalysisRun(project.id, {
      analysisType: 'ndvi',
      aoiId: aoi.id,
      input: {},
    })

    projectStore.updateAnalysisRunStatus(run1.id, 'completed')

    const completedRuns = projectStore.listAnalysisRuns(project.id, undefined, 'completed')
    expect(completedRuns.length).toBeGreaterThanOrEqual(1)
    expect(completedRuns.every((r) => r.status === 'completed')).toBe(true)
  })

  test('calculates bbox from geometry', () => {
    const geometry = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [-122.5, 37.7],
          [-122.4, 37.7],
          [-122.4, 37.8],
          [-122.5, 37.8],
          [-122.5, 37.7],
        ],
      ],
    }

    const bbox = calculateBBoxFromGeometry(geometry)
    expect(bbox.minX).toBe(-122.5)
    expect(bbox.maxX).toBe(-122.4)
    expect(bbox.minY).toBe(37.7)
    expect(bbox.maxY).toBe(37.8)
  })

  test('throws error when adding AOI to non-existent project', () => {
    expect(() => {
      projectStore.addAOI('non-existent', {
        name: 'Test',
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]],
        },
        bbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
      })
    }).toThrow('not found')
  })
})
