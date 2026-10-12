// GET & POST /api/customer/returns
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createReturnRequest, checkReturnEligibility } from "@/lib/ai/tools";

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const returns = await prisma.returnRequest.findMany({
      where: { customerId: session.customerId },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, returns });
  } catch (error) {
    console.error("Returns fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason } = body;

    const eligibility = await checkReturnEligibility(session.customerId, orderId);
    if (!eligibility.eligible) {
      return NextResponse.json({ success: false, error: eligibility.reason }, { status: 400 });
    }

    const result = await createReturnRequest(session.customerId, orderId, reason || "Customer portal request");
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Return creation error:", error);
    return NextResponse.json({ success: false, error: "Failed to create return request" }, { status: 500 });
  }
}
