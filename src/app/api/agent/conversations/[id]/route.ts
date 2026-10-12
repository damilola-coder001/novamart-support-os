// GET & PATCH /api/agent/conversations/[id]
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";
import { generateCopilotInsights } from "@/lib/ai/copilot";
import { logActivity } from "@/lib/activity/logger";
import { eventHub } from "@/lib/events/hub";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [{ id }, { conversationNumber: id }],
      },
      include: {
        customer: {
          include: {
            user: true,
            orders: {
              include: {
                items: { include: { product: true } },
                payments: true,
                returns: true,
              },
              orderBy: { createdAt: "desc" },
            },
            returns: {
              include: { order: true },
              orderBy: { createdAt: "desc" },
            },
            tickets: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        assignedAgent: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "asc" },
        },
        tickets: {
          include: { assignedAgent: { include: { user: true } } },
        },
        feedback: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Generate real-time AI Copilot insights for the human agent
    const copilotInsights = await generateCopilotInsights(conversation.id);

    return NextResponse.json({
      success: true,
      conversation,
      copilotInsights,
    });
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch conversation details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { id } = await params;
    const body = await req.json();
    const { status, priority, assignedAgentId, summary, action } = body;

    // Handle TAKE_OVER action
    if (action === "TAKE_OVER") {
      const updated = await prisma.conversation.update({
        where: { id },
        data: {
          status: "AGENT_ACTIVE",
          assignedAgentId: "agent-01",
        },
      });
      eventHub.notifyStatusChange(id, "AGENT_ACTIVE");
      return NextResponse.json({ success: true, conversation: updated });
    }

    // Handle HANDOVER_AI action
    if (action === "HANDOVER_AI") {
      const updated = await prisma.conversation.update({
        where: { id },
        data: {
          status: "ACTIVE",
          assignedAgentId: null,
          updatedAt: new Date(),
        },
      });
      eventHub.notifyStatusChange(id, "ACTIVE");
      return NextResponse.json({ success: true, conversation: updated });
    }

    const effectiveStatus = action === "RESOLVE" ? "RESOLVED" : status;

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(effectiveStatus && { status: effectiveStatus }),
        ...(priority && { priority }),
        ...(assignedAgentId !== undefined && { assignedAgentId: assignedAgentId || null }),
        ...(summary && { summary }),
        ...(effectiveStatus === "RESOLVED" && { resolvedAt: new Date() }),
      },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    if (effectiveStatus === "RESOLVED") {
      const tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { conversationId: id },
            ...(updated.customerId ? [{ customerId: updated.customerId }] : []),
          ],
        },
      });
      for (const t of tickets) {
        if (t.status !== "RESOLVED") {
          await prisma.ticket.update({
            where: { id: t.id },
            data: { status: "RESOLVED", resolvedAt: new Date() },
          });
        }
      }
      eventHub.notifyStatusChange(id, "RESOLVED");
      eventHub.publish("agent:tickets", "TICKET_UPDATED", { conversationId: id, customerId: updated.customerId, status: "RESOLVED" });
      eventHub.publish("agent:inbox", "STATUS_CHANGE", { conversationId: id, status: "RESOLVED" });
    } else if (effectiveStatus) {
      eventHub.notifyStatusChange(id, effectiveStatus);
    }

    await logActivity({
      actorType: "AGENT",
      actorName: updated.assignedAgent?.user.name || "Support Agent",
      action: "TICKET_UPDATED",
      entityType: "Conversation",
      entityId: updated.id,
      details: { status: effectiveStatus, priority, assignedAgentId },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    console.error("Conversation update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }

    const newMsg = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "AGENT",
        senderName: "Alex Rivera",
        content: message,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        status: "AGENT_ACTIVE",
        assignedAgentId: "agent-01",
        updatedAt: new Date(),
      },
    });

    // Notify real-time event bus so message reflects instantly on customer portal
    eventHub.notifyNewMessage(id, newMsg);

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    console.error("Agent post message error:", error);
    return NextResponse.json({ success: false, error: "Failed to send agent reply" }, { status: 500 });
  }
}

