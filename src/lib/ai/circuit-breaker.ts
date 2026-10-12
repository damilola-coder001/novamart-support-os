// NovaMart Support Platform - AI Circuit Breaker
// Protects backend from cascading failures when upstream LLM providers experience outages or latency spikes

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of consecutive failures to trip
  recoveryTimeMs: number;   // Time in OPEN state before trying HALF_OPEN probe (e.g. 30s)
  successThreshold: number; // Successful probes needed in HALF_OPEN to CLOSE
}

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 3,
      recoveryTimeMs: config.recoveryTimeMs || 30000,
      successThreshold: config.successThreshold || 1,
    };
  }

  /**
   * Returns whether a request should be dispatched to the remote LLM provider
   */
  public canExecute(): boolean {
    const now = Date.now();

    if (this.state === "CLOSED") {
      return true;
    }

    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.config.recoveryTimeMs) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
        console.log(`[CircuitBreaker] Entering HALF_OPEN state — sending probe request.`);
        return true;
      }
      return false; // Circuit is OPEN, bypass remote LLM
    }

    if (this.state === "HALF_OPEN") {
      // In half open, allow single probe requests
      return true;
    }

    return true;
  }

  /**
   * Record a successful response from upstream LLM
   */
  public recordSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        console.log(`[CircuitBreaker] Upstream provider recovered. Circuit CLOSED.`);
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failure from upstream LLM
   */
  public recordFailure(error?: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] Circuit TRIPPED to OPEN (${this.failureCount} consecutive errors). Fast fallback activated.`);
    }
  }

  public getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.state === "OPEN",
    };
  }

  public reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

export const aiCircuitBreaker = new CircuitBreaker();
