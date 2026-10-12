// POST /api/customer/feedback
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

export async function POST(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, rating, comment } = body;

    const feedback = await prisma.customerFeedback.upsert({
      where: { conversationId },
      update: {
        rating: Number(rating),
        comment: comment || null,
      },
      create: {
        conversationId,
        customerId: session.customerId,
        rating: Number(rating),
        comment: comment || null,
      },
    });

    await logActivity({
      actorType: "CUSTOMER",
      actorId: session.customerId,
      actorName: session.name,
      action: "CSAT_SUBMITTED",
      entityType: "Conversation",
      entityId: conversationId,
      details: { rating, comment },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}
