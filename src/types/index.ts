// NovaMart Support Platform - Type Definitions

export type UserRole = "CUSTOMER" | "SUPPORT_AGENT" | "ADMIN";

export type VipTier = "STANDARD" | "SILVER" | "GOLD" | "PLATINUM";

export type OrderStatus = "PROCESSING" | "SHIPPED" | "DELIVERED" | "DELAYED" | "CANCELLED";

export type PaymentMethod = "CREDIT_CARD" | "PAYPAL" | "APPLE_PAY" | "STORE_CREDIT";

export type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED" | "DISPUTED";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "ITEM_RECEIVED" | "REFUNDED" | "COMPLETED";

export type ConversationStatus = "AI_HANDLING" | "NEEDS_HUMAN" | "AGENT_ACTIVE" | "RESOLVED" | "CLOSED";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "WAITING_FOR_INTERNAL_ACTION" | "RESOLVED" | "CLOSED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type IntentType =
  | "ORDER_STATUS"
  | "DELIVERY_DELAY"
  | "RETURN_REQUEST"
  | "REFUND_STATUS"
  | "PAYMENT_PROBLEM"
  | "PRODUCT_QUESTION"
  | "ACCOUNT_PROBLEM"
  | "GENERAL_FAQ"
  | "COMPLAINT"
  | "HUMAN_AGENT"
  | "EXCHANGE"
  | "UNKNOWN";

export type SenderType = "CUSTOMER" | "AI" | "AGENT" | "SYSTEM";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  vipTier?: VipTier;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedAction: "AUTO_RESOLVE" | "TOOL_LOOKUP" | "ESCALATE_HUMAN" | "REQUEST_CLARIFICATION";
  entities: {
    orderNumber?: string;
    productName?: string;
    reason?: string;
    returnEligible?: boolean;
    requestedHuman?: boolean;
  };
  reasoning: string;
}

export interface ToolExecution {
  tool: string;
  args: Record<string, any>;
  result: any;
  timestamp?: string;
}

export interface CopilotInsight {
  suggestedReply: string;
  summary: string;
  intent: IntentType;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  customerVipTier: VipTier;
  recommendedActions: {
    label: string;
    action: string;
    params?: Record<string, any>;
    variant?: "default" | "outline" | "destructive" | "secondary";
  }[];
  policyNotes: string[];
  warnings: string[];
}

export interface AIResponsePayload {
  content: string;
  intent: IntentType;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  toolCalls: ToolExecution[];
  escalated: boolean;
  ticketCreated?: boolean;
  ticketNumber?: string;
  suggestedActions?: string[];
}

