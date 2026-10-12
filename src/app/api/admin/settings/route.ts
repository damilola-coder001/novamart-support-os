// GET & POST /api/admin/settings
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

let systemSettings = {
  aiModel: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
  hasApiKey: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 5),
  autoEscalateThreshold: 0.7,
  fallbackEnabled: true,
  emailNotificationsEnabled: true,
  defaultCarrier: "FedEx Express",
  returnWindowDays: 30,
};

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  return NextResponse.json({ success: true, settings: systemSettings });
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if ("response" in gate) return gate.response;

    const body = await req.json();
    systemSettings = {
      ...systemSettings,
      ...body,
    };
    return NextResponse.json({ success: true, settings: systemSettings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
