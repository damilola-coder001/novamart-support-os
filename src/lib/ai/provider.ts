// NovaMart - OpenRouter AI Provider & Intelligent Fallback Engine
import { AIResponsePayload, IntentResult, ToolExecution } from "@/types";
import { classifyCustomerIntent } from "@/lib/ai/intents";
import { CUSTOMER_SUPPORT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  getMyOrders,
  getOrderDetails,
  checkReturnEligibility,
  createReturnRequest,
  getRefundStatus,
  getProductDetails,
  getKnowledgeArticle,
  createSupportTicket,
  updateEmailPreference,
} from "@/lib/ai/tools";
import { logActivity } from "@/lib/activity/logger";

export interface ChatProgressEvent {
  type: "thinking" | "tool_call" | "token";
  data: any;
}

export interface GenerateChatParams {
  customerId: string;
  customerName: string;
  conversationId: string;
  messageText: string;
  chatHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  onProgress?: (event: ChatProgressEvent) => void;
}

// ─── OpenRouter Configuration ────────────────────────────────────────────────
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = 6000;
const MAX_TOOL_ROUNDS = 4;
// The previous default (anthropic/claude-3.5-sonnet) has been removed from
// OpenRouter — every request 404s when OPENROUTER_MODEL is unset. Default to a
// free-model chain instead; OPENROUTER_MODEL always overrides this.
const DEFAULT_OPENROUTER_MODEL = "minimax/minimax-m3:free,openrouter/free";

