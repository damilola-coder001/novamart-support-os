// GET /api/agent/customers - Agent Customer Directory & Lookup
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || (session.role !== "SUPPORT_AGENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized. Agent or Admin required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase() || "";

    const customers = await prisma.customer.findMany({
      include: {
        user: true,
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        },
        returns: {
          orderBy: { createdAt: "desc" },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
        },
        conversations: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    const filtered = query
      ? customers.filter(
          (c) =>
            c.user.name.toLowerCase().includes(query) ||
            c.user.email.toLowerCase().includes(query) ||
            c.vipTier.toLowerCase().includes(query) ||
            c.orders.some((o: any) => o.orderNumber.toLowerCase().includes(query))
        )
      : customers;

    return NextResponse.json({ success: true, customers: filtered });
  } catch (error) {
    console.error("Agent customer lookup error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customer directory" }, { status: 500 });
  }
}
