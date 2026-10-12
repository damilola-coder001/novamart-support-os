// GET /api/agent/conversations - Real-time Inbox Endpoint
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, NEEDS_HUMAN, AI_HANDLING, AGENT_ACTIVE, RESOLVED
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const cursor = searchParams.get("cursor");

    const where: any = {};

    if (filter === "NEEDS_HUMAN") {
      where.status = "NEEDS_HUMAN";
    } else if (filter === "AI_HANDLING") {
      where.status = "AI_HANDLING";
    } else if (filter === "AGENT_ACTIVE") {
      where.status = "AGENT_ACTIVE";
    } else if (filter === "RESOLVED") {
      where.status = { in: ["RESOLVED", "CLOSED"] };
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search && search.trim() !== "") {
      where.OR = [
        { conversationNumber: { contains: search } },
        { summary: { contains: search } },
        { customer: { user: { name: { contains: search } } } },
        { customer: { user: { email: { contains: search } } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        customer: {
          include: {
            user: true,
            orders: { take: 1, orderBy: { createdAt: "desc" } },
          },
        },
        assignedAgent: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        tickets: true,
      },
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit,
      skip: offset > 0 ? offset : undefined,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Compute stats for top inbox badges
    const totalCount = await prisma.conversation.count();
    const needsHumanCount = await prisma.conversation.count({ where: { status: "NEEDS_HUMAN" } });
    const aiHandlingCount = await prisma.conversation.count({ where: { status: "AI_HANDLING" } });
    const activeCount = await prisma.conversation.count({ where: { status: "AGENT_ACTIVE" } });
    const resolvedCount = await prisma.conversation.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } });

    return NextResponse.json({
      success: true,
      conversations,
      stats: {
        total: totalCount,
        needsHuman: needsHumanCount,
        aiHandling: aiHandlingCount,
        active: activeCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error("Agent inbox error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { customerId, ticketId, subject } = body;

    // Check if customer already has an active conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId,
        status: { in: ["NEEDS_HUMAN", "AI_HANDLING", "AGENT_ACTIVE"] },
      },
      include: {
        customer: { include: { user: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      const count = await prisma.conversation.count();
      const conversationNumber = `CONV-${1000 + count + 1}`;

      conversation = await prisma.conversation.create({
        data: {
          conversationNumber,
          customerId,
          status: "AGENT_ACTIVE",
          priority: "HIGH",
          channel: "CHAT",
          category: "SUPPORT_TICKET",
          summary: subject || "Direct agent support conversation",
          assignedAgentId: "agent-01",
        },
        include: {
          customer: { include: { user: true } },
        },
      });
    } else {
      // Update status to AGENT_ACTIVE
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "AGENT_ACTIVE",
          assignedAgentId: "agent-01",
        },
        include: {
          customer: { include: { user: true } },
        },
      });
    }

    // Link ticket to conversation if ticketId provided
    if (ticketId) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { conversationId: conversation.id },
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 });
  }
}
