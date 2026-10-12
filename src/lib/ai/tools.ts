// NovaMart - Controlled AI Backend Tools with Server-Side Authorization
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity/logger";
import { sendAutomatedEmail } from "@/lib/email/service";
import { policySemanticIndex } from "@/lib/ai/embeddings";
import { eventHub } from "@/lib/events/hub";

/**
 * 1. getMyOrders - Retrieve list of authenticated customer's orders
 */
export async function getMyOrders(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } },
      returns: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  await logActivity({
    actorType: "AI",
    actorName: "NovaMart AI Engine",
    action: "AI_TOOL_CALLED",
    entityType: "Order",
    details: { tool: "getMyOrders", customerId, count: orders.length },
  });

  return orders.map((o: any) => ({
    orderNumber: o.orderNumber,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    estimatedDelivery: o.estimatedDelivery,
    deliveredAt: o.deliveredAt,
    items: o.items.map((i: any) => ({
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      isReturnEligible: i.isReturnEligible,
    })),
  }));
}

/**
 * 2. getOrderDetails - Retrieve a specific order, strictly enforcing ownership
 */
export async function getOrderDetails(customerId: string, orderNumberOrId: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId, // STRICT AUTHORIZATION CHECK
      OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }],
    },
    include: {
      items: { include: { product: true } },
      payments: true,
      returns: true,
    },
  });

  if (!order) {
    return {
      found: false,
      message: `No order matching "${orderNumberOrId}" was found in your account.`,
    };
  }

  await logActivity({
    actorType: "AI",
    actorName: "NovaMart AI Engine",
    action: "AI_TOOL_CALLED",
    entityType: "Order",
    entityId: order.id,
    details: { tool: "getOrderDetails", orderNumber: order.orderNumber },
  });

  return {
    found: true,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    estimatedDelivery: order.estimatedDelivery,
    items: order.items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      price: i.unitPrice,
      isReturnEligible: i.isReturnEligible,
    })),
    payments: order.payments.map((p: any) => ({
      status: p.status,
      method: p.method,
      amount: p.amount,
      lastFour: p.lastFour,
    })),
    returns: order.returns.map((r: any) => ({
      returnNumber: r.returnNumber,
      status: r.status,
      refundAmount: r.refundAmount,
    })),
  };
}

/**
 * 3. checkReturnEligibility - Verify if an order item is within the 30-day window
 */
export async function checkReturnEligibility(customerId: string, orderNumberOrId: string, productId?: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId,
      OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }],
    },
    include: {
      items: { include: { product: true } },
      returns: true,
    },
  });

  if (!order) {
    return { eligible: false, reason: "Order not found in your account." };
  }

  if (order.status !== "DELIVERED") {
    return {
      eligible: false,
      reason: `Order is currently ${order.status}. Returns can only be initiated after delivery.`,
    };
  }

  const deliveryDate = order.deliveredAt || order.createdAt;
  const rawDays = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24));
  // Clamp: seed/demo data can contain future deliveredAt dates which would yield
  // negative "days since delivery" and a daysRemaining larger than the window.
  const daysSinceDelivery = Math.max(0, rawDays);
  const maxDays = 30;

  if (daysSinceDelivery > maxDays) {
    return {
      eligible: false,
      daysSinceDelivery,
      reason: `This order was delivered ${daysSinceDelivery} days ago, exceeding the 30-day return policy window.`,
    };
  }

  // Check if already returned
  if (order.returns.length > 0) {
    return {
      eligible: false,
      existingReturn: order.returns[0].returnNumber,
      reason: `A return (${order.returns[0].returnNumber}) has already been opened for this order.`,
    };
  }

  return {
    eligible: true,
    orderNumber: order.orderNumber,
    daysSinceDelivery,
    daysRemaining: Math.max(0, maxDays - daysSinceDelivery),
    items: order.items.map((i: any) => ({
      id: i.id,
      name: i.product.name,
      price: i.unitPrice,
    })),
  };
}

