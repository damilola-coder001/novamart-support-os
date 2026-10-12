// NovaMart Support Platform - Asynchronous Reliable Job Queue
// Decouples non-critical tasks (emails, analytics, activity logs, notification distribution) from customer request loops

export type JobType =
  | "SEND_EMAIL"
  | "LOG_ACTIVITY"
  | "DISPATCH_NOTIFICATION"
  | "AGGREGATE_METRICS"
  | "SUMMARIZE_CONVERSATION";

export interface Job<T = any> {
  id: string;
  type: JobType;
  payload: T;
  retries: number;
  maxRetries: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error?: string;
  createdAt: number;
  processedAt?: number;
}

export type JobHandler<T = any> = (payload: T) => Promise<void>;

class ReliableJobQueue {
  private queue: Job[] = [];
  private processing: boolean = false;
  private concurrency: number = 4;
  private activeWorkers: number = 0;
  private handlers: Map<JobType, JobHandler> = new Map();
  private deadLetterQueue: Job[] = [];
  private jobHistory: Job[] = [];

  constructor() {
    this.startWorkerLoop();
  }

  /**
   * Register a worker handler for a specific job type
   */
  public registerHandler<T>(type: JobType, handler: JobHandler<T>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Push a new job onto the asynchronous queue
   */
  public enqueue<T>(type: JobType, payload: T, maxRetries: number = 3): string {
    const job: Job<T> = {
      id: `job-${type.toLowerCase()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      retries: 0,
      maxRetries,
      status: "PENDING",
      createdAt: Date.now(),
    };

    this.queue.push(job);
    return job.id;
  }

  /**
   * Background worker loop
   */
  private startWorkerLoop() {
    setInterval(() => {
      this.dispatch();
    }, 50);
  }

  private async dispatch() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.warn(`[JobQueue] No handler registered for job type ${job.type}. Discarding.`);
      return;
    }

    this.activeWorkers++;
    job.status = "PROCESSING";
    job.processedAt = Date.now();

    try {
      await handler(job.payload);
      job.status = "COMPLETED";
      this.recordHistory(job);
    } catch (err: any) {
      job.error = err?.message || String(err);

      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = "PENDING";
        const backoff = 300 * Math.pow(2, job.retries);
        console.warn(`[JobQueue] Job ${job.id} (${job.type}) failed: ${job.error}. Retrying in ${backoff}ms...`);
        setTimeout(() => {
          this.queue.push(job);
        }, backoff);
      } else {
        job.status = "FAILED";
        this.deadLetterQueue.push(job);
        console.error(`[JobQueue] Job ${job.id} permanently failed after ${job.maxRetries} retries: ${job.error}`);
        this.recordHistory(job);
      }
    } finally {
      this.activeWorkers--;
      this.dispatch();
    }
  }

  private recordHistory(job: Job) {
    this.jobHistory.push(job);
    if (this.jobHistory.length > 500) {
      this.jobHistory.shift();
    }
  }

  public getStats() {
    return {
      pending: this.queue.length,
      active: this.activeWorkers,
      failed: this.deadLetterQueue.length,
      completed: this.jobHistory.filter((j) => j.status === "COMPLETED").length,
    };
  }
}

export const jobQueue = new ReliableJobQueue();

// Register default async background workers
jobQueue.registerHandler("LOG_ACTIVITY", async (payload: any) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.activityLog.create({
    data: {
      actorType: payload.actorType || "SYSTEM",
      actorName: payload.actorName || "System Worker",
      action: payload.action || "BACKGROUND_TASK",
      entityType: payload.entityType || "Job",
      entityId: payload.entityId || "none",
      details: typeof payload.details === "string" ? payload.details : JSON.stringify(payload.details || {}),
      tenantId: payload.tenantId || "tenant_novamart_default",
    },
  });
});

jobQueue.registerHandler("DISPATCH_NOTIFICATION", async (payload: any) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.notification.create({
    data: {
      recipientRole: payload.recipientRole || "SUPPORT_AGENT",
      title: payload.title,
      message: payload.message,
      type: payload.type || "INFO",
      link: payload.link,
      tenantId: payload.tenantId || "tenant_novamart_default",
    },
  });
});

jobQueue.registerHandler("SEND_EMAIL", async (payload: any) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.emailEvent.create({
    data: {
      customerId: payload.customerId,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      templateType: payload.templateType || "NOTIFICATION",
      contentPreview: payload.contentPreview || payload.subject,
      htmlContent: payload.htmlContent || `<p>${payload.subject}</p>`,
      status: "SENT",
      tenantId: payload.tenantId || "tenant_novamart_default",
    },
  });
});

