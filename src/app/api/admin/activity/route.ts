// GET /api/admin/activity - Admin Audit Timeline
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireStaff(req);
    if ("response" in gate) return gate.response;

    const { searchParams } = new URL(req.url);
    const actorType = searchParams.get("actorType");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (actorType && actorType !== "ALL") {
      where.actorType = actorType;
    }
    if (action && action !== "ALL") {
      where.action = action;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Activity logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
