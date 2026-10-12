// NovaMart Support Platform - High-Performance Sliding Window Rate Limiter
// Protects endpoints from abuse, credential stuffing, and AI prompt flooding

export type RateLimitCategory = "AUTH" | "CHAT" | "API" | "ADMIN" | "UPLOAD";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until allowed
}

const TIER_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  AUTH: { maxRequests: 10, windowMs: 60 * 1000 },       // Strict: 10 req/min
  CHAT: { maxRequests: 40, windowMs: 60 * 1000 },       // AI Chat: 40 req/min
  UPLOAD: { maxRequests: 20, windowMs: 60 * 1000 },     // File uploads: 20 req/min
  API: { maxRequests: 200, windowMs: 60 * 1000 },       // Standard reads/writes: 200 req/min
  ADMIN: { maxRequests: 500, windowMs: 60 * 1000 },     // Internal Admin ops: 500 req/min
};

interface RequestLog {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private store: Map<string, RequestLog> = new Map();
  private lastCleanup: number = Date.now();

  /**
   * Evaluates if a request should be allowed under sliding window limits
   */
  public check(identifier: string, category: RateLimitCategory = "API"): RateLimitResult {
    const now = Date.now();
    this.autoCleanup(now);

    const config = TIER_CONFIGS[category] || TIER_CONFIGS.API;
    const key = `${category}:${identifier}`;

    let log = this.store.get(key);
    if (!log) {
      log = { timestamps: [] };
      this.store.set(key, log);
    }

    const windowStart = now - config.windowMs;
    // Filter out timestamps outside current sliding window
    log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

    const currentCount = log.timestamps.length;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0));
    const oldestTimestamp = log.timestamps[0] || now;
    const resetTime = Math.ceil((oldestTimestamp + config.windowMs) / 1000);
    const retryAfter = allowed ? 0 : Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);

    if (allowed) {
      log.timestamps.push(now);
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter,
    };
  }

  /**
   * Periodically cleans up expired keys to prevent memory leaks
   */
  private autoCleanup(now: number) {
    if (now - this.lastCleanup > 120000) { // Every 2 minutes
      this.lastCleanup = now;
      const maxWindow = 60000;
      const cutoff = now - maxWindow;

      for (const [key, log] of this.store.entries()) {
        log.timestamps = log.timestamps.filter((ts) => ts > cutoff);
        if (log.timestamps.length === 0) {
          this.store.delete(key);
        }
      }
    }
  }

  public reset(): void {
    this.store.clear();
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
