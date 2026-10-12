// POST /api/customer/email-preference
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { updateEmailPreference } from "@/lib/ai/tools";

export async function POST(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const session = await getSessionUser(userCookie);

    if (!session || !session.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emailNotifications } = body;

    const res = await updateEmailPreference(session.customerId, Boolean(emailNotifications));
    return NextResponse.json(res);
  } catch (error) {
    console.error("Email pref error:", error);
    return NextResponse.json({ success: false, error: "Failed to update email preference" }, { status: 500 });
  }
}
