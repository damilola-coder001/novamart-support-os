// NovaMart - AI Support Agent Copilot Engine
import { CopilotInsight, IntentType, VipTier } from "@/types";
import { prisma } from "@/lib/prisma";

export async function generateCopilotInsights(conversationId: string): Promise<CopilotInsight> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: {
        include: {
          user: true,
          orders: {
            include: { items: { include: { product: true } }, returns: true, payments: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          tickets: { orderBy: { createdAt: "desc" }, take: 5 },
          returns: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
      tickets: true,
    },
  });

  if (!conversation) {
    return {
      suggestedReply: "Hello! How can I assist you with your NovaMart account today?",
      summary: "No conversation history found.",
      intent: "UNKNOWN",
      confidence: 0.8,
      risk: "LOW",
      customerVipTier: "STANDARD",
      recommendedActions: [],
      policyNotes: [],
      warnings: [],
    };
  }

  const customer = conversation.customer;
  const vipTier = (customer.vipTier as VipTier) || "STANDARD";
  const recentOrder = customer.orders[0];
  const intent = (conversation.aiIntent as IntentType) || "GENERAL_FAQ";
  const priority = conversation.priority;

  // Compile conversation summary
  const lastCustomerMessage = [...conversation.messages].reverse().find((m) => m.senderType === "CUSTOMER");
  const summary = conversation.summary ||
    `Customer ${customer.user.name} (${vipTier} VIP) inquired regarding ${intent}. Recent order: ${recentOrder ? recentOrder.orderNumber : "None"}. Current status: ${conversation.status}.`;

  const warnings: string[] = [];
  const policyNotes: string[] = [];
  const recommendedActions: CopilotInsight["recommendedActions"] = [];

  // VIP alert
  if (vipTier === "PLATINUM" || vipTier === "GOLD") {
    warnings.push(`⭐ Priority Customer: ${customer.user.name} is a ${vipTier} Tier VIP member.`);
  }

  // Logic based on Intent and Order State
  let suggestedReply = `Hello ${customer.user.name.split(" ")[0]}! Thank you for contacting NovaMart Support. I've reviewed your account history and would be glad to help resolve this for you right away.`;

  if (intent === "PAYMENT_PROBLEM" || priority === "URGENT") {
    warnings.push("⚠️ High Priority: Potential duplicate charge or billing dispute. Verify transaction ID before refunding.");
    policyNotes.push("Policy: Duplicate authorizations can be voided immediately with Manager authorization.");
    
    suggestedReply = `Hello ${customer.user.name.split(" ")[0]}, I apologize for the confusion regarding the duplicate charge on order ${recentOrder?.orderNumber || ""}. I have reviewed our payment processor records and voided the duplicate authorization hold. The pending charge should drop from your online statement within 24-48 hours.`;
    
    recommendedActions.push(
      { label: "Void Duplicate Charge", action: "VOID_CHARGE", variant: "destructive" },
      { label: "Issue $25 Store Credit", action: "ISSUE_CREDIT", variant: "secondary" },
      { label: "Resolve Ticket", action: "RESOLVE_TICKET", variant: "default" }
    );
  } else if (intent === "RETURN_REQUEST") {
    policyNotes.push("Policy: 30-day free return window. Prepaid FedEx labels provided.");
    if (recentOrder) {
      const isDelivered = recentOrder.status === "DELIVERED";
      if (isDelivered) {
        suggestedReply = `Hi ${customer.user.name.split(" ")[0]}! I've checked order ${recentOrder.orderNumber}. Everything is approved for a full return. I've emailed you a prepaid FedEx shipping label. Once scanned by FedEx, your refund will process automatically.`;
        recommendedActions.push(
          { label: "Approve Return & Send Label", action: "APPROVE_RETURN", variant: "default" },
          { label: "Exchange for Different Size", action: "EXCHANGE_ITEM", variant: "secondary" },
          { label: "Resolve Conversation", action: "RESOLVE_TICKET", variant: "outline" }
        );
      }
    }
  } else if (intent === "ORDER_STATUS" || intent === "DELIVERY_DELAY") {
    policyNotes.push("Policy: Ground shipping 3-5 days. Trace inquiries available for delays over 48h.");
    if (recentOrder) {
      suggestedReply = `Hello ${customer.user.name.split(" ")[0]}! Your order ${recentOrder.orderNumber} is currently ${recentOrder.status.toLowerCase()}${recentOrder.trackingNumber ? ` via ${recentOrder.carrier} (Tracking: ${recentOrder.trackingNumber})` : ""}. Estimated delivery is on schedule.`;
      recommendedActions.push(
        { label: "Resend Tracking Link", action: "RESEND_TRACKING", variant: "secondary" },
        { label: "Expedite Shipment", action: "EXPEDITE_SHIPPING", variant: "default" }
      );
    }
  } else if (intent === "HUMAN_AGENT") {
    suggestedReply = `Hello ${customer.user.name.split(" ")[0]}, I'm Alex from the NovaMart Senior Support Team. I have full context of your chat with our AI assistant and I'm here to personally take care of this for you. How can I help?`;
    recommendedActions.push(
      { label: "Take Over Conversation", action: "TAKE_OVER", variant: "default" },
      { label: "Assign to Tier 2 Lead", action: "REASSIGN", variant: "secondary" }
    );
  } else {
    suggestedReply = `Hi ${customer.user.name.split(" ")[0]}, thanks for reaching out! How can I assist you with your order or account today?`;
    recommendedActions.push(
      { label: "Send General Reply", action: "SEND_REPLY", variant: "default" },
      { label: "Close Ticket", action: "RESOLVE_TICKET", variant: "outline" }
    );
  }

  return {
    suggestedReply,
    summary,
    intent,
    confidence: conversation.aiConfidence || 0.95,
    risk: priority === "URGENT" ? "CRITICAL" : priority === "HIGH" ? "HIGH" : "LOW",
    customerVipTier: vipTier,
    recommendedActions,
    policyNotes,
    warnings,
  };
}
