/**
 * Batch and streaming inference jobs
 * Basic job queue infrastructure
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface InferenceJob {
  id: string
  modelId: string
  modelVersion?: string
  input: any
  status: JobStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  result?: any
  error?: string
  retryCount: number
  maxRetries: number
  metadata?: Record<string, any>
}

/**
 * Simple in-memory job queue (in production, use Redis/RabbitMQ)
 */
class InferenceJobQueue {
  private jobs: Map<string, InferenceJob> = new Map()
  private processing: Set<string> = new Set()

  createJob(
    modelId: string,
    input: any,
    options?: {
      modelVersion?: string
      maxRetries?: number
      metadata?: Record<string, any>
    }
  ): InferenceJob {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const job: InferenceJob = {
      id,
      modelId,
      modelVersion: options?.modelVersion,
      input,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: options?.maxRetries || 3,
      metadata: options?.metadata,
    }

    this.jobs.set(id, job)
    return job
  }

  getJob(id: string): InferenceJob | undefined {
    return this.jobs.get(id)
  }

  listJobs(status?: JobStatus): InferenceJob[] {
    const jobs = Array.from(this.jobs.values())
    return status ? jobs.filter((j) => j.status === status) : jobs
  }

  updateJobStatus(
    id: string,
    status: JobStatus,
    result?: any,
    error?: string
  ): InferenceJob {
    const job = this.jobs.get(id)
    if (!job) {
      throw new Error(`Job ${id} not found`)
    }

    job.status = status
    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date().toISOString()
      this.processing.add(id)
    }
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      job.completedAt = new Date().toISOString()
      this.processing.delete(id)
      if (result) job.result = result
      if (error) job.error = error
    }

    return job
  }

  retryJob(id: string): InferenceJob {
    const job = this.jobs.get(id)
    if (!job) {
      throw new Error(`Job ${id} not found`)
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error(`Job ${id} has exceeded max retries`)
    }

    job.retryCount++
    job.status = 'pending'
    job.error = undefined
    job.startedAt = undefined
    job.completedAt = undefined

    return job
  }

  cancelJob(id: string): InferenceJob {
    return this.updateJobStatus(id, 'cancelled')
  }
}

export const inferenceJobQueue = new InferenceJobQueue()
