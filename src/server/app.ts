import "dotenv/config"; // Load .env into process.env before anything reads configuration
import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";

// Import all API routes
import * as authSessionRoute from "@/app/api/auth/session/route";
import * as chatRoute from "@/app/api/chat/route";
import * as customerOrdersRoute from "@/app/api/customer/orders/route";
import * as customerReturnsRoute from "@/app/api/customer/returns/route";
import * as customerFeedbackRoute from "@/app/api/customer/feedback/route";
import * as customerConversationsRoute from "@/app/api/customer/conversations/route";
import * as customerNotificationsRoute from "@/app/api/customer/notifications/route";
import * as customerEmailPreferenceRoute from "@/app/api/customer/email-preference/route";
import * as agentConversationsRoute from "@/app/api/agent/conversations/route";
import * as agentConversationDetailRoute from "@/app/api/agent/conversations/[id]/route";
import * as agentTakeoverRoute from "@/app/api/agent/conversations/[id]/takeover/route";
import * as agentReplyRoute from "@/app/api/agent/conversations/[id]/reply/route";
import * as agentTicketsRoute from "@/app/api/agent/tickets/route";
import * as agentTicketsDetailRoute from "@/app/api/agent/tickets/[id]/route";
import * as agentCustomersRoute from "@/app/api/agent/customers/route";
import * as adminAnalyticsRoute from "@/app/api/admin/analytics/route";
import * as adminActivityRoute from "@/app/api/admin/activity/route";
import * as adminKnowledgeRoute from "@/app/api/admin/knowledge/route";
import * as adminEmailsRoute from "@/app/api/admin/emails/route";
import * as adminSettingsRoute from "@/app/api/admin/settings/route";
import * as adminDispatchRoute from "@/app/api/admin/dispatch/route";
import * as uploadRoute from "@/app/api/upload/route";
import * as healthRoute from "@/app/api/health/route";
import * as healthReadyRoute from "@/app/api/health/ready/route";
import { rateLimiter, RateLimitCategory } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/observability/logger";
import { eventHub } from "@/lib/events/hub";

// Guard against a non-numeric PORT env var (parseInt → NaN → listen(NaN) binds
// a random port silently instead of failing loudly).
const PORT_PARSED = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
const PORT =
  Number.isInteger(PORT_PARSED) && PORT_PARSED > 0 && PORT_PARSED <= 65535 ? PORT_PARSED : 3000;
const PUBLIC_DIR = fs.existsSync(path.join(process.cwd(), "public"))
  ? path.join(process.cwd(), "public")
  : path.join(__dirname, "../public");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