interface OpenRouterFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// Controlled tool schemas exposed to the OpenRouter model. Every tool is
// executed server-side via dispatchTool() with the authenticated customerId
// injected by the backend — the model can never directly query the database,
// and every customer-scoped lookup enforces ownership of the record.
const OPENROUTER_TOOLS: OpenRouterFunctionTool[] = [
  {
    type: "function",
    function: {
      name: "getMyOrders",
      description:
        "List the authenticated customer's orders with status, totals, items, tracking numbers and delivery estimates.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderDetails",
      description:
        "Get detailed information for a specific order by its NovaMart order number (e.g. ORD-9821), including items, payments and any past returns.",
      parameters: {
        type: "object",
        properties: { orderNumber: { type: "string", description: "NovaMart order number, e.g. ORD-9821" } },
        required: ["orderNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkReturnEligibility",
      description: "Verify whether an order qualifies for NovaMart's 30-day free return policy.",
      parameters: {
        type: "object",
        properties: { orderNumber: { type: "string", description: "NovaMart order number, e.g. ORD-9821" } },
        required: ["orderNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createReturnRequest",
      description:
        "Create an official return request for an eligible order. Approves the return, generates a prepaid FedEx label and emails the customer.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "NovaMart order number, e.g. ORD-9821" },
          reason: { type: "string", description: "Reason for the return (e.g. wrong size, defective, changed mind)" },
          itemNames: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of item names to return",
          },
        },
        required: ["orderNumber", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRefundStatus",
      description: "Get the refund status and payment details for an order.",
      parameters: {
        type: "object",
        properties: { orderNumber: { type: "string", description: "NovaMart order number, e.g. ORD-9821" } },
        required: ["orderNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description:
        "Look up a NovaMart product by name or SKU from the current catalog (specifications, price, availability, return policy).",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string", description: "Product name or SKU, e.g. NovaFit Smartwatch Series 4" },
        },
        required: ["productName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getKnowledgeArticle",
      description:
        "Search NovaMart's knowledge base / store policies (shipping, returns, warranty, cancellations, payment).",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search term, e.g. return policy" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "requestHumanAgent",
      description:
        "Escalate the current conversation to a human support specialist. Creates a support ticket and notifies the agent team.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string", description: "Reason for the escalation (optional)" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createSupportTicket",
      description:
        "Create a support ticket for follow-up when a human specialist must review the case (non-urgent general requests).",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["GENERAL", "PAYMENT", "RETURN", "COMPLAINT", "ACCOUNT", "PRODUCT", "OTHER"],
          },
          description: { type: "string", description: "Short summary of why a human is needed" },
        },
        required: ["category", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateEmailPreference",
      description:
        "Update the customer's email notification preference (enable or disable progress emails about orders and tickets).",
      parameters: {
        type: "object",
        properties: { enabled: { type: "boolean", description: "true to enable email updates, false to disable" } },
        required: ["enabled"],
      },
    },
  },
];

export async function processCustomerMessage(params: GenerateChatParams): Promise<AIResponsePayload> {
  const { customerId, customerName, conversationId, messageText, chatHistory, onProgress } = params;

  // 1. Classify Customer Intent
  const intentResult = classifyCustomerIntent(messageText);

  await logActivity({
    actorType: "AI",
    actorName: "NovaMart Intent Engine",
    action: "AI_INTENT_CLASSIFIED",
    entityType: "Conversation",
    entityId: conversationId,
    details: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      risk: intentResult.risk,
      entities: intentResult.entities,
    },
  });

  const apiKey = process.env.OPENROUTER_API_KEY;
  // OPENROUTER_MODEL supports a comma-separated list: the first entry is the
  // primary model and the remaining entries are automatic fallbacks (tried in
  // order when the primary is unavailable, deprecated, or rate-limited).
  const modelChain = (process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  // 2. Execute with OpenRouter if API key is provided, otherwise use the Intelligent Rule-Based Engine
  if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("sk-placeholder")) {
    try {
      const openRouterResponse = await executeOpenRouterChat({
        apiKey,
        modelChain,
        customerId,
        customerName,
        conversationId,
        messageText,
        chatHistory,
        intentResult,
        onProgress,
      });
      openRouterResponse.content = openRouterResponse.content.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "");
      return openRouterResponse;
    } catch (error) {
      // Technical failure — log server-side only (never the API key or internal
      // details) and seamlessly fall back to the Intelligent Local Rule Engine.
      const safeMessage = error instanceof Error ? error.message : "Unknown OpenRouter error";
      console.warn(`[OpenRouter] Request failed (${safeMessage.slice(0, 240)}) — using Intelligent Local Rule Engine fallback.`);
    }
  }

  // 3. Intelligent Local Rule Engine (Ensures 100% reliable demo with full tool calling and escalation)
  const localResponse = await executeLocalRuleEngine({
    customerId,
    customerName,
    conversationId,
    messageText,
    intentResult,
    onProgress,
  });
  if (localResponse.content) {
    localResponse.content = localResponse.content.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "");
  }
  return localResponse;
}

/**
 * Intelligent Local Rule Engine with real database tools and policy synthesis
 */
async function executeLocalRuleEngine(params: {
  customerId: string;
  customerName: string;
  conversationId: string;
  messageText: string;
  intentResult: IntentResult;
  onProgress?: (event: ChatProgressEvent) => void;
}): Promise<AIResponsePayload> {
  const { customerId, customerName, conversationId, messageText, intentResult, onProgress } = params;
  const firstName = customerName.split(" ")[0];
  const toolCalls: ToolExecution[] = [];
  let responseContent = "";
  let escalated = false;
  let ticketCreated = false;
  let ticketNumber: string | undefined;

  switch (intentResult.intent) {
    case "HUMAN_AGENT": {
      escalated = true;
      const ticketRes = await createSupportTicket(
        customerId,
        conversationId,
        "HUMAN_AGENT_REQUEST",
        "HIGH",
        `Customer ${customerName} explicitly requested human representative.`
      );
      ticketCreated = true;
      ticketNumber = ticketRes.ticketNumber;
      toolCalls.push({ tool: "createSupportTicket", args: { category: "HUMAN_AGENT_REQUEST", priority: "HIGH" }, result: ticketRes });

      responseContent = `I understand! I've connected your request with our support team and created ticket ${ticketNumber}. A support specialist will join this conversation shortly to assist you directly.`;
      break;
    }

    case "PAYMENT_PROBLEM": {
      escalated = true;
      const orders = await getMyOrders(customerId);
      const targetOrder = intentResult.entities.orderNumber
        ? orders.find((o) => o.orderNumber === intentResult.entities.orderNumber)
        : orders[0];

      toolCalls.push({ tool: "getMyOrders", args: { customerId }, result: orders });

      let refundInfo: any = null;
      if (targetOrder) {
        refundInfo = await getRefundStatus(customerId, targetOrder.orderNumber);
        toolCalls.push({ tool: "getRefundStatus", args: { orderNumber: targetOrder.orderNumber }, result: refundInfo });
      }

      const ticketRes = await createSupportTicket(
        customerId,
        conversationId,
        "PAYMENT",
        "URGENT",
        `Duplicate charge / payment problem reported on order ${targetOrder?.orderNumber || "recent order"}.`
      );
      ticketCreated = true;
      ticketNumber = ticketRes.ticketNumber;
      toolCalls.push({ tool: "createSupportTicket", args: { category: "PAYMENT", priority: "URGENT" }, result: ticketRes });

      const orderRefText = targetOrder ? `order ${targetOrder.orderNumber}` : "your recent orders";
      responseContent = `Hello ${firstName}. I've checked your account and reviewed ${orderRefText}. Because duplicate charge inquiries involve sensitive billing authorizations, I have automatically escalated this to our Senior Billing team with URGENT priority under ticket ${ticketNumber}.\n\nA billing specialist will review and void the pending authorization immediately. Would you also like us to send email updates regarding this ticket?`;
      break;
    }

    case "RETURN_REQUEST": {
      const orders = await getMyOrders(customerId);
      toolCalls.push({ tool: "getMyOrders", args: { customerId }, result: orders });

      const targetOrder = intentResult.entities.orderNumber
        ? orders.find((o) => o.orderNumber === intentResult.entities.orderNumber)
        : orders.find((o) => o.status === "DELIVERED") || orders[0];

      if (!targetOrder) {
        responseContent = `Hello ${firstName}! I couldn't find any recent delivered orders eligible for return on your account. Please let me know your order number if you placed one recently.`;
        break;
      }

      const eligibility = await checkReturnEligibility(customerId, targetOrder.orderNumber);
      toolCalls.push({ tool: "checkReturnEligibility", args: { orderNumber: targetOrder.orderNumber }, result: eligibility });

      if (eligibility.eligible) {
        const returnRes = await createReturnRequest(
          customerId,
          targetOrder.orderNumber,
          intentResult.entities.reason || "Customer return",
          targetOrder.items.map((i: { name: string }) => i.name)
        );
        toolCalls.push({ tool: "createReturnRequest", args: { orderNumber: targetOrder.orderNumber }, result: returnRes });

        responseContent = `Hello ${firstName}! I've verified your order ${targetOrder.orderNumber} (Delivered recently). It is fully eligible for our 30-day free return policy.\n\n✅ I have approved return request ${returnRes.returnNumber} for you! A prepaid FedEx return shipping label (Tracking: ${returnRes.trackingNumber}) is now available in your customer portal.\n\nOnce the package is scanned by FedEx, your refund of $${targetOrder.totalAmount.toFixed(2)} will process automatically.`;
      } else {
        responseContent = `Hello ${firstName}. I checked order ${targetOrder.orderNumber}, but ${eligibility.reason || "it cannot be returned at this time."} If you believe this is an error or your item arrived damaged, let me know and I will connect you with a representative!`;
      }
      break;
    }

    case "ORDER_STATUS":
    case "DELIVERY_DELAY": {
      const orders = await getMyOrders(customerId);
      toolCalls.push({ tool: "getMyOrders", args: { customerId }, result: orders });

      const targetOrder = intentResult.entities.orderNumber
        ? orders.find((o: any) => o.orderNumber === intentResult.entities.orderNumber)
        : orders[0];

      if (targetOrder) {
        const itemNames = targetOrder.items.map((i: { name: string }) => i.name).join(", ");
        if (targetOrder.status === "DELIVERED") {
          responseContent = `Hi ${firstName}! 👋 Your order ${targetOrder.orderNumber} containing ${itemNames} was delivered on ${new Date(targetOrder.deliveredAt || targetOrder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${targetOrder.trackingNumber ? ` via ${targetOrder.carrier} (Tracking: ${targetOrder.trackingNumber})` : ""}.\n\nIs there anything specific you need help with regarding this delivery?`;
        } else if (targetOrder.status === "SHIPPED") {
          responseContent = `Hi ${firstName}! Your order ${targetOrder.orderNumber} (${itemNames}) is currently in transit with ${targetOrder.carrier}.\n\n📦 Tracking Number: ${targetOrder.trackingNumber}\n🗓️ Estimated Delivery: ${targetOrder.estimatedDelivery ? new Date(targetOrder.estimatedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "In 2 business days"}`;
        } else {
          responseContent = `Hi ${firstName}! Your order ${targetOrder.orderNumber} is currently ${targetOrder.status} at our fulfillment center. You will receive tracking updates as soon as it departs.`;
        }
      } else {
        responseContent = `Hi ${firstName}! I checked your account and don't see any active orders right now. If you have an order confirmation number, please share it and I'll look it up!`;
      }
      break;
    }

    case "REFUND_STATUS": {
      const orders = await getMyOrders(customerId);
      const targetOrder = intentResult.entities.orderNumber
        ? orders.find((o) => o.orderNumber === intentResult.entities.orderNumber)
        : orders[0];

      if (targetOrder) {
        const refundInfo = await getRefundStatus(customerId, targetOrder.orderNumber);
        toolCalls.push({ tool: "getRefundStatus", args: { orderNumber: targetOrder.orderNumber }, result: refundInfo });

        responseContent = `Hello ${firstName}! For order ${targetOrder.orderNumber}, our standard refund processing time is 3-5 business days for credit cards or 24 hours for PayPal once items are received at our warehouse.`;
      } else {
        responseContent = `Hello ${firstName}! Please provide your order number so I can look up the exact refund status for you.`;
      }
      break;
    }

    case "GENERAL_FAQ": {
      const article = await getKnowledgeArticle(messageText);
      toolCalls.push({ tool: "getKnowledgeArticle", args: { query: messageText }, result: article });

      if (article.found) {
        responseContent = `Here is the official NovaMart policy regarding ${article.title}:\n\n${article.excerpt}\n\n* Standard Shipping: 3-5 business days (Free over $50)\n* Express Shipping: 2 business days ($14.99)\n* Returns: 30 days free return with prepaid labels.`;
      } else {
        responseContent = `At NovaMart, we offer 30-day free returns, fast 3-5 day standard shipping (free over $50), and a 1-year comprehensive warranty on all electronics. How can I assist you with your order?`;
      }
      break;
    }

    default: {
      responseContent = `Hello ${firstName}! 👋 I'm your NovaMart AI Support Assistant. I can help you track an order, start a return, check refund status, or answer store policy questions. What can I do for you today?`;
      break;
    }
  }

  if (onProgress) {
    onProgress({ type: "thinking", data: "Thinking..." });
    for (const tc of toolCalls) {
      onProgress({ type: "tool_call", data: { tool: tc.tool, status: "completed", result: tc.result } });
    }
    const words = responseContent.split(" ");
    for (let w = 0; w < words.length; w++) {
      onProgress({ type: "token", data: (w > 0 ? " " : "") + words[w] });
    }
  }

  return {
    content: responseContent,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    risk: intentResult.risk,
    toolCalls,
    escalated,
    ticketCreated,
    ticketNumber,
  };
}

/**
 * OpenRouter chat completion caller with timeout (OpenAI-compatible API).
 */
async function callOpenRouterCompletion(params: {
  apiKey: string;
  modelChain: string[];
  messages: Array<Record<string, unknown>>;
}): Promise<any> {
  const { apiKey, modelChain, messages } = params;

  // Try each model in the configured chain, in order. Move to the next model
  // only when the current one fails (missing endpoints, rate limit, outage…).
  let lastError: unknown = null;
  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "NovaMart Support OS",
        },
        body: JSON.stringify({
          model,
          messages,
          tools: OPENROUTER_TOOLS,
          tool_choice: "auto",
          temperature: 0.3,
          // Free models often burn tokens on hidden reasoning before content —
          // a 700 cap truncated responses to empty strings on those models.
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = "";
        try {
          detail = (await response.text()).slice(0, 300);
        } catch {
          // ignore body read errors
        }
        throw new Error(`OpenRouter request failed (HTTP ${response.status})${detail ? `: ${detail}` : ""}`);
      }

      const data = await response.json();

      // OpenRouter can return HTTP 200 with an { error: {...} } envelope
      // (provider outages, free-tier rate limits, moderation). Without this
      // check the envelope was treated as a success with no choices, yielding
      // an empty AI reply instead of failing over to the next model.
      if (data?.error?.message) {
        throw new Error(`OpenRouter model error: ${String(data.error.message).slice(0, 200)}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      // Safe log: model name + sanitized failure reason only — never the API key.
      const safeMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[OpenRouter] Model "${model}" unavailable (${safeMessage.slice(0, 160)}) — trying next in chain.`);
      if (i === modelChain.length - 1) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter model chain is empty");
}

async function callOpenRouterStreaming(params: {
  apiKey: string;
  model: string;
  messages: Array<Record<string, unknown>>;
  onToken: (token: string) => void;
}): Promise<string> {
  const { apiKey, model, messages, onToken } = params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "NovaMart Support OS",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter stream failed with HTTP ${response.status}`);
    }

    let fullText = "";
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream available");
    const decoder = new TextDecoder();
    let isThinking = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
              if (token.includes("<think>")) isThinking = true;
              if (isThinking) {
                if (token.includes("</think>")) isThinking = false;
                continue;
              }
              onToken(token);
            }
          } catch {}
        }
      }
    }

    return fullText
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^Here's a thinking process:[\s\S]*?\n\n/i, "")
      .trim();
  } finally {
    clearTimeout(timeout);
  }
}

  /**
 * Execute a controlled AI tool server-side. The authenticated customerId is
 * injected here — tool arguments from the model are never trusted for identity.
 */
async function dispatchTool(params: {
  customerId: string;
  conversationId?: string;
  tool: string;
  args: Record<string, any>;
}): Promise<ToolExecution> {
  const { customerId, conversationId, tool, args } = params;
  const timestamp = new Date().toISOString();
  const orderRef = String(args.orderNumber || args.orderNumberOrId || "").trim();

  switch (tool) {
    case "getMyOrders":
      return { tool, args, result: await getMyOrders(customerId), timestamp };
    case "getOrderDetails":
      return { tool, args, result: await getOrderDetails(customerId, orderRef), timestamp };
    case "checkReturnEligibility":
      return { tool, args, result: await checkReturnEligibility(customerId, orderRef, args.productId), timestamp };
    case "createReturnRequest":
      return {
        tool,
        args,
        result: await createReturnRequest(customerId, orderRef, args.reason || "Customer return", args.itemNames),
        timestamp,
      };
    case "getRefundStatus":
      return { tool, args, result: await getRefundStatus(customerId, orderRef), timestamp };
    case "getProductDetails":
      return { tool, args, result: await getProductDetails(args.productName || args.productId || ""), timestamp };
    case "getKnowledgeArticle":
      return { tool, args, result: await getKnowledgeArticle(args.query || args.topic || ""), timestamp };
    case "requestHumanAgent":
      return {
        tool,
        args,
        result: await createSupportTicket(
          customerId,
          conversationId,
          "HUMAN_AGENT_REQUEST",
          "HIGH",
          args.reason || "Customer requested human assistance."
        ),
        timestamp,
      };
    case "createSupportTicket":
      return {
        tool,
        args,
        result: await createSupportTicket(
          customerId,
          conversationId,
          args.category || "GENERAL",
          args.priority === "URGENT" ? "URGENT" : args.priority === "HIGH" ? "HIGH" : "MEDIUM",
          args.description || args.summary || ""
        ),
        timestamp,
      };
    case "updateEmailPreference":
      return { tool, args, result: await updateEmailPreference(customerId, Boolean(args.enabled)), timestamp };
    default:
      return { tool, args, result: { error: `Unknown tool: ${tool}` }, timestamp };
  }
}

function buildOpenRouterSystemMessage(params: {
  customerName: string;
  customerId: string;
  intentResult: IntentResult;
}): string {
  const { customerName, customerId, intentResult } = params;
  return `${CUSTOMER_SUPPORT_SYSTEM_PROMPT}

AUTHENTICATED CUSTOMER CONTEXT (server-verified — never ask for identity):
- Name: ${customerName}
- Customer ID: ${customerId}

TOOL-USAGE RULES (MANDATORY):
- You may ONLY reference real account, order, return, refund, or product information returned by the provided tools. NEVER invent order numbers, tracking numbers, amounts, dates, or statuses.
- Every customer-scoped tool is automatically authorized to the authenticated customer above by the backend. Never request or accept another customer's identifiers.
- If the customer refers to "my order", "it", "that order", or similar, call getMyOrders first and use the conversation history to match the relevant order instead of asking for an order number you already have.
- SELF-SERVICE LOOKUP: NEVER ask the customer to provide their order number, email, or any identifier you can retrieve yourself. When the customer references an item or order loosely (e.g. "my shoes", "my last order", "the sweater"), call getMyOrders and match the reference against the returned items yourself, then confirm your match with the customer before taking actions like returns.
- Always fetch a verified record with a tool before quoting specifics (dates, tracking numbers, refund status, return eligibility).
- VERBATIM FACTS: every monetary amount, date, ETA, status and tracking number you state MUST be copied EXACTLY as it appears in a tool result from this conversation (either a fresh tool call or a previous one). Never calculate, convert, round, estimate, or rephrase these values. If a value (e.g. an exact delivery date or a price) is not present in any tool result, fetch it with a tool; if no tool provides it, explicitly say you cannot confirm it.
- RETURN ELIGIBILITY: before telling a customer whether ANY order or item can be returned, you MUST call checkReturnEligibility for that order in this turn and quote its result. NEVER derive eligibility yourself from dates, delivery estimates, or assumptions (e.g. do not assume a shipped order will be eligible after delivery — instead call the tool, and if it says not eligible yet, explain why and offer to help again after delivery).
- If a customer asks about another customer's data or an order that does not belong to them, politely decline and offer help only with their own account.
- If the tools cannot confirm the requested information, clearly say you cannot confirm it and offer to escalate to a human specialist. Do NOT guess or approximate.

INTENT ANALYSIS (automated pre-classification — use as guidance only):
- Intent: ${intentResult.intent}
- Confidence: ${intentResult.confidence}
- Risk: ${intentResult.risk}
`;
}

/**
 * OpenRouter API caller with true tool orchestration (function calling).
 *
 * The model iterates: it may emit tool_calls (executed server-side through
 * dispatchTool with the authenticated customer scoping), then produce a final,
 * data-grounded answer using those verified results.
 */
async function executeOpenRouterChat(params: {
  apiKey: string;
  modelChain: string[];
  customerId: string;
  customerName: string;
  conversationId: string;
  messageText: string;
  chatHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  intentResult: IntentResult;
  onProgress?: (event: ChatProgressEvent) => void;
}): Promise<AIResponsePayload> {
  const { apiKey, modelChain, customerId, customerName, conversationId, messageText, chatHistory, intentResult, onProgress } = params;

  onProgress?.({ type: "thinking", data: "Thinking..." });

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: buildOpenRouterSystemMessage({ customerName, customerId, intentResult }) },
    // Strip any stray "system" entries from stored history — a mid-conversation
    // system message would sit AFTER our instruction block and could override it.
    ...chatHistory
      .filter((m) => m.role !== "system")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: messageText },
  ];

  const executedTools: ToolExecution[] = [];
  let escalated = false;
  let ticketCreated = false;
  let ticketNumber: string | undefined;
  let finalContent = "";

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const data = await callOpenRouterCompletion({ apiKey, modelChain, messages });
    const choice = data?.choices?.[0];
    const assistantMsg = choice?.message;
    const toolCalls = assistantMsg?.tool_calls;

    if (!assistantMsg) break;

    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      // Echo the assistant's tool calls so the conversation stays coherent.
      messages.push({
        role: "assistant",
        content: assistantMsg.content || null,
        tool_calls: toolCalls.map((tc: any, idx: number) => ({
          id: tc.id || `call_${round}_${idx}`,
          type: "function",
          function: {
            name: tc.function?.name,
            arguments: typeof tc.function?.arguments === "object"
              ? JSON.stringify(tc.function.arguments)
              : (tc.function?.arguments || "{}"),
          },
        })),
      });

      for (let idx = 0; idx < toolCalls.length; idx++) {
        const tc = toolCalls[idx];
        const callId = tc.id || `call_${round}_${idx}`;
        const toolName = String(tc.function?.name || "");
        let argsObj: Record<string, any> = {};
        try {
          const rawArgs = tc.function?.arguments;
          // Some models send arguments as an object instead of a JSON string;
          // JSON.parse(object) coerces to "[object Object]" and loses the args.
          if (rawArgs && typeof rawArgs === "object") {
            argsObj = rawArgs;
          } else {
            argsObj = JSON.parse(rawArgs || "{}");
          }
        } catch {
          argsObj = { parseError: tc.function?.arguments };
        }

        const execution = await dispatchTool({ customerId, conversationId, tool: toolName, args: argsObj });
        executedTools.push(execution);
        onProgress?.({ type: "tool_call", data: { tool: toolName, status: "completed", result: execution.result } });

        messages.push({
          role: "tool",
          tool_call_id: callId,
          content: JSON.stringify(execution.result),
        });

        if (toolName === "requestHumanAgent" && execution.result?.ticketNumber) {
          escalated = true;
          ticketCreated = true;
          ticketNumber = execution.result.ticketNumber;
        }
        // createSupportTicket is ALSO an escalation: without this, the chat
        // route overwrote the tool's NEEDS_HUMAN status back to AI_HANDLING,
        // and the defense-in-depth block below would mint a duplicate ticket.
        if (toolName === "createSupportTicket" && execution.result?.ticketNumber) {
          escalated = true;
          ticketCreated = true;
          ticketNumber = execution.result.ticketNumber;
        }
      }

      continue; // Let the model produce the final answer with tool results.
    }

    finalContent = (assistantMsg.content || "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^Here's a thinking process:[\s\S]*?\n\n/i, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*+/g, "")
      .trim();

    if (onProgress && finalContent) {
      const words = finalContent.split(" ");
      for (let w = 0; w < words.length; w++) {
        onProgress({ type: "token", data: (w > 0 ? " " : "") + words[w] });
      }
    }
    break;
    }
  } catch (error) {
    // If a side-effectful tool (ticket/return/preference) already ran, do NOT
    // rethrow: the local fallback engine would repeat the action and mint a
    // duplicate ticket/return for the same request. Preserve the work instead.
    const sideEffectfulTools = ["createSupportTicket", "createReturnRequest", "requestHumanAgent", "updateEmailPreference"];
    if (executedTools.some((t) => sideEffectfulTools.includes(t.tool))) {
      const safeMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[OpenRouter] Failed after side-effectful tool calls (${safeMessage.slice(0, 200)}) — preserving completed actions instead of re-running fallback.`);
    } else {
      throw error;
    }
  }

  if (!finalContent) {
    // Model produced no usable text (e.g. exhausted rounds / empty reply).
    // Be honest: only claim the human team was notified if we actually escalated.
    const firstName = customerName.split(" ")[0];
    finalContent = escalated
      ? `Hello ${firstName}, thank you for your patience. I've preserved our conversation and created ticket ${ticketNumber} — a human specialist will join you here shortly to continue where we left off.`
      : `Hello ${firstName}, I wasn't able to fully process that request just now. Could you try rephrasing it? If you'd prefer, I can connect you with a human specialist right away.`;
  }

  finalContent = finalContent.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "");

  // Defense-in-depth: always honor the rule engine's escalation directive, even
  // if the model produced a reply without requesting human escalation.
  if (intentResult.suggestedAction === "ESCALATE_HUMAN" && !escalated) {
    const priority =
      intentResult.risk === "CRITICAL" ? "URGENT" : intentResult.risk === "HIGH" ? "HIGH" : "MEDIUM";
    const category =
      intentResult.intent === "PAYMENT_PROBLEM"
        ? "PAYMENT"
        : intentResult.intent === "COMPLAINT"
        ? "COMPLAINT"
        : "GENERAL";
    const ticketRes = await createSupportTicket(
      customerId,
      conversationId,
      category,
      priority,
      `Escalated by AI support: ${intentResult.reasoning}`
    );
    escalated = true;
    ticketCreated = true;
    ticketNumber = ticketRes.ticketNumber;
    executedTools.push({
      tool: "createSupportTicket",
      args: { category, priority },
      result: ticketRes,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    content: finalContent,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    risk: intentResult.risk,
    toolCalls: executedTools,
    escalated,
    ticketCreated,
    ticketNumber,
  };
}
