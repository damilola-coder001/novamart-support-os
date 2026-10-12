// GET & PATCH /api/agent/tickets
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity/logger";
import { eventHub } from "@/lib/events/hub";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
        conversation: true,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error("Tickets fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { id, status, priority, assignedAgentId, resolutionNote } = body;

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedAgentId !== undefined && { assignedAgentId: assignedAgentId || null }),
        ...(resolutionNote && { resolutionNote }),
        ...(status === "RESOLVED" && { resolvedAt: new Date() }),
      },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    if (status === "RESOLVED" || status === "CLOSED") {
      if (updated.conversationId) {
        await prisma.conversation.update({
          where: { id: updated.conversationId },
          data: { status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() },
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
            data: { status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() },
          });
          eventHub.notifyStatusChange(conv.id, "RESOLVED");
        }
      }
    }

    await logActivity({
      actorType: "AGENT",
      actorName: updated.assignedAgent?.user.name || "Support Agent",
      action: status === "RESOLVED" ? "TICKET_RESOLVED" : "TICKET_UPDATED",
      entityType: "Ticket",
      entityId: updated.id,
      details: { ticketNumber: updated.ticketNumber, status, priority },
    });

    eventHub.publish("agent:tickets", "TICKET_UPDATED", { ticket: updated, status });
    eventHub.publish("agent:tickets", "STATUS_CHANGE", { ticket: updated, status });
    eventHub.publish("agent:inbox", "STATUS_CHANGE", { ticket: updated, status });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Ticket update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { title, description, priority, category, customerId, conversationId } = body;

    const count = await prisma.ticket.count();
    const ticketNumber = `TCK-${8800 + count + 1}`;

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: title || "Manual Support Escalation",
        description: description || "",
        priority: priority || "HIGH",
        category: category || "GENERAL",
        status: "OPEN",
        customerId: customerId || "cust-01",
        conversationId: conversationId || null,
        assignedAgentId: "agent-01",
      },
      include: {
        customer: { include: { user: true } },
        assignedAgent: { include: { user: true } },
      },
    });

    await logActivity({
      actorType: "AGENT",
      actorName: "Alex Rivera",
      action: "TICKET_CREATED",
      entityType: "Ticket",
      entityId: newTicket.id,
      details: { ticketNumber, priority, title },
    });

    eventHub.notifyTicketCreated(newTicket);

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 });
  }
}

