// POST /api/agent/conversations/[id]/reply
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";
import { sendAutomatedEmail } from "@/lib/email/service";
import { logActivity } from "@/lib/activity/logger";
import { eventHub } from "@/lib/events/hub";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { content, resolveAfterReply } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "Reply content is required" }, { status: 400 });
    }

    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;
    const session = gate.session;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const agentName = conversation.assignedAgent?.user.name || session?.name || "Support Specialist";

    // 1. Record Agent Message
    const agentMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "AGENT",
        senderName: agentName,
        content: content.trim(),
      },
    });

    // Notify real-time hub
    eventHub.notifyNewMessage(conversation.id, agentMsg);
    if (resolveAfterReply) {
      eventHub.notifyStatusChange(conversation.id, "RESOLVED");
    }

    // 2. Update conversation status
    const newStatus = resolveAfterReply ? "RESOLVED" : "AGENT_ACTIVE";
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: newStatus,
        ...(resolveAfterReply && { resolvedAt: new Date() }),
        updatedAt: new Date(),
      },
    });

    // 3. Log Activity
    await logActivity({
      actorType: "AGENT",
      actorId: session?.agentId || null,
      actorName: agentName,
      action: resolveAfterReply ? "TICKET_RESOLVED" : "MESSAGE_SENT",
      entityType: "Conversation",
      entityId: conversation.id,
      details: { reply: content.slice(0, 100), resolved: resolveAfterReply },
    });

    // 4. Send email notification if customer opted in
    await sendAutomatedEmail({
      customerId: conversation.customerId,
      recipientEmail: conversation.customer.user.email,
      recipientName: conversation.customer.user.name,
      templateType: resolveAfterReply ? "ISSUE_RESOLVED" : "AGENT_REPLY",
      subject: resolveAfterReply
        ? `Your NovaMart Support Request [${conversation.conversationNumber}] has been Resolved`
        : `New message from ${agentName} regarding [${conversation.conversationNumber}]`,
      metadata: {
        agentName,
        messagePreview: content.slice(0, 200),
        ticketNumber: conversation.conversationNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: agentMsg,
      status: newStatus,
    });
  } catch (error) {
    console.error("Agent reply error:", error);
    return NextResponse.json({ success: false, error: "Failed to send agent reply" }, { status: 500 });
  }
}