/**
 * 4. createReturnRequest - Creates a verified return request and generates prepaid label
 */
export async function createReturnRequest(
  customerId: string,
  orderNumberOrId: string,
  reason: string,
  itemNamesOrIds?: string[]
) {
  const order = await prisma.order.findFirst({
    where: {
      customerId,
      OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }],
    },
    include: {
      customer: { include: { user: true } },
      items: { include: { product: true } },
      returns: true,
    },
  });

  if (!order) {
    return { success: false, message: "Order not found or unauthorized." };
  }

  // Policy guard: returns require a delivered order (checkReturnEligibility
  // enforces this too, but the model may call createReturnRequest directly).
  if (order.status !== "DELIVERED") {
    return {
      success: false,
      message: `Order ${order.orderNumber} is currently ${order.status}. Returns can only be initiated after delivery.`,
    };
  }

  // Duplicate guard: never open a second return for the same order.
  if (order.returns.length > 0) {
    return {
      success: false,
      message: `A return (${order.returns[0].returnNumber}) has already been opened for order ${order.orderNumber}.`,
      existingReturn: order.returns[0].returnNumber,
    };
  }

  // Resolve the specific items being returned. When the AI names items, return
  // only those and compute the refund from them; otherwise the whole order.
  let itemsToReturn = order.items;
  let refundAmount = order.totalAmount;
  if (itemNamesOrIds && itemNamesOrIds.length > 0) {
    const wanted = itemNamesOrIds.map((n) => n.toLowerCase().trim());
    const matched = order.items.filter(
      (i: any) =>
        wanted.includes(i.productId.toLowerCase()) ||
        wanted.includes(i.product.name.toLowerCase()) ||
        wanted.some((w: string) => i.product.name.toLowerCase().includes(w))
    );
    if (matched.length === 0) {
      return {
        success: false,
        message: `None of the specified items were found in order ${order.orderNumber}. Available items: ${order.items
          .map((i: any) => i.product.name)
          .join(", ")}.`,
      };
    }
    itemsToReturn = matched;
    refundAmount = Math.round(matched.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
  }

  // Collision-safe numbering: derive from the highest existing number instead
  // of count+1 (which reuses numbers after admin deletions).
  const existingReturns = await prisma.returnRequest.findMany();
  const maxReturnNum = existingReturns.reduce((max: number, r: any) => {
    const n = parseInt(String(r.returnNumber || "").replace("RET-", ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
  const returnNumber = `RET-${maxReturnNum + 1}`;
  const trackingNumber = `RET-FDX-${Math.floor(100000 + Math.random() * 900000)}`;

  const returnReq = await prisma.returnRequest.create({
    data: {
      returnNumber,
      orderId: order.id,
      customerId,
      status: "APPROVED",
      reason: reason || "Customer request",
      returnItems: JSON.stringify(
        itemsToReturn.map((i: any) => ({
          productId: i.productId,
          name: i.product.name,
          quantity: i.quantity,
          price: i.unitPrice,
        }))
      ),
      trackingNumber,
      refundAmount,
    },
  });

  // Log activity
  await logActivity({
    actorType: "AI",
    actorName: "NovaMart AI Engine",
    action: "RETURN_CREATED",
    entityType: "ReturnRequest",
    entityId: returnReq.id,
    details: { returnNumber, orderNumber: order.orderNumber, refundAmount },
  });

  // Send automated email if opted in
  await sendAutomatedEmail({
    customerId,
    recipientEmail: order.customer.user.email,
    recipientName: order.customer.user.name,
    templateType: "RETURN_APPROVED",
    subject: `Return Request ${returnNumber} Approved — Prepaid Label Attached`,
    metadata: {
      returnNumber,
      orderNumber: order.orderNumber,
      refundAmount,
      trackingNumber,
    },
  });

  return {
    success: true,
    returnNumber,
    trackingNumber,
    status: "APPROVED",
    refundAmount,
    itemsReturned: itemsToReturn.map((i: any) => i.product.name),
    carrier: "FedEx Express",
    instructions: "Your return has been approved! A prepaid FedEx return label has been emailed to you and is available in your portal.",
  };
}

/**
 * 5. getRefundStatus - Retrieve refund status for an order
 */
export async function getRefundStatus(customerId: string, orderNumberOrId: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId,
      OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }],
    },
    include: {
      payments: true,
      returns: true,
    },
  });

  if (!order) {
    return { found: false, message: "Order not found in your account." };
  }

  const disputedPayment = order.payments.find((p: any) => p.status === "DISPUTED");
  const refundedPayment = order.payments.find((p: any) => p.status === "REFUNDED");
  // Most recent return, not arbitrary array order.
  const activeReturn = [...order.returns].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return {
    found: true,
    orderNumber: order.orderNumber,
    hasDisputedPayment: Boolean(disputedPayment),
    hasRefundedPayment: Boolean(refundedPayment),
    activeReturnStatus: activeReturn?.status || null,
    // Only report a refund amount that actually exists — falling back to the
    // full order total fabricates a refund that was never requested.
    refundAmount: activeReturn?.refundAmount ?? refundedPayment?.amount ?? null,
    payments: order.payments.map((p: any) => ({
      status: p.status,
      amount: p.amount,
      method: p.method,
      lastFour: p.lastFour,
      transactionId: p.transactionId,
    })),
  };
}

