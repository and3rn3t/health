import { describe, test, expect } from 'vitest'
import { scheduler, sendNotification } from '../scheduling'

describe('Scheduling', () => {
  test('creates schedule', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    expect(schedule.id).toBeDefined()
    expect(schedule.projectId).toBe('project-1')
    expect(schedule.scheduleType).toBe('daily')
    expect(schedule.enabled).toBe(true)
    expect(schedule.runCount).toBe(0)
    expect(schedule.nextRunAt).toBeDefined()
  })

  test('calculates next run time for daily schedule', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    expect(schedule.nextRunAt).toBeDefined()
    const nextRun = new Date(schedule.nextRunAt!)
    const now = new Date()
    expect(nextRun.getTime()).toBeGreaterThan(now.getTime())
  })

  test('lists schedules with filters', () => {
    scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })
    scheduler.createSchedule({
      projectId: 'project-2',
      analysisType: 'ndvi',
      scheduleType: 'weekly',
      enabled: false,
    })

    const project1Schedules = scheduler.listSchedules('project-1')
    expect(project1Schedules.every((s) => s.projectId === 'project-1')).toBe(true)

    const enabledSchedules = scheduler.listSchedules(undefined, true)
    expect(enabledSchedules.every((s) => s.enabled)).toBe(true)
  })

  test('creates scheduled job', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    const runAt = new Date().toISOString()
    const job = scheduler.createJob(schedule.id, runAt)

    expect(job.id).toBeDefined()
    expect(job.scheduleId).toBe(schedule.id)
    expect(job.status).toBe('pending')
    expect(job.runAt).toBe(runAt)
    expect(schedule.runCount).toBe(1)
    expect(schedule.lastRunAt).toBe(runAt)
  })

  test('updates job status', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    const job = scheduler.createJob(schedule.id, new Date().toISOString())
    const updated = scheduler.updateJobStatus(job.id, 'completed', { result: 'success' })

    expect(updated.status).toBe('completed')
    expect(updated.result).toEqual({ result: 'success' })
    expect(updated.completedAt).toBeDefined()
  })

  test('lists jobs with filters', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    const job1 = scheduler.createJob(schedule.id, new Date().toISOString())
    const job2 = scheduler.createJob(schedule.id, new Date().toISOString())
    scheduler.updateJobStatus(job1.id, 'completed')

    const completedJobs = scheduler.listJobs(schedule.id, 'completed')
    expect(completedJobs.length).toBeGreaterThanOrEqual(1)
    expect(completedJobs.every((j) => j.status === 'completed')).toBe(true)
  })

  test('sets and gets notification config', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    const config = {
      webhooks: [{ url: 'https://example.com/webhook', events: ['completed', 'failed'] }],
      email: {
        recipients: ['user@example.com'],
        events: ['completed'],
      },
    }

    scheduler.setNotificationConfig(schedule.id, config)
    const retrieved = scheduler.getNotificationConfig(schedule.id)

    expect(retrieved).toEqual(config)
  })

  test('gets due schedules', () => {
    const schedule = scheduler.createSchedule({
      projectId: 'project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    })

    // Manually set nextRunAt to past time
    schedule.nextRunAt = new Date(Date.now() - 1000).toISOString()

    const due = scheduler.getDueSchedules()
    expect(due.length).toBeGreaterThanOrEqual(1)
    expect(due.some((s) => s.id === schedule.id)).toBe(true)
  })
})

describe('Notifications', () => {
  test('sendNotification handles webhook config', async () => {
    const config = {
      webhooks: [{ url: 'https://httpbin.org/post', events: ['*'] }],
    }

    // This will make an actual HTTP request - in production, mock this
    await expect(sendNotification(config, 'test', { data: 'test' })).resolves.not.toThrow()
  })

  test('sendNotification handles email config', async () => {
    const config = {
      email: {
        recipients: ['user@example.com'],
        events: ['completed'],
      },
    }

    // Should not throw (logs to console in current implementation)
    await expect(sendNotification(config, 'completed', { data: 'test' })).resolves.not.toThrow()
  })
})
