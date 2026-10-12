// GET /api/customer/notifications - Scoped Customer Notifications
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Generate notifications tailored to the customer
    const [orders, returns, tickets, emails] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: session.customerId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.returnRequest.findMany({
        where: { customerId: session.customerId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.ticket.findMany({
        where: { customerId: session.customerId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.emailEvent.findMany({
        where: { customerId: session.customerId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const notifications: any[] = [];

    // 1. Return notifications
    for (const ret of returns) {
      notifications.push({
        id: `notif-ret-${ret.id}`,
        type: "RETURN",
        title: `Return Request ${ret.returnNumber}`,
        subtitle: `Status: ${ret.status} • Refund: $${ret.refundAmount ? ret.refundAmount.toFixed(2) : "0.00"}`,
        message: `Your return request for reason "${ret.reason || "Return"}" is currently marked as ${ret.status.toLowerCase().replace("_", " ")}.`,
        returnNumber: ret.returnNumber,
        status: ret.status,
        refundAmount: ret.refundAmount,
        date: ret.createdAt,
        unread: false,
        actionUrl: "/customer",
        actionLabel: "View Returns",
      });
    }

    // 2. Order notifications
    for (const ord of orders) {
      notifications.push({
        id: `notif-ord-${ord.id}`,
        type: "ORDER",
        title: `Order ${ord.orderNumber} ${ord.status}`,
        subtitle: `Carrier: ${ord.carrier || "FedEx Ground"} • Tracking: ${ord.trackingNumber || "TRK-99201"}`,
        message:
          ord.status === "DELIVERED"
            ? `Your package with order ID ${ord.orderNumber} was successfully delivered on ${new Date(ord.deliveredAt || ord.createdAt).toLocaleDateString()}.`
            : `Your package ${ord.orderNumber} is currently ${ord.status.toLowerCase()} via ${ord.carrier || "Standard Shipping"}.`,
        orderNumber: ord.orderNumber,
        status: ord.status,
        trackingNumber: ord.trackingNumber,
        totalAmount: ord.totalAmount,
        date: ord.createdAt,
        unread: false,
        actionUrl: "/customer",
        actionLabel: "Track Order",
      });
    }

    // 3. Ticket notifications
    for (const tck of tickets) {
      notifications.push({
        id: `notif-tck-${tck.id}`,
        type: "TICKET",
        title: `Support Ticket ${tck.ticketNumber}`,
        subtitle: tck.status === "RESOLVED" ? "Resolved by Support Specialist" : `Priority: ${tck.priority} • Status: ${tck.status}`,
        message: `${tck.title}: ${tck.description || "Support ticket resolution in progress."}`,
        ticketNumber: tck.ticketNumber,
        status: tck.status,
        priority: tck.priority,
        date: tck.createdAt,
        unread: tck.status !== "RESOLVED",
        actionUrl: "/customer",
        actionLabel: "Open Live Chat",
      });
    }

    // 4. Email notifications
    for (const em of emails) {
      const recipient = em.recipientEmail || em.recipient || session.email;
      notifications.push({
        id: `notif-em-${em.id}`,
        type: "EMAIL",
        title: em.subject || "Email Notification from NovaMart",
        subtitle: `Sent to ${recipient}`,
        message: em.body || em.content || "An automated confirmation email was dispatched to your address.",
        template: em.templateType || em.template,
        recipient: recipient,
        date: em.createdAt,
        unread: false,
        actionUrl: "/customer",
        actionLabel: "View in Customer Portal",
      });
    }

    // Sort by date desc
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Customer notifications error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
