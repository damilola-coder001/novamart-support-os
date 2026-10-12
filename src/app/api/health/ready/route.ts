// NovaMart Support Platform - Readiness Health Endpoint
// Verifies core dependencies (Database, AI Service, Job Queue) before accepting traffic

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiCircuitBreaker } from "@/lib/ai/circuit-breaker";
import { jobQueue } from "@/lib/jobs/queue";
import { logger } from "@/lib/observability/logger";

export async function GET(_req: NextRequest) {
  let dbStatus = "healthy";
  let aiStatus = "healthy";
  let jobStatus = "healthy";

  try {
    const custCount = await prisma.customer.count();
    if (typeof custCount !== "number") {
      dbStatus = "unhealthy";
    }
  } catch (err) {
    dbStatus = "unhealthy";
  }

  const cbStatus = aiCircuitBreaker.getStatus();
  if (cbStatus.isOpen) {
    aiStatus = "degraded (fallback active)";
  }

  const jqStats = jobQueue.getStats();
  if (jqStats.failed > 50) {
    jobStatus = "degraded";
  }

  const isReady = dbStatus === "healthy";

  return NextResponse.json(
    {
      ready: isReady,
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        aiService: aiStatus,
        jobQueue: jobStatus,
      },
      metrics: {
        circuitBreaker: cbStatus,
        jobQueue: jqStats,
        telemetry: logger.getSummary(),
      },
    },
    { status: isReady ? 200 : 503 }
  );
}