/**
 * 6. getKnowledgeArticle - Search or fetch knowledge base policy/guide
 */
export async function getKnowledgeArticle(queryOrSlug: string) {
  const query = (queryOrSlug || "").toLowerCase().trim();

  // Blank query with `contains: ""` matches EVERY article — the tool would
  // return an arbitrary unrelated policy page instead of "not found".
  if (!query) {
    return { found: false, message: "No knowledge article query provided." };
  }

  // Try direct slug match or search query
  let article = await prisma.knowledgeArticle.findFirst({
    where: {
      isPublished: true,
      OR: [
        { slug: { contains: query } },
        { title: { contains: query } },
        { tags: { contains: query } },
        { category: { contains: query.toUpperCase() } },
      ],
    },
  });

  // If keyword substring search misses, use semantic vector space retrieval (RAG)
  if (!article) {
    const allArticles = await prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
    });
    if (allArticles.length > 0) {
      policySemanticIndex.indexDocuments(allArticles);
      const matches = policySemanticIndex.search(query, 1);
      if (matches.length > 0 && matches[0].score > 0.05) {
        article = matches[0].doc as any;
      }
    }
  }

  if (!article) {
    return { found: false, message: "No specific knowledge article matched." };
  }

  // Increment view count
  await prisma.knowledgeArticle.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    found: true,
    title: article.title,
    category: article.category,
    content: article.content,
    excerpt: article.excerpt,
  };
}

/**
 * 6b. getProductDetails - Look up a NovaMart product from the dummy catalog
 */
export async function getProductDetails(productNameOrId: string) {
  const query = (productNameOrId || "").toLowerCase().trim();

  // Blank query would match an arbitrary catalog entry.
  if (!query) {
    return { found: false, message: "No product name, SKU, or ID provided." };
  }

  // Exact id/sku match first — a bare ID must resolve to precisely one product,
  // not whatever entry happens to contain the string first.
  const exact = await prisma.product.findFirst({
    where: { OR: [{ id: query }, { sku: query }] },
  });

  const product =
    exact ||
    (await prisma.product.findFirst({
      where: {
        OR: [{ sku: { contains: query } }, { name: { contains: query } }, { category: { contains: query } }],
      },
    }));

  if (!product) {
    return { found: false, message: "Product not found in the current NovaMart catalog." };
  }

  await logActivity({
    actorType: "AI",
    actorName: "NovaMart AI Engine",
    action: "AI_TOOL_CALLED",
    entityType: "Product",
    entityId: product.id,
    details: { tool: "getProductDetails", product: product.name },
  });

  let specs: Record<string, unknown> | null = null;
  if (product.specs) {
    try {
      specs = typeof product.specs === "string" ? JSON.parse(product.specs) : product.specs;
    } catch {
      specs = null;
    }
  }

  return {
    found: true,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price,
    stock: product.stock,
    returnPolicyDays: product.returnPolicyDays,
    description: product.description,
    specs,
  };
}

