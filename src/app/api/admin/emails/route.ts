// GET /api/admin/emails - Mock Email System Viewer
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const templateType = searchParams.get("templateType");

    const where: any = {};
    if (templateType && templateType !== "ALL") {
      where.templateType = templateType;
    }

    const emailEvents = await prisma.emailEvent.findMany({
      where,
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, emailEvents, emails: emailEvents });
  } catch (error) {
    console.error("Email events fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch email events" }, { status: 500 });
  }
}
