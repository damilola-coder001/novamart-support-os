// NovaMart - Intent Classification Engine
import { IntentResult, IntentType } from "@/types";

export function classifyCustomerIntent(messageText: string): IntentResult {
  const text = messageText.toLowerCase();

  // 1. Explicit Human Agent Request
  if (
    text.includes("human") ||
    text.includes("agent") ||
    text.includes("real person") ||
    text.includes("representative") ||
    text.includes("operator") ||
    text.includes("talk to someone") ||
    text.includes("speak to a person") ||
    text.includes("customer service rep")
  ) {
    return {
      intent: "HUMAN_AGENT",
      confidence: 0.98,
      risk: "LOW",
      suggestedAction: "ESCALATE_HUMAN",
      entities: { requestedHuman: true },
      reasoning: "Customer explicitly requested human representative.",
    };
  }

  // 2. Urgent Payment / Billing Problem / Double Charge
  if (
    text.includes("charged twice") ||
    text.includes("double charge") ||
    text.includes("duplicate charge") ||
    text.includes("fraud") ||
    text.includes("unauthorized charge") ||
    text.includes("overcharged") ||
    text.includes("billing error") ||
    text.includes("card was charged twice")
  ) {
    const orderMatch = messageText.match(/ORD-\d{4,6}/i);
    return {
      intent: "PAYMENT_PROBLEM",
      confidence: 0.96,
      risk: "CRITICAL",
      suggestedAction: "ESCALATE_HUMAN",
      entities: { orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined },
      reasoning: "Financial / duplicate billing complaint detected. Requires immediate human specialist review.",
    };
  }

  // 3. Return Request
  if (
    text.includes("return") ||
    text.includes("exchange") ||
    text.includes("send back") ||
    text.includes("replace") ||
    text.includes("replacement") ||
    text.includes("wrong size") ||
    text.includes("damaged item") ||
    text.includes("broken") ||
    text.includes("defective")
  ) {
    const orderMatch = messageText.match(/ORD-\d{4,6}/i);
    return {
      intent: "RETURN_REQUEST",
      confidence: 0.94,
      risk: "LOW",
      suggestedAction: "TOOL_LOOKUP",
      entities: {
        orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined,
        reason: text.includes("defective") || text.includes("broken") ? "Damaged / Defective" : "Customer return request",
      },
      reasoning: "Return or exchange requested. Checking order eligibility and 30-day window.",
    };
  }

  // 4. Refund Status / Inquiry
  if (text.includes("refund") || text.includes("money back") || text.includes("credit back")) {
    const orderMatch = messageText.match(/ORD-\d{4,6}/i);
    return {
      intent: "REFUND_STATUS",
      confidence: 0.93,
      risk: "MEDIUM",
      suggestedAction: "TOOL_LOOKUP",
      entities: { orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined },
      reasoning: "Refund status lookup requested.",
    };
  }

  // 5. Order Status & Delivery Tracking
  if (
    text.includes("where is my order") ||
    text.includes("track") ||
    text.includes("tracking") ||
    text.includes("status of order") ||
    text.includes("when will it arrive") ||
    text.includes("has my order shipped") ||
    text.includes("delivery date") ||
    text.includes("order status") ||
    /ORD-\d{4,6}/i.test(messageText)
  ) {
    const orderMatch = messageText.match(/ORD-\d{4,6}/i);
    return {
      intent: "ORDER_STATUS",
      confidence: 0.97,
      risk: "LOW",
      suggestedAction: "TOOL_LOOKUP",
      entities: { orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined },
      reasoning: "Customer asking for order tracking, shipment status or delivery estimate.",
    };
  }

  // 6. Delivery Delay
  if (text.includes("delayed") || text.includes("late") || text.includes("hasn't arrived") || text.includes("not delivered")) {
    const orderMatch = messageText.match(/ORD-\d{4,6}/i);
    return {
      intent: "DELIVERY_DELAY",
      confidence: 0.91,
      risk: "MEDIUM",
      suggestedAction: "TOOL_LOOKUP",
      entities: { orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined },
      reasoning: "Customer reports shipment delay. Checking carrier trace and dispatch logs.",
    };
  }

  // 7. General Policy / Shipping / FAQs
  if (
    text.includes("shipping policy") ||
    text.includes("how long does shipping take") ||
    text.includes("return policy") ||
    text.includes("warranty") ||
    text.includes("cancel order") ||
    text.includes("hours") ||
    text.includes("international")
  ) {
    return {
      intent: "GENERAL_FAQ",
      confidence: 0.95,
      risk: "LOW",
      suggestedAction: "AUTO_RESOLVE",
      entities: {},
      reasoning: "Store policy or FAQ inquiry. Knowledge base lookup recommended.",
    };
  }

  // 8. Product Question
  if (text.includes("product") || text.includes("specification") || text.includes("specs") || text.includes("compatible") || text.includes("battery") || text.includes("waterproof")) {
    return {
      intent: "PRODUCT_QUESTION",
      confidence: 0.88,
      risk: "LOW",
      suggestedAction: "AUTO_RESOLVE",
      entities: {},
      reasoning: "Product specifications or compatibility question.",
    };
  }

  // 9. Serious Complaint
  if (text.includes("terrible") || text.includes("awful") || text.includes("unacceptable") || text.includes("lawyer") || text.includes("sue") || text.includes("scam")) {
    return {
      intent: "COMPLAINT",
      confidence: 0.92,
      risk: "HIGH",
      suggestedAction: "ESCALATE_HUMAN",
      entities: {},
      reasoning: "Strong dissatisfaction or legal mention. Route to human supervisor immediately.",
    };
  }

  // 10. Account Issue
  if (text.includes("password") || text.includes("login") || text.includes("account") || text.includes("email preference")) {
    return {
      intent: "ACCOUNT_PROBLEM",
      confidence: 0.89,
      risk: "LOW",
      suggestedAction: "AUTO_RESOLVE",
      entities: {},
      reasoning: "Customer account profile or settings inquiry.",
    };
  }

  // Default Unknown
  return {
    intent: "UNKNOWN",
    confidence: 0.65,
    risk: "LOW",
    suggestedAction: "REQUEST_CLARIFICATION",
    entities: {},
    reasoning: "General message. Requesting additional context or clarification.",
  };
}
