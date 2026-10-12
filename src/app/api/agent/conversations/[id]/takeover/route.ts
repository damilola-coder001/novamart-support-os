// POST /api/agent/conversations/[id]/takeover
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity/logger";
import { eventHub } from "@/lib/events/hub";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;
    const session = gate.session;

    const { id } = await params;

    const agent = await prisma.supportAgent.findFirst({
      where: session?.agentId ? { id: session.agentId } : {},
      include: { user: true },
    });

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: "AGENT_ACTIVE",
        assignedAgentId: agent?.id || null,
        updatedAt: new Date(),
      },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    eventHub.notifyAgentTakeover(conversation.id, agent?.user || { name: "Alex Rivera" });

    // Log Activity
    await logActivity({
      actorType: "AGENT",
      actorId: agent?.id || null,
      actorName: agent?.user.name || "Support Agent",
      action: "AGENT_TAKEOVER",
      entityType: "Conversation",
      entityId: conversation.id,
      details: { agentName: agent?.user.name },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Takeover error:", error);
    return NextResponse.json({ success: false, error: "Failed to take over conversation" }, { status: 500 });
  }
}
