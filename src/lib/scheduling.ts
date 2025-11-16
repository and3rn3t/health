/**
 * Scheduled analyses and notifications
 * Cron-like scheduling, webhooks, and email notifications
 */

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron'

export interface Schedule {
  id: string
  projectId: string
  aoiId?: string
  analysisType: string
  scheduleType: ScheduleType
  cronExpression?: string // For custom cron schedules
  timezone?: string
  enabled: boolean
  nextRunAt?: string
  lastRunAt?: string
  runCount: number
  metadata?: Record<string, any>
}

export interface NotificationConfig {
  webhooks?: Array<{ url: string; events: string[] }>
  email?: {
    recipients: string[]
    events: string[]
  }
}

export interface ScheduledJob {
  id: string
  scheduleId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  runAt: string
  startedAt?: string
  completedAt?: string
  result?: any
  error?: string
}

/**
 * Simple in-memory scheduler (in production, use proper job queue like Bull/BullMQ)
 */
class Scheduler {
  private schedules: Map<string, Schedule> = new Map()
  private jobs: Map<string, ScheduledJob> = new Map()
  private notificationConfigs: Map<string, NotificationConfig> = new Map()

  createSchedule(schedule: Omit<Schedule, 'id' | 'runCount'>): Schedule {
    const id = `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullSchedule: Schedule = {
      ...schedule,
      id,
      runCount: 0,
      enabled: schedule.enabled !== false,
    }

    // Calculate next run time
    fullSchedule.nextRunAt = this.calculateNextRun(fullSchedule)

    this.schedules.set(id, fullSchedule)
    return fullSchedule
  }

  getSchedule(id: string): Schedule | undefined {
    return this.schedules.get(id)
  }

  listSchedules(projectId?: string, enabled?: boolean): Schedule[] {
    let schedules = Array.from(this.schedules.values())
    if (projectId) {
      schedules = schedules.filter((s) => s.projectId === projectId)
    }
    if (enabled !== undefined) {
      schedules = schedules.filter((s) => s.enabled === enabled)
    }
    return schedules
  }

  updateSchedule(id: string, updates: Partial<Schedule>): Schedule {
    const schedule = this.schedules.get(id)
    if (!schedule) {
      throw new Error(`Schedule ${id} not found`)
    }

    Object.assign(schedule, updates)
    if (updates.enabled !== undefined || updates.scheduleType || updates.cronExpression) {
      schedule.nextRunAt = this.calculateNextRun(schedule)
    }
    return schedule
  }

  deleteSchedule(id: string): void {
    this.schedules.delete(id)
  }

  setNotificationConfig(scheduleId: string, config: NotificationConfig): void {
    this.notificationConfigs.set(scheduleId, config)
  }

  getNotificationConfig(scheduleId: string): NotificationConfig | undefined {
    return this.notificationConfigs.get(scheduleId)
  }

  createJob(scheduleId: string, runAt: string): ScheduledJob {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`)
    }

    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const job: ScheduledJob = {
      id,
      scheduleId,
      status: 'pending',
      runAt,
    }

    this.jobs.set(id, job)
    schedule.runCount++
    schedule.lastRunAt = runAt
    schedule.nextRunAt = this.calculateNextRun(schedule)

    return job
  }

  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id)
  }

  listJobs(scheduleId?: string, status?: ScheduledJob['status']): ScheduledJob[] {
    let jobs = Array.from(this.jobs.values())
    if (scheduleId) {
      jobs = jobs.filter((j) => j.scheduleId === scheduleId)
    }
    if (status) {
      jobs = jobs.filter((j) => j.status === status)
    }
    return jobs
  }

  updateJobStatus(
    id: string,
    status: ScheduledJob['status'],
    result?: any,
    error?: string
  ): ScheduledJob {
    const job = this.jobs.get(id)
    if (!job) {
      throw new Error(`Job ${id} not found`)
    }

    job.status = status
    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date().toISOString()
    }
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString()
      if (result) job.result = result
      if (error) job.error = error
    }

    return job
  }

  private calculateNextRun(schedule: Schedule): string {
    if (!schedule.enabled) {
      return undefined as any
    }

    const now = new Date()
    let next = new Date(now)

    switch (schedule.scheduleType) {
      case 'once':
        // Already ran or invalid
        return undefined as any
      case 'daily':
        next.setDate(next.getDate() + 1)
        next.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        next.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        next.setDate(1)
        next.setHours(0, 0, 0, 0)
        break
      case 'cron':
        // Simplified: for production, use proper cron parser
        if (schedule.cronExpression) {
          // Basic implementation: add 1 day for now
          next.setDate(next.getDate() + 1)
        }
        break
    }

    return next.toISOString()
  }

  getDueSchedules(): Schedule[] {
    const now = new Date().toISOString()
    return Array.from(this.schedules.values()).filter(
      (s) => s.enabled && s.nextRunAt && s.nextRunAt <= now
    )
  }
}

export const scheduler = new Scheduler()

/**
 * Send notification (webhook or email)
 * In production, integrate with actual webhook/email services
 */
export async function sendNotification(
  config: NotificationConfig,
  event: string,
  data: Record<string, any>
): Promise<void> {
  // Webhooks
  if (config.webhooks) {
    for (const webhook of config.webhooks) {
      if (webhook.events.includes(event) || webhook.events.includes('*')) {
        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
          })
        } catch (error) {
          console.error(`Webhook notification failed: ${webhook.url}`, error)
        }
      }
    }
  }

  // Email (placeholder - in production, use email service)
  if (config.email && config.email.recipients.length > 0) {
    if (config.email.events.includes(event) || config.email.events.includes('*')) {
      console.log(`[EMAIL] To: ${config.email.recipients.join(', ')}, Event: ${event}`, data)
      // In production: send actual email via SMTP/service
    }
  }
}