const HTML_SHELL = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NovaMart — AI-Powered Customer Support Platform</title>
    <meta name="description" content="Autonomous AI customer support platform prototype for NovaMart with human escalation and agent copilot." />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased selection:bg-brand-500/20">
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>`;

async function sendResponse(res: http.ServerResponse, resp: any) {
  if (resp && typeof resp.text === "function") {
    const status = resp.status || 200;
    const headers: Record<string, string | string[]> = {};

    if (resp.headers) {
      if (typeof resp.headers.forEach === "function") {
        resp.headers.forEach((value: string, key: string) => {
          if (key.toLowerCase() !== "set-cookie") {
            headers[key] = value;
          }
        });
      } else if (typeof resp.headers.entries === "function") {
        for (const [k, v] of resp.headers.entries()) {
          if (k.toLowerCase() !== "set-cookie") {
            headers[k] = v;
          }
        }
      }

      if (typeof resp.headers.getSetCookie === "function") {
        const cookies = resp.headers.getSetCookie();
        if (cookies && cookies.length > 0) {
          headers["set-cookie"] = cookies;
        }
      } else if (resp.headers.get && resp.headers.get("set-cookie")) {
        headers["set-cookie"] = resp.headers.get("set-cookie");
      }
    }

    if (!headers["content-type"]) {
      headers["content-type"] = "application/json; charset=utf-8";
    }

    // Direct streaming response (SSE / chunked)
    const ct = String(headers["content-type"] || "");
    if (ct.includes("text/event-stream") && resp.body && typeof resp.body.getReader === "function") {
      res.writeHead(status, headers);
      const reader = resp.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch (streamErr) {
        // client disconnected
      } finally {
        res.end();
      }
      return;
    }

    let bodyText = "";
    if (typeof (resp as any)._cachedBody === "string") {
      bodyText = (resp as any)._cachedBody;
    } else {
      try {
        bodyText = await resp.text();
      } catch {
        bodyText = "";
      }
    }

    res.writeHead(status, headers);
    return res.end(bodyText);
  }

  // Fallback direct payload
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(typeof resp === "string" ? resp : JSON.stringify(resp));
}

export function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = (() => {
        try {
          return new URL(req.url || "/", `http://${req.headers.host || "localhost:3000"}`);
        } catch {
          return null; // malformed request line / percent-encoding
        }
      })();

      if (!parsedUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: "Bad request: malformed URL." }));
      }

      const pathname = parsedUrl.pathname;
      const method = req.method?.toUpperCase() || "GET";

      // CORS preflight — required for cross-origin API clients; without this the
      // browser blocks requests and surfaces a confusing network error.
      if (method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cookie",
          "Access-Control-Max-Age": "86400",
        });
        return res.end();
      }

      // 1. Static file handling from PUBLIC_DIR
      const cleanPath = pathname.replace(/^\/+/, "");
      const filePath = path.join(PUBLIC_DIR, cleanPath);

      // Path traversal guard: a crafted "/../../.env" must never escape PUBLIC_DIR.
      const isSafePath =
        path.resolve(filePath).startsWith(path.resolve(PUBLIC_DIR) + path.sep) ||
        path.resolve(filePath) === path.resolve(PUBLIC_DIR);

      if (cleanPath && isSafePath && fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          // must-revalidate so a rebuild is picked up on normal reload (no stale bundle)
          "Cache-Control": "no-cache",
        });
        if (method === "HEAD") return res.end();
        const stream = fs.createReadStream(filePath);
        stream.on("error", (streamErr) => {
          console.error("Static file stream error:", streamErr.message);
          res.destroy();
        });
        return stream.pipe(res);
      }

      // 2. Health Check Routes (/health, /health/ready, /api/health, /api/health/ready)
      if (pathname === "/health" || pathname === "/api/health") {
        if (method === "GET") {
          // Health handlers ignore the request; the stub satisfies the required NextRequest param.
          const stubReq = undefined as unknown as import("next/server").NextRequest;
          const resp = await healthRoute.GET(stubReq);
          return sendResponse(res, resp);
        }
      }

      if (pathname === "/health/ready" || pathname === "/api/health/ready") {
        if (method === "GET") {
          const stubReq = undefined as unknown as import("next/server").NextRequest;
          const resp = await healthReadyRoute.GET(stubReq);
          return sendResponse(res, resp);
        }
      }

      // 3. API Routes & Realtime SSE
      if (pathname === "/api/events" && method === "GET") {
        const channel = parsedUrl.searchParams.get("channel") || "*";
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });
        res.write(`data: ${JSON.stringify({ type: "CONNECTED", channel })}\n\n`);

        const unsubscribe = eventHub.subscribe(channel, (event) => {
          try {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          } catch {
            // client disconnected
          }
        });

        const heartbeat = setInterval(() => {
          try {
            res.write(`data: ${JSON.stringify({ type: "PING" })}\n\n`);
          } catch {
            clearInterval(heartbeat);
          }
        }, 15000);

        req.on("close", () => {
          clearInterval(heartbeat);
          unsubscribe();
        });
        return;
      }

      if (pathname.startsWith("/api/")) {
        const reqStartTime = Date.now();
        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "127.0.0.1";

        // Sliding Window Rate Limiting Protection
        let limitCategory: RateLimitCategory = "API";
        if (pathname.startsWith("/api/auth/")) limitCategory = "AUTH";
        else if (pathname === "/api/chat") limitCategory = "CHAT";
        else if (pathname.startsWith("/api/upload")) limitCategory = "UPLOAD";
        else if (pathname.startsWith("/api/admin/")) limitCategory = "ADMIN";

        const rateLimitResult = rateLimiter.check(clientIp, limitCategory);
        res.setHeader("X-RateLimit-Limit", String(rateLimitResult.limit));
        res.setHeader("X-RateLimit-Remaining", String(rateLimitResult.remaining));
        res.setHeader("X-RateLimit-Reset", String(rateLimitResult.resetTime));

        if (!rateLimitResult.allowed) {
          logger.log({
            type: "RATE_LIMIT",
            path: pathname,
            method,
            status: 429,
            metadata: { clientIp, limitCategory, retryAfter: rateLimitResult.retryAfter },
          });

          res.writeHead(429, {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter),
          });
          return res.end(
            JSON.stringify({
              success: false,
              error: "Rate limit exceeded. Please wait a moment before sending more requests.",
              retryAfter: rateLimitResult.retryAfter,
            })
          );
        }

        let bodyBuffer = Buffer.alloc(0);
        let oversized = false;
        await new Promise<void>((resolve, reject) => {
          req.on("data", (chunk) => {
            bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
            if (bodyBuffer.length > 10 * 1024 * 1024) {
              // 10 MB cap — prevents unbounded-memory DoS on /api/upload etc.
              oversized = true;
              req.destroy();
              resolve();
            }
          });
          req.on("end", () => resolve());
          req.on("error", () => {
            if (!oversized) reject(new Error("Request stream error"));
            else resolve();
          });
        });

        if (oversized) {
          res.writeHead(413, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Payload too large (10 MB limit)." }));
        }

        const bodyString = bodyBuffer.toString("utf8");

        const nextReq = {
          url: parsedUrl.toString(),
          nextUrl: parsedUrl,
          method,
          headers: req.headers,
          cookies: {
            get: (name: string) => {
              const cookieHeader = req.headers.cookie || "";
              const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
              if (match) return { value: decodeURIComponent(match[1]) };
              if (name === "novamart_user_email" && req.headers["x-user-email"]) {
                return { value: String(req.headers["x-user-email"]) };
              }
              return undefined;
            },
          },
          json: async () => {
            if (!bodyString) return {};
            try {
              return JSON.parse(bodyString);
            } catch (e) {
              return {};
            }
          },
          text: async () => bodyString,
          formData: async () => {
            return {
              get: (field: string) => {
                if (field === "file") {
                  return {
                    name: "sample-receipt.png",
                    type: "image/png",
                    size: 1024,
                    arrayBuffer: async () => new ArrayBuffer(1024),
                  };
                }
                return null;
              },
            };
          },
        } as any;

        // /api/auth/session
        if (pathname === "/api/auth/session") {
          if (method === "GET" && authSessionRoute.GET) {
            const resp = await authSessionRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && authSessionRoute.POST) {
            const resp = await authSessionRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/chat
        if (pathname === "/api/chat") {
          if (method === "POST" && chatRoute.POST) {
            const resp = await chatRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/orders
        if (pathname === "/api/customer/orders") {
          if (method === "GET" && customerOrdersRoute.GET) {
            const resp = await customerOrdersRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/returns
        if (pathname === "/api/customer/returns") {
          if (method === "GET" && customerReturnsRoute.GET) {
            const resp = await customerReturnsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && customerReturnsRoute.POST) {
            const resp = await customerReturnsRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/feedback
        if (pathname === "/api/customer/feedback") {
          if (method === "POST" && customerFeedbackRoute.POST) {
            const resp = await customerFeedbackRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/conversations
        if (pathname === "/api/customer/conversations") {
          if (method === "GET" && customerConversationsRoute.GET) {
            const resp = await customerConversationsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/notifications
        if (pathname === "/api/customer/notifications") {
          if (method === "GET" && customerNotificationsRoute.GET) {
            const resp = await customerNotificationsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/customer/email-preference
        if (pathname === "/api/customer/email-preference") {
          if (method === "POST" && customerEmailPreferenceRoute.POST) {
            const resp = await customerEmailPreferenceRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/agent/conversations
        if (pathname === "/api/agent/conversations") {
          if (method === "GET" && agentConversationsRoute.GET) {
            const resp = await agentConversationsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && agentConversationsRoute.POST) {
            const resp = await agentConversationsRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/agent/conversations/:id/takeover
        const takeoverMatch = pathname.match(/^\/api\/agent\/conversations\/([^/]+)\/takeover$/);
        if (takeoverMatch) {
          const id = decodeURIComponent(takeoverMatch[1]);
          if (method === "POST" && agentTakeoverRoute.POST) {
            const resp = await agentTakeoverRoute.POST(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
        }

        // /api/agent/conversations/:id/reply
        const replyMatch = pathname.match(/^\/api\/agent\/conversations\/([^/]+)\/reply$/);
        if (replyMatch) {
          const id = decodeURIComponent(replyMatch[1]);
          if (method === "POST" && agentReplyRoute.POST) {
            const resp = await agentReplyRoute.POST(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
        }

        // /api/agent/conversations/:id
        const convDetailMatch = pathname.match(/^\/api\/agent\/conversations\/([^/]+)$/);
        if (convDetailMatch) {
          const id = decodeURIComponent(convDetailMatch[1]);
          if (method === "GET" && agentConversationDetailRoute.GET) {
            const resp = await agentConversationDetailRoute.GET(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
          if (method === "PATCH" && agentConversationDetailRoute.PATCH) {
            const resp = await agentConversationDetailRoute.PATCH(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
          if (method === "POST" && agentConversationDetailRoute.POST) {
            const resp = await agentConversationDetailRoute.POST(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
        }

        // /api/agent/tickets/:id
        const ticketDetailMatch = pathname.match(/^\/api\/agent\/tickets\/([^/]+)$/);
        if (ticketDetailMatch) {
          const id = decodeURIComponent(ticketDetailMatch[1]);
          if (method === "PATCH" && agentTicketsDetailRoute.PATCH) {
            const resp = await agentTicketsDetailRoute.PATCH(nextReq, { params: Promise.resolve({ id }) });
            return sendResponse(res, resp);
          }
        }

        // /api/agent/tickets
        if (pathname === "/api/agent/tickets") {
          if (method === "GET" && agentTicketsRoute.GET) {
            const resp = await agentTicketsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && agentTicketsRoute.POST) {
            const resp = await agentTicketsRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/agent/customers
        if (pathname === "/api/agent/customers") {
          if (method === "GET" && agentCustomersRoute.GET) {
            const resp = await agentCustomersRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/analytics
        if (pathname === "/api/admin/analytics") {
          if (method === "GET" && adminAnalyticsRoute.GET) {
            // Pass the real adapted request so the admin role guard can read the session cookie.
            const resp = await adminAnalyticsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/activity
        if (pathname === "/api/admin/activity") {
          if (method === "GET" && adminActivityRoute.GET) {
            const resp = await adminActivityRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/knowledge
        if (pathname === "/api/admin/knowledge") {
          if (method === "GET" && adminKnowledgeRoute.GET) {
            const resp = await adminKnowledgeRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && adminKnowledgeRoute.POST) {
            const resp = await adminKnowledgeRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "PUT" && adminKnowledgeRoute.PUT) {
            const resp = await adminKnowledgeRoute.PUT(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "DELETE" && adminKnowledgeRoute.DELETE) {
            const resp = await adminKnowledgeRoute.DELETE(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/emails
        if (pathname === "/api/admin/emails") {
          if (method === "GET" && adminEmailsRoute.GET) {
            const resp = await adminEmailsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/settings
        if (pathname === "/api/admin/settings") {
          if (method === "GET" && adminSettingsRoute.GET) {
            // Pass the real adapted request so the admin role guard can read the session cookie.
            const resp = await adminSettingsRoute.GET(nextReq);
            return sendResponse(res, resp);
          }
          if (method === "POST" && adminSettingsRoute.POST) {
            const resp = await adminSettingsRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/admin/dispatch
        if (pathname === "/api/admin/dispatch") {
          if (method === "POST" && adminDispatchRoute.POST) {
            const resp = await adminDispatchRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // /api/upload
        if (pathname === "/api/upload") {
          if (method === "POST" && uploadRoute.POST) {
            const resp = await uploadRoute.POST(nextReq);
            return sendResponse(res, resp);
          }
        }

        // Unmatched API route — include the method so a wrong-verb request
        // (e.g. DELETE on a GET-only path) is distinguishable from a bad URL.
        console.warn(`[API] Unmatched request: ${method} ${pathname}`);
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ success: false, error: `API route not found: ${method} ${pathname}` })
        );
      }

      // 3. UI Application Shell (HTML) for all client routes
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      if (method === "HEAD") return res.end();
      res.end(HTML_SHELL);
    } catch (err: any) {
      console.error("Server request handling error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
      }
      try {
        res.end(JSON.stringify({ success: false, error: err?.message || "Internal Server Error" }));
      } catch {
        // Response already terminated (e.g. mid-stream) — nothing to send.
        res.destroy();
      }
    }
  });

  // Fail fast with a readable message instead of an unhandled EADDRINUSE stack.
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${PORT} is already in use. Stop the other process or set PORT to a free port.`
      );
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`✨ NovaMart Support OS Server Online!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`👤 Customer Portal: http://localhost:${PORT}/customer`);
    console.log(`🎧 Agent Workspace: http://localhost:${PORT}/agent`);
    console.log(`🛡️ Admin Command Center: http://localhost:${PORT}/admin`);
    console.log(`==================================================\n`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}
