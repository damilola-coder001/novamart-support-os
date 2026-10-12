// POST /api/admin/dispatch
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { eventHub } from "@/lib/events/hub";
import { logActivity } from "@/lib/activity/logger";

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    const { title, message, priority, agentName } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }

    const dispatchTitle = title ? title.trim() : "Operational Directive from Admin";
    const dispatchMessage = message.trim();
    const dispatchPriority = priority || "NORMAL";
    const targetAgent = agentName || "Alex Rivera";

    // Create persistent notification for support agents
    const notification = await prisma.notification.create({
      data: {
        recipientRole: "SUPPORT_AGENT",
        title: `🛡️ [Admin Alert] ${dispatchTitle}`,
        message: dispatchMessage,
        type: dispatchPriority === "URGENT" ? "ESCALATION" : "NEW_CONVERSATION",
        link: "/agent",
      },
    });

    // Real-time broadcast to human agent workspace
    eventHub.publish("agent:inbox", "ADMIN_DISPATCH", {
      id: notification.id,
      title: dispatchTitle,
      message: dispatchMessage,
      priority: dispatchPriority,
      sender: "Eleanor Vance (Ops Lead & Admin)",
      targetAgent,
      createdAt: new Date().toISOString(),
    });

    // Audit log
    await logActivity({
      actorType: "ADMIN",
      actorName: "Eleanor Vance",
      action: "STAFF_DISPATCH",
      entityType: "Agent",
      details: { title: dispatchTitle, message: dispatchMessage, priority: dispatchPriority, targetAgent },
    });

    return NextResponse.json({
      success: true,
      message: "Staff alert dispatched successfully",
      notification,
    });
  } catch (error) {
    console.error("Admin dispatch error:", error);
    return NextResponse.json({ success: false, error: "Failed to dispatch staff alert" }, { status: 500 });
  }
}
