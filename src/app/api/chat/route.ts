// POST /api/chat - Customer AI Chat Endpoint with Real-Time SSE Streaming & Event Hub
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { processCustomerMessage } from "@/lib/ai/provider";
import { logActivity } from "@/lib/activity/logger";
import { eventHub } from "@/lib/events/hub";

export async function POST(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized customer session" }, { status: 401 });
    }

    const body = await req.json();
    const { message, conversationId, attachments, stream: requestedStream } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    // 1. Get or Create Conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, customerId: session.customerId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      const convCount = await prisma.conversation.count();
      const conversationNumber = `CONV-${400 + convCount + 1}`;
      conversation = await prisma.conversation.create({
        data: {
          conversationNumber,
          customerId: session.customerId,
          status: "AI_HANDLING",
          category: "GENERAL",
          priority: "MEDIUM",
        },
        include: { messages: true },
      });
    }

    // 2. Record Customer Message
    const customerMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        senderName: session.name,
        content: message.trim(),
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Notify realtime hub of customer message
    eventHub.notifyNewMessage(conversation.id, customerMsg);

    // Log Activity
    await logActivity({
      actorType: "CUSTOMER",
      actorId: session.customerId,
      actorName: session.name,
      action: "MESSAGE_SENT",
      entityType: "Conversation",
      entityId: conversation.id,
      details: { message: message.trim() },
    });

    // If conversation was resolved or closed, automatically reactivate it for AI handling!
    if (conversation.status === "RESOLVED" || conversation.status === "CLOSED") {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "ACTIVE",
          updatedAt: new Date(),
        },
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 20 },
          tickets: true,
        },
      });
      eventHub.notifyStatusChange(conversation.id, "ACTIVE");
    }

    // Notify agents if there is an active assigned ticket
    const openTickets = await prisma.ticket.findMany({
      where: {
        conversationId: conversation.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    });
    if (openTickets.length > 0) {
      await prisma.notification.create({
        data: {
          recipientRole: "SUPPORT_AGENT",
          title: `💬 New message from ${session.name}`,
          message: message.slice(0, 100),
          type: "NEW_CONVERSATION",
          link: `/agent?conv=${conversation.conversationNumber}`,
        },
      });
    }

    // 3. Process with AI Provider & Intent Engine
    const history = (conversation.messages || []).map((m: any) => ({
      role: m.senderType === "CUSTOMER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    // If client requested SSE streaming
    if (requestedStream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      // Run AI processing in background via AI Concurrency Queue
      (async () => {
        try {
          const { aiQueue } = await import("@/lib/ai/queue");
          const aiResult = await aiQueue.enqueue(
            {
              customerId: session.customerId!,
              conversationId: conversation.id,
              messageText: message.trim(),
              vipTier: session.vipTier,
            },
            () =>
              processCustomerMessage({
                customerId: session.customerId!,
                customerName: session.name,
                conversationId: conversation.id,
                messageText: message.trim(),
                chatHistory: history,
                onProgress: (evt) => {
                  writer.write(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
                },
              })
          );

          // 4. Record AI Message in database
          const aiMsg = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderType: "AI",
              senderName: "NovaMart AI Assistant",
              content: aiResult.content,
              toolCalls: aiResult.toolCalls.length > 0 ? JSON.stringify(aiResult.toolCalls) : null,
              metadata: JSON.stringify({
                intent: aiResult.intent,
                confidence: aiResult.confidence,
                risk: aiResult.risk,
                escalated: aiResult.escalated,
                ticketNumber: aiResult.ticketNumber,
              }),
            },
          });

          // 5. Update Conversation State
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              status: aiResult.escalated ? "NEEDS_HUMAN" : "AI_HANDLING",
              category: aiResult.intent,
              aiIntent: aiResult.intent,
              aiConfidence: aiResult.confidence,
              priority: aiResult.risk === "CRITICAL" || aiResult.risk === "HIGH" ? "URGENT" : "MEDIUM",
              summary: `Customer inquired about ${aiResult.intent}. AI Confidence: ${Math.round(aiResult.confidence * 100)}%. Status: ${aiResult.escalated ? "Escalated to human" : "AI Handled"}.`,
              updatedAt: new Date(),
            },
          });

          // Notify realtime hub
          eventHub.notifyNewMessage(conversation.id, aiMsg);
          if (aiResult.escalated) {
            eventHub.notifyStatusChange(conversation.id, "NEEDS_HUMAN");
          }

          // Emit completion event
          writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                conversationId: conversation.id,
                message: aiMsg,
                aiResult,
              })}\n\n`
            )
          );
        } catch (err: any) {
          writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", error: err?.message })}\n\n`));
        } finally {
          writer.close();
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Standard Non-Streaming JSON Fallback with AI Concurrency Queue
    const { aiQueue } = await import("@/lib/ai/queue");
    const aiResult = await aiQueue.enqueue(
      {
        customerId: session.customerId!,
        conversationId: conversation.id,
        messageText: message.trim(),
        vipTier: session.vipTier,
      },
      () =>
        processCustomerMessage({
          customerId: session.customerId!,
          customerName: session.name,
          conversationId: conversation.id,
          messageText: message.trim(),
          chatHistory: history,
        })
    );

    // 4. Record AI Message
    const aiMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "AI",
        senderName: "NovaMart AI Assistant",
        content: aiResult.content,
        toolCalls: aiResult.toolCalls.length > 0 ? JSON.stringify(aiResult.toolCalls) : null,
        metadata: JSON.stringify({
          intent: aiResult.intent,
          confidence: aiResult.confidence,
          risk: aiResult.risk,
          escalated: aiResult.escalated,
          ticketNumber: aiResult.ticketNumber,
        }),
      },
    });

    // 5. Update Conversation State
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: aiResult.escalated ? "NEEDS_HUMAN" : "AI_HANDLING",
        category: aiResult.intent,
        aiIntent: aiResult.intent,
        aiConfidence: aiResult.confidence,
        priority: aiResult.risk === "CRITICAL" || aiResult.risk === "HIGH" ? "URGENT" : "MEDIUM",
        summary: `Customer inquired about ${aiResult.intent}. AI Confidence: ${Math.round(aiResult.confidence * 100)}%. Status: ${aiResult.escalated ? "Escalated to human" : "AI Handled"}.`,
        updatedAt: new Date(),
      },
    });

    eventHub.notifyNewMessage(conversation.id, aiMsg);
    if (aiResult.escalated) {
      eventHub.notifyStatusChange(conversation.id, "NEEDS_HUMAN");
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      customerMessage: customerMsg,
      aiMessage: aiMsg,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      escalated: aiResult.escalated,
      ticketCreated: aiResult.ticketCreated,
      ticketNumber: aiResult.ticketNumber,
      toolCalls: aiResult.toolCalls,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process chat message" }, { status: 500 });
  }
}
