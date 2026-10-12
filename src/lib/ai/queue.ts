// NovaMart Support Platform - AI Request Management & Concurrency Worker Pool
// Manages concurrency, timeouts, priority queues, and backoff retries for LLM requests

import { AIResponsePayload } from "@/types";
import { aiCircuitBreaker } from "./circuit-breaker";

export interface AIQueueTask {
  id: string;
  customerId: string;
  conversationId: string;
  messageText: string;
  vipTier?: string;
  fn: () => Promise<AIResponsePayload>;
  resolve: (res: AIResponsePayload) => void;
  reject: (err: any) => void;
  createdAt: number;
  retries: number;
}

class AIRequestQueue {
  private activeCount: number = 0;
  private maxConcurrent: number = 6;
  private queue: AIQueueTask[] = [];
  private inFlightDedupe: Map<string, Promise<AIResponsePayload>> = new Map();
  private requestTimeoutMs: number = 15000; // 15s deadline

  /**
   * Enqueue an AI processing task with priority and deduplication
   */
  public enqueue(
    params: {
      customerId: string;
      conversationId: string;
      messageText: string;
      vipTier?: string;
    },
    fn: () => Promise<AIResponsePayload>
  ): Promise<AIResponsePayload> {
    const dedupeKey = `${params.conversationId}:${params.messageText.trim()}`;
    const existing = this.inFlightDedupe.get(dedupeKey);
    if (existing) {
      return existing;
    }

    const promise = new Promise<AIResponsePayload>((resolve, reject) => {
      const task: AIQueueTask = {
        id: `ai-task-${Math.random().toString(36).slice(2, 9)}`,
        customerId: params.customerId,
        conversationId: params.conversationId,
        messageText: params.messageText,
        vipTier: params.vipTier,
        fn,
        resolve,
        reject,
        createdAt: Date.now(),
        retries: 0,
      };

      // VIP Customers (Platinum/Gold) get priority in queue
      if (params.vipTier === "PLATINUM" || params.vipTier === "GOLD") {
        // Find first non-VIP position
        const insertIdx = this.queue.findIndex((t) => t.vipTier !== "PLATINUM" && t.vipTier !== "GOLD");
        if (insertIdx !== -1) {
          this.queue.splice(insertIdx, 0, task);
        } else {
          this.queue.push(task);
        }
      } else {
        this.queue.push(task);
      }

      this.processNext();
    });

    this.inFlightDedupe.set(dedupeKey, promise);
    promise.finally(() => {
      // Clear dedupe key after 2 seconds
      setTimeout(() => this.inFlightDedupe.delete(dedupeKey), 2000);
    });

    return promise;
  }

  /**
   * Worker dispatcher loop
   */
  private async processNext() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    let timer: NodeJS.Timeout | null = null;
    try {
      // Execute with timeout and circuit breaker
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("AI_REQUEST_TIMEOUT: 15s deadline exceeded")), this.requestTimeoutMs);
      });

      const result = await Promise.race([task.fn(), timeoutPromise]);
      if (timer) clearTimeout(timer);
      aiCircuitBreaker.recordSuccess();
      task.resolve(result);
    } catch (error: any) {
      if (timer) clearTimeout(timer);
      aiCircuitBreaker.recordFailure(error);

      // Controlled retry with exponential backoff (max 2 retries)
      if (task.retries < 2 && !String(error?.message).includes("UNAUTHORIZED")) {
        task.retries++;
        const backoffMs = 300 * Math.pow(2, task.retries);
        console.warn(`[AIQueue] Task ${task.id} failed (${error?.message?.slice(0, 100)}). Retrying in ${backoffMs}ms...`);
        setTimeout(() => {
          this.queue.unshift(task);
          this.activeCount--;
          this.processNext();
        }, backoffMs);
        return;
      }

      task.reject(error);
    } finally {
      if (timer) clearTimeout(timer);
      this.activeCount--;
      this.processNext();
    }
  }

  public getStats() {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      circuitState: aiCircuitBreaker.getStatus().state,
    };
  }
}

export const aiQueue = new AIRequestQueue();