/**
 * 7. createSupportTicket - Create an escalated support ticket
 */
export async function createSupportTicket(
  customerId: string,
  conversationId?: string,
  category = "GENERAL",
  priority = "MEDIUM",
  aiSummary = ""
) {
  const existingTickets = await prisma.ticket.findMany();
  const maxTicketNum = existingTickets.reduce((max, t) => {
    const n = parseInt(String(t.ticketNumber || "").replace("TCK-", ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 8800);
  const ticketNumber = `TCK-${maxTicketNum + 1}`;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      customerId,
      conversationId: conversationId || null,
      category,
      priority,
      status: "OPEN",
      aiSummary,
    },
    include: {
      customer: { include: { user: true } },
    },
  });

  // Update conversation status if conversationId provided. Wrapped: an invalid
  // conversation id must not throw AFTER the ticket was already created (that
  // would surface as a tool failure despite the ticket existing).
  if (conversationId) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: "NEEDS_HUMAN",
          priority,
          summary: aiSummary,
        },
      });
    } catch (err) {
      console.warn(
        `[tools] Could not update conversation ${conversationId} for ticket ${ticketNumber}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Notify support agents
  await prisma.notification.create({
    data: {
      recipientRole: "SUPPORT_AGENT",
      title: `🚨 New ${priority} Ticket: ${ticketNumber}`,
      message: `${ticket.customer.user.name} requires human assistance for ${category}.`,
      type: priority === "URGENT" ? "ESCALATION" : "TICKET_UPDATE",
      link: `/agent?ticket=${ticketNumber}`,
    },
  });

  // Log activity
  await logActivity({
    actorType: "AI",
    actorName: "NovaMart AI Engine",
    action: "TICKET_CREATED",
    entityType: "Ticket",
    entityId: ticket.id,
    details: { ticketNumber, category, priority },
  });

  // Send automated email if customer opted in
  await sendAutomatedEmail({
    customerId,
    recipientEmail: ticket.customer.user.email,
    recipientName: ticket.customer.user.name,
    templateType: "TICKET_CREATED",
    subject: `Support Ticket Opened [${ticketNumber}] — ${category}`,
    metadata: {
      ticketNumber,
      category,
      priority,
    },
  });

  // Notify real-time event hub for instant agent reflection
  eventHub.notifyTicketCreated(ticket);

  return {
    ticketNumber,
    status: "OPEN",
    priority,
    message: `Support ticket ${ticketNumber} has been created and assigned to our support queue.`,
  };
}

/**
 * 8. updateEmailPreference - Customer updates email notification opt-in
 */
export async function updateEmailPreference(customerId: string, emailNotifications: boolean) {
  // Guard: an unknown id would otherwise throw and surface as a 500 through
  // the AI/chat pipeline instead of a clean "not found" result.
  const existing = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!existing) {
    return { success: false, message: "Customer account not found." };
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { emailNotifications },
    include: { user: true },
  });

  await logActivity({
    actorType: "CUSTOMER",
    actorName: customer.user.name,
    action: "EMAIL_PREFERENCE_UPDATED",
    entityType: "User",
    entityId: customer.userId,
    details: { emailNotifications },
  });

  return {
    success: true,
    emailNotifications: customer.emailNotifications,
    message: customer.emailNotifications
      ? "You have successfully enabled email progress updates."
      : "You have disabled email updates. All notifications will remain in your live chat.",
  };
}
