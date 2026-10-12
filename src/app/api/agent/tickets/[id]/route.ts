// PATCH /api/agent/tickets/[id]
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity/logger";

import { eventHub } from "@/lib/events/hub";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { id } = await params;
    const body = await req.json();
    const { status, priority, assignedAgentId } = body;

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedAgentId !== undefined && { assignedAgentId }),
        ...(status === "RESOLVED" && { resolvedAt: new Date() }),
      },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    // If ticket was resolved or closed, resolve associated conversations so AI can automatically handle future inquiries
    if (status === "RESOLVED" || status === "CLOSED") {
      if (updated.conversationId) {
        await prisma.conversation.update({
          where: { id: updated.conversationId },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        eventHub.notifyStatusChange(updated.conversationId, "RESOLVED");
      }

      if (updated.customerId) {
        const activeConvs = await prisma.conversation.findMany({
          where: {
            customerId: updated.customerId,
            status: { in: ["NEEDS_HUMAN", "AGENT_ACTIVE"] },
          },
        });
        for (const conv of activeConvs) {
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            },
          });
          eventHub.notifyStatusChange(conv.id, "RESOLVED");
        }
      }
    }

    eventHub.publish("agent:tickets", "TICKET_UPDATED", { ticket: updated });

    await logActivity({
      actorType: "AGENT",
      actorName: updated.assignedAgent?.user.name || "Alex Rivera",
      action: "TICKET_UPDATED",
      entityType: "Ticket",
      entityId: updated.id,
      details: { status, priority },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 });
  }
}
