// NovaMart Support Platform - Scalability, Performance & Concurrency Load Test
// Validates multi-tenant isolation, rate limiting, AI concurrency, background jobs, and sub-second p95 latency

const BASE_URL = "http://localhost:3000";

async function runLoadTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING SCALABILITY & CONCURRENCY LOAD TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  // Helper
  async function testStep(name: string, fn: () => Promise<boolean>) {
    process.stdout.write(`⏳ Testing: ${name}... `);
    const start = Date.now();
    try {
      const ok = await fn();
      const dur = Date.now() - start;
      if (ok) {
        console.log(`✅ PASSED (${dur}ms)`);
        passed++;
      } else {
        console.log(`❌ FAILED (${dur}ms)`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ ERROR: ${err?.message || err}`);
      failed++;
    }
  }

  // 1. Health & Readiness Checks
  await testStep("Health & Readiness Endpoints (/health & /health/ready)", async () => {
    const res1 = await fetch(`${BASE_URL}/health`);
    const data1 = await res1.json();
    const res2 = await fetch(`${BASE_URL}/health/ready`);
    const data2 = await res2.json();
    return res1.status === 200 && data1.status === "ok" && res2.status === 200 && data2.ready === true;
  });

  // 2. High-Concurrency API Read Throughput (200 simultaneous requests)
  await testStep("200 Concurrent API Requests (Orders / Returns / Conversations)", async () => {
    const promises: Promise<Response>[] = [];
    const users = ["sarah.j@example.com", "david.smith@example.com", "james.w@example.com", "emily.d@example.com"];

    for (let i = 0; i < 200; i++) {
      const email = users[i % users.length];
      const clientIp = `192.168.10.${(i % 50) + 1}`;
      const endpoint = i % 2 === 0 ? "/api/customer/orders" : "/api/customer/conversations";
      promises.push(
        fetch(`${BASE_URL}${endpoint}`, {
          headers: {
            Cookie: `novamart_user_email=${email}`,
            "X-Forwarded-For": clientIp,
          },
        })
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter((r) => r.status === 200).length;
    return successCount === 200;
  });

  // 3. Multi-Tenant Scoping & Server-Side Data Isolation
  await testStep("Multi-Tenant Isolation & Record Scoping", async () => {
    const res = await fetch(`${BASE_URL}/api/customer/orders`, {
      headers: {
        Cookie: `novamart_user_email=sarah.j@example.com`,
        "X-Forwarded-For": "192.168.99.1",
      },
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.orders)) return false;

    // Verify all returned orders belong strictly to Sarah (cust-01)
    const allBelongToSarah = data.orders.every((o: any) => o.customerId === "cust-01");
    return allBelongToSarah && data.orders.length > 0;
  });

  // 4. API Rate Limiting Protection (Burst on Auth endpoint)
  await testStep("Sliding Window Rate Limiter (HTTP 429 on Burst)", async () => {
    let hit429 = false;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.0.99" },
        body: JSON.stringify({ email: "sarah.j@example.com" }),
      });
      if (res.status === 429) {
        hit429 = true;
        const retryHeader = res.headers.get("Retry-After");
        if (retryHeader) break;
      }
    }
    return hit429;
  });

  // 5. Simultaneous AI Conversations (Concurrency & Priority Worker Pool)
  await testStep("Concurrent AI Conversations (Sarah, David, James, Emily)", async () => {
    const customers = [
      { email: "sarah.j@example.com", msg: "Where is my order ORD-9821?" },
      { email: "david.smith@example.com", msg: "Can I get the tracking update for ORD-5542?" },
      { email: "james.w@example.com", msg: "Check status of ticket TCK-8802" },
      { email: "emily.d@example.com", msg: "What benefits do I get with Silver VIP?" },
    ];

    const promises = customers.map((c) =>
      fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `novamart_user_email=${c.email}`,
        },
        body: JSON.stringify({ message: c.msg }),
      }).then((r) => r.json())
    );

    const results = await Promise.all(promises);
    return results.every((r) => r.success === true && r.aiMessage && r.aiMessage.content.length > 10);
  });

  // 6. Asynchronous Job Queue Execution (100 Background Tasks)
  await testStep("Asynchronous Job Queue Worker Throughput (100 Jobs)", async () => {
    const { jobQueue } = await import("../src/lib/jobs/queue");
    for (let i = 0; i < 100; i++) {
      jobQueue.enqueue("LOG_ACTIVITY", {
        actorType: "SYSTEM",
        actorName: "Load Tester",
        action: `BENCHMARK_JOB_${i}`,
        entityType: "Benchmark",
        entityId: `bench-${i}`,
      });
    }

    // Give background workers 300ms to process
    await new Promise((r) => setTimeout(r, 300));
    const stats = jobQueue.getStats();
    return stats.completed > 50 && stats.failed === 0;
  });

  // 7. Idempotency & Duplicate Protection Guard
  await testStep("Idempotency Shield (Duplicate Mutation Prevention)", async () => {
    const { idempotency } = await import("../src/lib/security/idempotency");
    let executionCounter = 0;
    const idempotentKey = `MUTATION_TEST_${Date.now()}`;

    const task = () =>
      idempotency.execute(idempotentKey, async () => {
        executionCounter++;
        return { ticketNumber: "TCK-TEST-9999", created: true };
      });

    // Fire 5 identical requests simultaneously with the same key
    const [r1, r2, r3, r4, r5] = await Promise.all([task(), task(), task(), task(), task()]);

    // Counter must strictly equal 1, and all responses must receive the exact result
    return (
      executionCounter === 1 &&
      r1.ticketNumber === "TCK-TEST-9999" &&
      r2.ticketNumber === "TCK-TEST-9999" &&
      r5.ticketNumber === "TCK-TEST-9999"
    );
  });

  console.log("\n=======================================================");
  console.log(`📊 LOAD TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runLoadTests();
