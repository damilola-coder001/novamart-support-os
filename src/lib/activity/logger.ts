// NovaMart - Central Activity Logger
import { prisma } from "@/lib/prisma";

export interface LogParams {
  actorType: "CUSTOMER" | "AI" | "AGENT" | "ADMIN" | "SYSTEM";
  actorId?: string | null;
  actorName: string;
  action:
    | "LOGIN"
    | "MESSAGE_SENT"
    | "AI_INTENT_CLASSIFIED"
    | "AI_TOOL_CALLED"
    | "AI_ESCALATED"
    | "TICKET_CREATED"
    | "TICKET_ASSIGNED"
    | "TICKET_UPDATED"
    | "TICKET_RESOLVED"
    | "AGENT_TAKEOVER"
    | "RETURN_CREATED"
    | "REFUND_ISSUED"
    | "EMAIL_SENT"
    | "EMAIL_PREFERENCE_UPDATED"
    | "CSAT_SUBMITTED"
    | "STAFF_DISPATCH";
  entityType?: "Conversation" | "Ticket" | "Order" | "ReturnRequest" | "User" | "EmailEvent" | "KnowledgeArticle" | "Product" | "Agent";
  entityId?: string | null;
  details?: Record<string, any>;
}

export async function logActivity(params: LogParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId || null,
        actorName: params.actorName,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}
