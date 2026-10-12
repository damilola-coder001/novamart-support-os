// GET /api/events - Real-time SSE Channel
import { NextRequest, NextResponse } from "next/server";
import { eventHub } from "@/lib/events/hub";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "*";

  // In standard edge/Node runtime, return SSE stream
  let unsubscribe: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      // Send connected event
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "CONNECTED", channel })}\n\n`));

      unsubscribe = eventHub.subscribe(channel, (event) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream might be closed
        }
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
