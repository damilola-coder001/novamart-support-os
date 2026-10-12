// NovaMart Support Platform - Structured Observability & Telemetry Logger
// Provides high-performance structured logging without exposing API secrets or customer PII

export interface MetricEvent {
  type: "API_REQUEST" | "AI_LATENCY" | "RATE_LIMIT" | "CIRCUIT_BREAKER" | "JOB_EXECUTION" | "DATABASE_QUERY";
  durationMs?: number;
  status?: string | number;
  path?: string;
  method?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class ObservabilityService {
  private metrics: MetricEvent[] = [];
  private maxHistory: number = 1000;

  /**
   * Log an event with automated credential and PII sanitization
   */
  public log(event: Omit<MetricEvent, "timestamp">): void {
    const sanitizedMetadata = this.sanitize(event.metadata);
    const metric: MetricEvent = {
      ...event,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxHistory) {
      this.metrics.shift();
    }

    // Output structured JSON log
    if (process.env.NODE_ENV !== "test") {
      const { type, durationMs, path, status } = metric;
      const perfText = durationMs ? ` [${durationMs}ms]` : "";
      const statusText = status ? ` Status:${status}` : "";
      console.log(`[Telemetry:${type}]${path ? ` ${path}` : ""}${statusText}${perfText}`);
    }
  }

  /**
   * Redact sensitive keys
   */
  private sanitize(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    const sensitiveKeys = ["authorization", "cookie", "token", "password", "apikey", "secret", "cvv", "cardnumber"];
    const cleaned: Record<string, any> = {};

    for (const [k, v] of Object.entries(data)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        cleaned[k] = "[REDACTED]";
      } else if (typeof v === "object" && v !== null) {
        cleaned[k] = this.sanitize(v);
      } else {
        cleaned[k] = v;
      }
    }
    return cleaned;
  }

  public getRecentMetrics(limit: number = 100): MetricEvent[] {
    return this.metrics.slice(-limit);
  }

  public getSummary() {
    const total = this.metrics.length;
    const apiRequests = this.metrics.filter((m) => m.type === "API_REQUEST");
    const aiEvents = this.metrics.filter((m) => m.type === "AI_LATENCY");
    const avgLatency =
      apiRequests.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / Math.max(1, apiRequests.length);
    const avgAiLatency =
      aiEvents.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / Math.max(1, aiEvents.length);

    return {
      totalEvents: total,
      avgApiLatencyMs: Math.round(avgLatency),
      avgAiLatencyMs: Math.round(avgAiLatency),
      recentRateLimits: this.metrics.filter((m) => m.type === "RATE_LIMIT").length,
    };
  }
}

export const logger = new ObservabilityService();
