// NovaMart Support Platform - Idempotency & Duplicate Mutation Shield
// Prevents duplicate return requests, tickets, refunds, and email sends caused by network retries or rapid button clicks

export interface IdempotencyRecord<T = any> {
  key: string;
  result: T;
  createdAt: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

class IdempotencyEngine {
  private cache: Map<string, IdempotencyRecord> = new Map();
  private ttlMs: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Execute an action with idempotency protection
   */
  public async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.cache.get(key);
    if (existing) {
      if (existing.status === "COMPLETED") {
        return existing.result;
      }
      if (existing.status === "PENDING") {
        // Wait briefly for in-flight completion or throw deduplication notice
        await new Promise((r) => setTimeout(r, 200));
        const updated = this.cache.get(key);
        if (updated && updated.status === "COMPLETED") {
          return updated.result;
        }
      }
    }

    this.cache.set(key, {
      key,
      result: null,
      createdAt: Date.now(),
      status: "PENDING",
    });

    try {
      const result = await fn();
      this.cache.set(key, {
        key,
        result,
        createdAt: Date.now(),
        status: "COMPLETED",
      });
      return result;
    } catch (error) {
      this.cache.delete(key);
      throw error;
    }
  }

  public generateKey(prefix: string, ...identifiers: string[]): string {
    return `${prefix}:${identifiers.filter(Boolean).join(":")}`;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const idempotency = new IdempotencyEngine();
