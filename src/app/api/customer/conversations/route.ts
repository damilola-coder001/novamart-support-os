// GET /api/customer/conversations - Scoped Customer Conversations
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

    const url = new URL(req.url, "http://localhost:3000");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
    const cursor = url.searchParams.get("cursor");
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const tenantId = session.tenantId || "tenant_novamart_default";

    const total = await prisma.conversation.count({
      where: {
        customerId: session.customerId,
        tenantId,
      },
    });

    const conversations = await prisma.conversation.findMany({
      where: {
        customerId: session.customerId,
        tenantId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
        assignedAgent: {
          include: { user: true },
        },
        tickets: true,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset > 0 ? offset : undefined,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const hasMore = offset + conversations.length < total;
    const nextCursor = conversations.length > 0 ? conversations[conversations.length - 1].id : null;

    return NextResponse.json({
      success: true,
      conversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
        nextCursor: hasMore ? nextCursor : null,
      },
    });
  } catch (error) {
    console.error("Customer conversations fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}
